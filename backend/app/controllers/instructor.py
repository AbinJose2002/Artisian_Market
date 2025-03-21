# app/controllers/instructor.py

from flask import Blueprint, request, jsonify, current_app, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from werkzeug.utils import secure_filename
import os
import uuid
from bson.objectid import ObjectId

# Create the blueprint
instructor_bp = Blueprint('instructor', __name__)

# Create upload directories
UPLOAD_FOLDER_PROFILE = 'uploads/profile_photos'
UPLOAD_FOLDER_POSTER = 'uploads/event_posters'
os.makedirs(UPLOAD_FOLDER_PROFILE, exist_ok=True)
os.makedirs(UPLOAD_FOLDER_POSTER, exist_ok=True)

def save_file(file, folder):
    """Save uploaded file with a secure filename and return the filename"""
    if not file or file.filename == '':
        return None
        
    # Generate unique filename to prevent overwriting
    filename = secure_filename(file.filename)
    unique_filename = f"{uuid.uuid4().hex}_{filename}"
    file_path = os.path.join(folder, unique_filename)
    file.save(file_path)
    
    return unique_filename

@instructor_bp.route('/register', methods=['POST'])
def register():
    """Register a new instructor with profile photo"""
    from app import instructor_collection, bcrypt
    
    # Check if all required fields are present
    profile_photo = request.files.get('profile_photo')
    email = request.form.get("email")
    password = request.form.get("password")
    
    if not email or not password:
        return jsonify(success=False, message="Missing required fields"), 400

    # Check if email already exists
    if instructor_collection.find_one({"email": email}):
        return jsonify(success=False, message="Email already registered"), 400

    # Save profile photo if provided
    photo_filename = None
    if profile_photo:
        photo_filename = save_file(profile_photo, UPLOAD_FOLDER_PROFILE)

    # Hash password
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    # Prepare instructor data
    instructor_data = {
        "email": email,
        "password": hashed_password,
        "first_name": request.form.get("first_name"),
        "last_name": request.form.get("last_name"),
        "mobile": request.form.get("mobile"),
        "address": request.form.get("address"),
        "gender": request.form.get("gender"),
        "art_specialization": request.form.get("art_specialization"),
        "profile_photo": photo_filename
    }
    
    # Insert into database
    instructor_collection.insert_one(instructor_data)
    
    # Create token for automatic login
    token = create_access_token(identity=email)
    
    return jsonify(
        success=True, 
        message="Instructor registered successfully!",
        token=token
    )

@instructor_bp.route('/login', methods=['POST'])
def login():
    """Login an instructor and return JWT token"""
    from app import instructor_collection, bcrypt
    
    data = request.json
    email, password = data.get("email"), data.get("password")

    # Validate credentials
    user = instructor_collection.find_one({"email": email})
    if user and bcrypt.check_password_hash(user["password"], password):
        # Create access token
        token = create_access_token(identity=email)
        return jsonify(
            success=True, 
            message="Login successful", 
            token=token,
            instructor={
                "email": user["email"],
                "first_name": user.get("first_name", ""),
                "last_name": user.get("last_name", "")
            }
        )
    
    return jsonify(success=False, message="Invalid credentials"), 401

@instructor_bp.route('/add_event', methods=['POST'])
@jwt_required()
def add_event():
    from app import instructor_collection, events_collection
    
    instructor_email = get_jwt_identity()
    instructor = instructor_collection.find_one({"email": instructor_email})
    
    if not instructor:
        return jsonify(success=False, message="Instructor not found"), 404

    # Validate required fields
    data = request.form
    required_fields = ["name", "description", "type", "date", "time", "fee", "duration"]
    if any(not data.get(field) for field in required_fields):
        return jsonify(success=False, message="Missing required fields"), 400

    # Handle poster file upload
    poster_filename = None
    if 'poster' in request.files and request.files['poster'].filename:
        poster_filename = save_file(
            request.files['poster'], 
            UPLOAD_FOLDER_POSTER
        )

    # Create event object
    event = {
        "name": data.get("name"),
        "description": data.get("description"),
        "type": data.get("type"),
        "date": data.get("date"),
        "time": data.get("time"),
        "fee": data.get("fee"),
        "duration": data.get("duration"),
        "place": data.get("place") if data.get("type") == "offline" else None,
        "poster": poster_filename,
        "instructor_id": instructor["_id"],
        "registered_users": []
    }
    
    # Insert event into database
    event_id = events_collection.insert_one(event).inserted_id
    
    # Return success with event details
    return jsonify({
        "success": True, 
        "message": "Event added successfully!", 
        "event": {
            "id": str(event_id),
            "name": event["name"],
            "description": event["description"],
            "type": event["type"],
            "date": event["date"],
            "time": event["time"],
            "place": event["place"],
            "duration": event["duration"],
            "fee": event["fee"],
            "poster": poster_filename
        }
    })

@instructor_bp.route('/events', methods=['GET'])
@jwt_required()
def list_events():
    """List all events created by the authenticated instructor"""
    from app import instructor_collection, events_collection
    
    # Get instructor email from JWT token
    instructor_email = get_jwt_identity()
    instructor = instructor_collection.find_one({"email": instructor_email})
    
    if not instructor:
        return jsonify(success=False, message="Instructor not found"), 404

    # Fetch events by instructor ID
    events_cursor = events_collection.find({"instructor_id": instructor["_id"]})
    
    # Convert MongoDB ObjectId to string for JSON serialization
    events = []
    for event in events_cursor:
        event["_id"] = str(event["_id"])
        event["instructor_id"] = str(event["instructor_id"])
        events.append(event)
    
    return jsonify({
        "success": True, 
        "events": events
    })

@instructor_bp.route('/delete_event/<string:event_id>', methods=['DELETE'])
@jwt_required()
def delete_event(event_id):
    """Delete an event if it belongs to the authenticated instructor"""
    from app import instructor_collection, events_collection
    
    # Get instructor email from JWT token
    instructor_email = get_jwt_identity()
    instructor = instructor_collection.find_one({"email": instructor_email})
    
    if not instructor:
        return jsonify(success=False, message="Instructor not found"), 404

    # Find event by ID
    try:
        object_id = ObjectId(event_id)
    except:
        return jsonify(success=False, message="Invalid event ID"), 400
        
    event = events_collection.find_one({"_id": object_id})
    
    if not event:
        return jsonify(success=False, message="Event not found"), 404
        
    # Check if instructor owns this event
    if str(event["instructor_id"]) != str(instructor["_id"]):
        return jsonify(success=False, message="You don't have permission to delete this event"), 403
        
    # Delete poster file if it exists
    if event.get("poster"):
        try:
            os.remove(os.path.join(UPLOAD_FOLDER_POSTER, event["poster"]))
        except:
            # Continue even if file removal fails
            pass
            
    # Delete event from database
    events_collection.delete_one({"_id": object_id})
    
    return jsonify(success=True, message="Event deleted successfully")

@instructor_bp.route('/uploads/<path:folder>/<path:filename>')
def serve_uploads(folder, filename):
    """Serve uploaded files"""
    return send_from_directory(f'uploads/{folder}', filename)