import os
import uuid
from pathlib import Path
from werkzeug.utils import secure_filename
from flask import Blueprint, request, jsonify, send_from_directory, send_file, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime
from app import db  # Add this import to fix the NameError

complaints_bp = Blueprint("complaints", __name__)

# Collection references
complaints_collection = db.get_collection("complaints")
sellers_collection = db.get_collection("sellers")
instructors_collection = db.get_collection("instructors")
users_collection = db.get_collection("users")

# Define the upload folder properly, relative to the current directory
BASE_DIR = os.getcwd()
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads", "complaints")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Debug the actual path 
print(f"BASE_DIR: {BASE_DIR}")
print(f"Complaints UPLOAD_FOLDER: {UPLOAD_FOLDER}")

@complaints_bp.route("/list", methods=["GET"])
@jwt_required()
def get_seller_list():
    """Get list of all sellers for complaints form"""
    try:
        # This endpoint returns a simplified list of sellers for the dropdown
        sellers = list(sellers_collection.find({}, {
            "firstName": 1, 
            "lastName": 1,
            "shopName": 1,
            "email": 1
        }))
        
        # Format sellers for response
        formatted_sellers = []
        for seller in sellers:
            formatted_sellers.append({
                "_id": str(seller["_id"]),
                "firstName": seller.get("firstName", ""),
                "lastName": seller.get("lastName", ""),
                "shopName": seller.get("shopName", "Unnamed Shop"),
                "email": seller.get("email", "")
            })
            
        return jsonify(success=True, sellers=formatted_sellers)
        
    except Exception as e:
        print(f"Error fetching sellers list: {str(e)}")
        return jsonify(success=False, message=str(e)), 500

@complaints_bp.route("/instructor/list", methods=["GET"])
@jwt_required()
def get_instructor_list():
    """Get list of all instructors for complaints form"""
    try:
        # This endpoint returns a simplified list of instructors for the dropdown
        instructors = list(instructors_collection.find({}, {
            "first_name": 1, 
            "last_name": 1,
            "email": 1,
            "art_specialization": 1
        }))
        
        # Format instructors for response
        formatted_instructors = []
        for instructor in instructors:
            formatted_instructors.append({
                "_id": str(instructor["_id"]),
                "name": f"{instructor.get('first_name', '')} {instructor.get('last_name', '')}".strip() or "Unknown",
                "email": instructor.get("email", ""),
                "expertise": instructor.get("art_specialization", "")
            })
            
        return jsonify(success=True, instructors=formatted_instructors)
        
    except Exception as e:
        print(f"Error fetching instructors list: {str(e)}")
        return jsonify(success=False, message=str(e)), 500

@complaints_bp.route("/users/list", methods=["GET"])
@jwt_required()
def get_users_list():
    """Get list of all users for complaints dropdown"""
    try:
        # This endpoint returns a simplified list of users for the dropdown
        users = list(users_collection.find({}, {
            "email": 1, 
            "name": 1
        }))
        
        # Format users for response
        formatted_users = []
        for user in users:
            formatted_users.append({
                "_id": user.get("email", ""),  # Use email as ID for users
                "email": user.get("email", ""),
                "name": user.get("name", "")
            })
            
        return jsonify(success=True, users=formatted_users)
        
    except Exception as e:
        print(f"Error fetching users list: {str(e)}")
        return jsonify(success=False, message=str(e)), 500

@complaints_bp.route("/user", methods=["GET"])
@jwt_required()
def get_user_complaints():
    """Get all complaints for the current user"""
    try:
        user_identity = get_jwt_identity()
        
        # Find all complaints submitted by this user
        complaints = list(complaints_collection.find({"user_identity": user_identity}))
        
        # Format complaints for response
        formatted_complaints = []
        for complaint in complaints:
            formatted_complaint = {
                "_id": str(complaint["_id"]),
                "type": complaint.get("type", "unknown"),
                "entityId": complaint.get("entityId", ""),
                "entityName": complaint.get("entityName", "Unknown"),
                "subject": complaint.get("subject", ""),
                "description": complaint.get("description", ""),
                "severity": complaint.get("severity", "medium"),
                "status": complaint.get("status", "pending"),
                "adminResponse": complaint.get("adminResponse", None),  # Ensure adminResponse is included
                "createdAt": complaint.get("createdAt", datetime.now()),
                "updatedAt": complaint.get("updatedAt", None),
                "hasAttachment": complaint.get("attachment") is not None
            }
            
            # Convert ObjectId to string if present in entityId
            if isinstance(formatted_complaint["entityId"], ObjectId):
                formatted_complaint["entityId"] = str(formatted_complaint["entityId"])
                
            formatted_complaints.append(formatted_complaint)
            
        print(f"Returning {len(formatted_complaints)} complaints for user {user_identity}")
        return jsonify(success=True, complaints=formatted_complaints)
        
    except Exception as e:
        print(f"Error fetching user complaints: {str(e)}")
        return jsonify(success=False, message=str(e)), 500

@complaints_bp.route("/submit", methods=["POST"])
@jwt_required()
def submit_complaint():
    """Submit a new complaint"""
    try:
        user_identity = get_jwt_identity()
        
        # Get form data
        complaint_type = request.form.get("type")
        entity_id = request.form.get("entityId")
        entity_name = request.form.get("entityName", "Unknown")  # Get entity name from form data
        subject = request.form.get("subject")
        description = request.form.get("description")
        severity = request.form.get("severity", "medium")
        attachment = request.files.get("attachment")
        
        print(f"Received complaint submission: type={complaint_type}, entityId={entity_id}, entityName={entity_name}, subject={subject}, severity={severity}")
        
        # Validate required fields
        if not all([complaint_type, entity_id, subject, description]):
            return jsonify(success=False, message="Missing required fields"), 400
        
        # Initialize entity_name if not provided
        if not entity_name or entity_name == "Unknown":
            # Validate entity exists - handle ObjectId errors properly
            try:
                if complaint_type == "seller":
                    try:
                        entity = sellers_collection.find_one({"_id": ObjectId(entity_id)})
                        print(f"Looking for seller with _id: {entity_id}, found: {entity is not None}")
                        
                        # If not found by ID, try direct string comparison (for testing)
                        if not entity:
                            entity = sellers_collection.find_one({"_id": entity_id})
                            print(f"Looking for seller with _id as string: {entity_id}, found: {entity is not None}")
                        
                        if entity:
                            entity_name = entity.get("shopName") or f"{entity.get('firstName', '')} {entity.get('lastName', '')}"
                    except Exception as e:
                        print(f"Error finding seller by ID: {str(e)}")
                        # Try to find seller by other means, maybe it's an email or name
                        seller_by_email = sellers_collection.find_one({"email": entity_id})
                        if seller_by_email:
                            entity = seller_by_email
                            entity_name = entity.get("shopName") or f"{entity.get('firstName', '')} {entity.get('lastName', '')}"
                elif complaint_type == "instructor":
                    try:
                        entity = instructors_collection.find_one({"_id": ObjectId(entity_id)})
                        print(f"Looking for instructor with _id: {entity_id}, found: {entity is not None}")
                        
                        # If not found by ID, try direct string comparison (for testing)
                        if not entity:
                            entity = instructors_collection.find_one({"_id": entity_id})
                            print(f"Looking for instructor with _id as string: {entity_id}, found: {entity is not None}")
                        
                        if entity:
                            entity_name = f"{entity.get('first_name', '')} {entity.get('last_name', '')}".strip() or "Unknown Instructor"
                    except Exception as e:
                        print(f"Error finding instructor by ID: {str(e)}")
                        # Try to find instructor by other means, maybe it's an email
                        instructor_by_email = instructors_collection.find_one({"email": entity_id})
                        if instructor_by_email:
                            entity = instructor_by_email
                            entity_name = f"{entity.get('first_name', '')} {entity.get('last_name', '')}".strip() or "Unknown Instructor"
                elif complaint_type == "user":
                    # New user entity type
                    try:
                        entity = users_collection.find_one({"email": entity_id})
                        print(f"Looking for user with email: {entity_id}, found: {entity is not None}")
                        
                        if entity:
                            entity_name = entity.get("name") or entity.get("email", "Unknown User")
                    except Exception as e:
                        print(f"Error finding user by email: {str(e)}")
                else:
                    return jsonify(success=False, message="Invalid complaint type"), 400
            except Exception as e:
                print(f"Error validating entity: {str(e)}")
                entity_name = "Unknown"
        
        # For development - proceed even if entity_name is still unknown
        if entity_name == "Unknown":
            print(f"Entity name not found for type={complaint_type}, id={entity_id}")
            # For development, let's continue with a generic name
            if request.args.get("test") == "true":
                entity_name = f"Test {complaint_type.capitalize()}"
        
        # Save attachment if provided
        attachment_path = None
        if attachment:
            # Create a unique filename with timestamp
            filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{secure_filename(attachment.filename)}"
            # Use absolute path for storage
            attachment_path = os.path.join(UPLOAD_FOLDER, filename)
            print(f"Saving attachment to: {attachment_path}")
            attachment.save(attachment_path)
        
        # Create complaint document
        complaint = {
            "user_identity": user_identity,
            "type": complaint_type,
            "entityId": entity_id,
            "entityName": entity_name,
            "subject": subject,
            "description": description,
            "severity": severity,
            "status": "pending",
            "createdAt": datetime.now(),
            "attachment": attachment_path
        }
        
        # Insert complaint
        result = complaints_collection.insert_one(complaint)
        complaint_id = str(result.inserted_id)
        
        print(f"Complaint submitted successfully with ID: {complaint_id}")
        
        return jsonify(success=True, message="Complaint submitted successfully", complaint_id=complaint_id)
        
    except Exception as e:
        print(f"Error submitting complaint: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify(success=False, message=str(e)), 500

@complaints_bp.route("/admin/list", methods=["GET"])
@jwt_required()
def get_all_complaints():
    """Get all complaints (admin endpoint)"""
    try:
        # Get admin identity 
        admin_identity = get_jwt_identity()
        
        # In a production environment, you would validate 
        # that the user is an admin here
        
        # Get all complaints ordered by most recent first
        all_complaints = list(complaints_collection.find().sort("createdAt", -1))
        
        # Format for response
        formatted_complaints = []
        for complaint in all_complaints:
            formatted_complaints.append({
                "_id": str(complaint["_id"]),
                "user_identity": complaint.get("user_identity", ""),
                "type": complaint.get("type", "unknown"),
                "entityId": complaint.get("entityId", ""),
                "entityName": complaint.get("entityName", "Unknown"),
                "subject": complaint.get("subject", ""),
                "description": complaint.get("description", ""),
                "severity": complaint.get("severity", "medium"),
                "status": complaint.get("status", "pending"),
                "adminResponse": complaint.get("adminResponse", ""),
                "createdAt": complaint.get("createdAt", datetime.now()),
                "updatedAt": complaint.get("updatedAt", None),
                "hasAttachment": complaint.get("attachment") is not None
            })
            
        return jsonify(success=True, complaints=formatted_complaints)
        
    except Exception as e:
        print(f"Error fetching all complaints: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify(success=False, message=str(e)), 500

@complaints_bp.route("/admin/update/<complaint_id>", methods=["PUT"])
@jwt_required()
def update_complaint_status(complaint_id):
    """Update complaint status (admin endpoint)"""
    try:
        # Get admin identity
        admin_identity = get_jwt_identity()
        
        # Get request data
        data = request.json
        status = data.get("status")
        admin_response = data.get("adminResponse", "")
        
        if not status:
            return jsonify(success=False, message="Status is required"), 400
            
        valid_statuses = ["pending", "in_progress", "resolved", "rejected"]
        if status not in valid_statuses:
            return jsonify(success=False, message=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"), 400
            
        # Prepare update data
        update_data = {
            "status": status,
            "updatedAt": datetime.now(),
            "updatedBy": admin_identity
        }
        
        if admin_response:
            update_data["adminResponse"] = admin_response
            
        # Update complaint
        result = complaints_collection.update_one(
            {"_id": ObjectId(complaint_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            if complaints_collection.find_one({"_id": ObjectId(complaint_id)}):
                return jsonify(success=True, message="No changes were made")
            else:
                return jsonify(success=False, message="Complaint not found"), 404
                
        return jsonify(success=True, message="Complaint updated successfully")
        
    except Exception as e:
        print(f"Error updating complaint: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify(success=False, message=str(e)), 500

@complaints_bp.route("/admin/detail/<complaint_id>", methods=["GET"])
@jwt_required()
def get_complaint_detail(complaint_id):
    """Get detailed information about a complaint (admin endpoint)"""
    try:
        # Get admin identity
        admin_identity = get_jwt_identity()
        
        # Find complaint
        complaint = complaints_collection.find_one({"_id": ObjectId(complaint_id)})
        
        if not complaint:
            return jsonify(success=False, message="Complaint not found"), 404
            
        # Format complaint for response
        formatted_complaint = {
            "_id": str(complaint["_id"]),
            "user_identity": complaint.get("user_identity", ""),
            "type": complaint.get("type", "unknown"),
            "entityId": complaint.get("entityId", ""),
            "entityName": complaint.get("entityName", "Unknown"),
            "subject": complaint.get("subject", ""),
            "description": complaint.get("description", ""),
            "severity": complaint.get("severity", "medium"),
            "status": complaint.get("status", "pending"),
            "adminResponse": complaint.get("adminResponse", ""),
            "createdAt": complaint.get("createdAt", datetime.now()),
            "updatedAt": complaint.get("updatedAt", None),
            "attachment": complaint.get("attachment")
        }
            
        return jsonify(success=True, complaint=formatted_complaint)
        
    except Exception as e:
        print(f"Error fetching complaint detail: {str(e)}")
        return jsonify(success=False, message=str(e)), 500

@complaints_bp.route("/download/<complaint_id>", methods=["GET"])
@jwt_required()
def download_attachment(complaint_id):
    """Download complaint attachment"""
    try:
        user_identity = get_jwt_identity()
        
        # Find the complaint
        complaint = complaints_collection.find_one({"_id": ObjectId(complaint_id)})
        
        if not complaint:
            return jsonify(success=False, message="Complaint not found"), 404
            
        # Only allow the submitter or admins to download
        # TODO: Add proper admin check
        if complaint.get("user_identity") != user_identity:
            return jsonify(success=False, message="Not authorized to download this attachment"), 403
            
        # Check if attachment exists
        attachment_path = complaint.get("attachment")
        if not attachment_path or not os.path.exists(attachment_path):
            return jsonify(success=False, message="Attachment not found"), 404
            
        # Get filename from path
        filename = os.path.basename(attachment_path)
        directory = os.path.dirname(attachment_path)
        
        # Return file
        return send_from_directory(
            directory,
            filename,
            as_attachment=True
        )
        
    except Exception as e:
        print(f"Error downloading attachment: {str(e)}")
        return jsonify(success=False, message=str(e)), 500

@complaints_bp.route("/attachment/<complaint_id>", methods=["GET"])
@jwt_required()
def get_attachment_url(complaint_id):
    """Get the URL for a complaint attachment"""
    try:
        # Get admin identity
        admin_identity = get_jwt_identity()
        
        # Find complaint
        complaint = complaints_collection.find_one({"_id": ObjectId(complaint_id)})
        
        if not complaint:
            return jsonify(success=False, message="Complaint not found"), 404
            
        # Check if complaint has attachment
        attachment_path = complaint.get("attachment")
        if not attachment_path:
            return jsonify(success=False, message="No attachment found"), 404
            
        # Create a URL for the attachment
        filename = os.path.basename(attachment_path)
        attachment_url = f"http://localhost:8080/complaints/view-attachment/{complaint_id}"
        
        return jsonify(success=True, attachmentUrl=attachment_url, filename=filename)
        
    except Exception as e:
        print(f"Error getting attachment URL: {str(e)}")
        return jsonify(success=False, message=str(e)), 500

# New endpoint for viewing attachments without JWT requirement
@complaints_bp.route("/view-attachment/<complaint_id>", methods=["GET"])
def view_public_attachment(complaint_id):
    """View a complaint attachment without authentication"""
    try:
        # Find complaint
        complaint = complaints_collection.find_one({"_id": ObjectId(complaint_id)})
        
        if not complaint:
            return jsonify(success=False, message="Complaint not found"), 404
            
        # Check if complaint has attachment
        attachment_path = complaint.get("attachment")
        if not attachment_path:
            return jsonify(success=False, message="No attachment found for this complaint"), 404
        
        print(f"Original attachment path: {attachment_path}")
        
        # Fix path separators inconsistencies
        normalized_path = os.path.normpath(attachment_path)
        print(f"Normalized attachment path: {normalized_path}")
        
        # Extract the filename 
        filename = os.path.basename(normalized_path)
        
        # Rebuild the path relative to the correct base directory
        # This ensures we use the correct base directory regardless of how the path was stored
        correct_path = os.path.join(UPLOAD_FOLDER, filename)
        print(f"Reconstructed attachment path: {correct_path}")
        
        # Check if the file exists
        if not os.path.exists(correct_path):
            print(f"File not found at {correct_path}")
            return jsonify(success=False, message="Attachment file not found"), 404
        
        # Return the file
        try:
            print(f"Serving file from: {correct_path}")
            return send_file(correct_path, as_attachment=False)
        except Exception as e:
            print(f"Error serving file: {str(e)}")
            return jsonify(success=False, message=f"Error serving file: {str(e)}"), 500
        
    except Exception as e:
        print(f"Error in view_public_attachment: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify(success=False, message=str(e)), 500

# Add a new endpoint to directly get file content as base64 (as a fallback)
@complaints_bp.route("/attachment-data/<complaint_id>", methods=["GET"])
def get_attachment_data(complaint_id):
    """Get attachment file data as base64 encoded string"""
    try:
        # Find complaint
        complaint = complaints_collection.find_one({"_id": ObjectId(complaint_id)})
        
        if not complaint:
            return jsonify(success=False, message="Complaint not found"), 404
            
        # Check if complaint has attachment
        attachment_path = complaint.get("attachment")
        if not attachment_path:
            return jsonify(success=False, message="No attachment found for this complaint"), 404
        
        # Make sure the path exists
        if not os.path.exists(attachment_path):
            print(f"Attachment file not found at path: {attachment_path}")
            return jsonify(success=False, message="Attachment file not found"), 404
            
        # Read file and convert to base64
        import base64
        with open(attachment_path, "rb") as file:
            file_data = file.read()
            base64_data = base64.b64encode(file_data).decode('utf-8')
        
        # Get file type
        filename = os.path.basename(attachment_path)
        file_extension = os.path.splitext(filename)[1].lower()
        
        # Determine mime type
        mime_type = "application/octet-stream"  # default
        if file_extension in ['.jpg', '.jpeg']:
            mime_type = "image/jpeg"
        elif file_extension == '.png':
            mime_type = "image/png"
        elif file_extension == '.pdf':
            mime_type = "application/pdf"
        
        return jsonify(success=True, 
                      data=base64_data, 
                      mime_type=mime_type, 
                      filename=filename)
        
    except Exception as e:
        print(f"Error getting attachment data: {str(e)}")
        return jsonify(success=False, message=str(e)), 500

@complaints_bp.route("/public-attachment/<complaint_id>", methods=["GET"])
def get_public_attachment(complaint_id):
    """Get public URL for complaint attachment without authentication"""
    try:
        # Find complaint
        complaint = complaints_collection.find_one({"_id": ObjectId(complaint_id)})
        
        if not complaint:
            return jsonify(success=False, message="Complaint not found"), 404
            
        # Check if complaint has attachment
        attachment_path = complaint.get("attachment")
        if not attachment_path:
            return jsonify(success=False, message="No attachment found"), 404
            
        # Create a URL for the attachment
        filename = os.path.basename(attachment_path)
        
        # Return direct attachment info for display
        return jsonify(
            success=True, 
            attachmentUrl=f"http://localhost:8080/complaints/view-attachment/{complaint_id}",
            filename=filename,
            fileType=os.path.splitext(filename)[1].lower()
        )
        
    except Exception as e:
        print(f"Error getting public attachment URL: {str(e)}")
        return jsonify(success=False, message=str(e)), 500

# Add a new public endpoint for viewing attachments without authentication
@complaints_bp.route("/public-attachment/<complaint_id>", methods=["GET"])
def get_public_attachment_url(complaint_id):
    """Get public attachment URL for a complaint without authentication"""
    try:
        # Find complaint
        complaint = complaints_collection.find_one({"_id": ObjectId(complaint_id)})
        
        if not complaint:
            return jsonify(success=False, message="Complaint not found"), 404
            
        # Check if complaint has attachment
        attachment_path = complaint.get("attachment")
        if not attachment_path:
            return jsonify(success=False, message="No attachment found"), 404
            
        if not os.path.exists(attachment_path):
            return jsonify(success=False, message="Attachment file not found on server"), 404
            
        # Get filename and create a direct public URL
        filename = os.path.basename(attachment_path)
        attachment_url = f"/complaints/view-attachment/{complaint_id}"
        
        return jsonify(
            success=True, 
            attachmentUrl=attachment_url,
            filename=filename
        )
    except Exception as e:
        print(f"Error getting public attachment URL: {str(e)}")
        return jsonify(success=False, message=str(e)), 500

# Create a truly public endpoint for viewing attachment files
@complaints_bp.route("/view-attachment/<complaint_id>", methods=["GET"])
def view_attachment_public(complaint_id):
    """View a complaint attachment without any authentication"""
    try:
        # Find complaint
        complaint = complaints_collection.find_one({"_id": ObjectId(complaint_id)})
        
        if not complaint:
            return "Complaint not found", 404
            
        # Check if complaint has attachment
        attachment_path = complaint.get("attachment")
        if not attachment_path:
            return "No attachment found", 404
            
        if not os.path.exists(attachment_path):
            return "Attachment file not found on server", 404
            
        # Serve the file directly
        directory = os.path.dirname(attachment_path)
        filename = os.path.basename(attachment_path)
        
        return send_from_directory(directory, filename)
        
    except Exception as e:
        print(f"Error viewing attachment: {str(e)}")
        return str(e), 500

@complaints_bp.route('/create', methods=['POST'])
@jwt_required()
def create_complaint():
    """Create a new complaint"""
    try:
        # Get the authenticated user's identity
        complainant_identity = get_jwt_identity()
        
        # Get complaint data from request
        data = request.json
        if not data:
            return jsonify(success=False, message="No data provided"), 400
            
        # Required fields - changed from against_type to type
        required_fields = ['subject', 'description', 'type']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify(success=False, message=f"{field} is required"), 400
        
        # Create complaint document
        complaint = {
            'complainant_identity': complainant_identity,
            'complainant_type': data.get('complainant_type', 'user'),
            'complainant_email': data.get('complainant_email', complainant_identity),
            'complainant_name': data.get('complainant_name', 'Unknown'), 
            'type': data.get('type'),  # Changed from against_type to type
            'against_id': data.get('against_id', ''),
            'against_email': data.get('against_email', ''),
            'entityName': data.get('entityName', 'Unknown'),  # Changed from against_name to entityName
            'subject': data.get('subject'),
            'description': data.get('description'),
            'status': 'pending',  # pending, investigating, resolved, rejected
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'event_id': data.get('event_id', ''),
            'event_name': data.get('event_name', ''),
            'resolution': '',
            'resolution_date': None
        }
        
        # Insert complaint into database
        result = complaints_collection.insert_one(complaint)
        
        return jsonify({
            'success': True,
            'message': 'Complaint submitted successfully',
            'complaint_id': str(result.inserted_id)
        })
        
    except Exception as e:
        print(f"Error creating complaint: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify(success=False, message=str(e)), 500

@complaints_bp.route('/list', methods=['GET'])
@jwt_required()
def get_complaints_list():
    """Get all complaints for admin view"""
    try:
        # Get all complaints, sorted by creation date (newest first)
        complaints = list(complaints_collection.find().sort('created_at', -1))
        
        # Format complaints for response
        formatted_complaints = []
        for complaint in complaints:
            formatted_complaint = {
                '_id': str(complaint['_id']),
                'subject': complaint.get('subject', ''),
                'description': complaint.get('description', ''),
                'complainant_identity': complaint.get('complainant_identity', ''),
                'complainant_type': complaint.get('complainant_type', 'user'),
                'against_type': complaint.get('against_type', ''),
                'against_id': complaint.get('against_id', ''),
                'against_email': complaint.get('against_email', ''),
                'status': complaint.get('status', 'pending'),
                'created_at': complaint.get('created_at', datetime.utcnow()).isoformat(),
                'event_id': complaint.get('event_id', ''),
                'event_name': complaint.get('event_name', '')
            }
            formatted_complaints.append(formatted_complaint)
            
        return jsonify(success=True, complaints=formatted_complaints)
        
    except Exception as e:
        print(f"Error fetching complaints: {str(e)}")
        return jsonify(success=False, message=str(e)), 500

# Renamed route and function to avoid conflicts
@complaints_bp.route('/my-complaints', methods=['GET'])
@jwt_required()
def get_my_complaints():
    """Get complaints submitted by the authenticated user"""
    try:
        user_identity = get_jwt_identity()
        
        # Find complaints submitted by this user
        complaints = list(complaints_collection.find({
            'complainant_identity': user_identity
        }).sort('created_at', -1))
        
        # Format complaints for response
        formatted_complaints = []
        for complaint in complaints:
            formatted_complaint = {
                '_id': str(complaint['_id']),
                'subject': complaint.get('subject', ''),
                'description': complaint.get('description', ''),
                'against_type': complaint.get('against_type', ''),
                'status': complaint.get('status', 'pending'),
                'created_at': complaint.get('created_at', datetime.utcnow()).isoformat(),
                'resolution': complaint.get('resolution', ''),
                'event_name': complaint.get('event_name', '')
            }
            formatted_complaints.append(formatted_complaint)
            
        return jsonify(success=True, complaints=formatted_complaints)
        
    except Exception as e:
        print(f"Error fetching user complaints: {str(e)}")
        return jsonify(success=False, message=str(e)), 500

@complaints_bp.route('/<complaint_id>', methods=['GET'])
@jwt_required()
def get_complaint_details(complaint_id):
    """Get details of a specific complaint"""
    try:
        # Find the complaint by ID
        complaint = complaints_collection.find_one({'_id': ObjectId(complaint_id)})
        
        if not complaint:
            return jsonify(success=False, message="Complaint not found"), 404
            
        # Format complaint for response
        formatted_complaint = {
            '_id': str(complaint['_id']),
            'subject': complaint.get('subject', ''),
            'description': complaint.get('description', ''),
            'complainant_identity': complaint.get('complainant_identity', ''),
            'complainant_type': complaint.get('complainant_type', 'user'),
            'against_type': complaint.get('against_type', ''),
            'against_id': complaint.get('against_id', ''),
            'against_email': complaint.get('against_email', ''),
            'status': complaint.get('status', 'pending'),
            'created_at': complaint.get('created_at', datetime.utcnow()).isoformat(),
            'updated_at': complaint.get('updated_at', datetime.utcnow()).isoformat(),
            'event_id': complaint.get('event_id', ''),
            'event_name': complaint.get('event_name', ''),
            'resolution': complaint.get('resolution', ''),
            'resolution_date': complaint.get('resolution_date')
        }
            
        return jsonify(success=True, complaint=formatted_complaint)
        
    except Exception as e:
        print(f"Error fetching complaint details: {str(e)}")
        return jsonify(success=False, message=str(e)), 500

# Renamed endpoint to avoid conflict
@complaints_bp.route('/<complaint_id>/change-status', methods=['PUT'])
@jwt_required()
def change_complaint_status(complaint_id):
    """Update the status of a complaint (admin only)"""
    try:
        # Get data from request
        data = request.json
        if not data or 'status' not in data:
            return jsonify(success=False, message="Status is required"), 400
            
        # Valid status values
        valid_statuses = ['pending', 'investigating', 'resolved', 'rejected']
        if data['status'] not in valid_statuses:
            return jsonify(success=False, message=f"Status must be one of: {', '.join(valid_statuses)}"), 400
            
        # Update the complaint status
        result = complaints_collection.update_one(
            {'_id': ObjectId(complaint_id)},
            {
                '$set': {
                    'status': data['status'],
                    'updated_at': datetime.utcnow(),
                    'resolution': data.get('resolution', ''),
                    'resolution_date': datetime.utcnow() if data['status'] in ['resolved', 'rejected'] else None
                }
            }
        )
        
        if result.modified_count == 0:
            return jsonify(success=False, message="Complaint not found or status not changed"), 404
            
        return jsonify(success=True, message="Complaint status updated successfully")
        
    except Exception as e:
        print(f"Error updating complaint status: {str(e)}")
        return jsonify(success=False, message=str(e)), 500
