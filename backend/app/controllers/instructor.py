# app/controllers/instructor.py

from flask import Blueprint, request, jsonify, current_app, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from werkzeug.utils import secure_filename
import os
import uuid
from bson.objectid import ObjectId
from app import (
    events_collection,
    instructor_collection,
    users_collection  # Add users_collection import
)

# Create the blueprint
instructor_bp = Blueprint('instructor', __name__)

# Create upload directories
UPLOAD_FOLDER_PROFILE = os.path.join(os.getcwd(), 'uploads', 'profile_photos')
UPLOAD_FOLDER_POSTER = os.path.join(os.getcwd(), 'uploads', 'event_posters')
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

@instructor_bp.route('/events/list', methods=['GET'])
def list_all_events():
    """List all events for public view"""
    try:
        from app import events_collection
        events = list(events_collection.find())
        
        # Debug logging
        print(f"Found {len(events)} events")
        
        processed_events = []
        for event in events:
            try:
                processed_event = {
                    '_id': str(event['_id']),
                    'name': event.get('name', ''),
                    'description': event.get('description', ''),
                    'type': event.get('type', ''),
                    'date': event.get('date', ''),
                    'time': event.get('time', ''),
                    'fee': event.get('fee', ''),
                    'duration': event.get('duration', ''),
                    'instructor_id': str(event.get('instructor_id', '')),
                }
                
                if event.get('poster'):
                    processed_event['poster'] = event['poster']
                    processed_event['poster_url'] = f"{request.host_url.rstrip('/')}/uploads/event_posters/{event['poster']}"
                
                processed_events.append(processed_event)
            except Exception as e:
                print(f"Error processing event {event.get('_id')}: {str(e)}")
                continue
        
        return jsonify(success=True, events=processed_events)
        
    except Exception as e:
        print(f"Server error in list_all_events: {str(e)}")
        return jsonify(success=False, message="Internal server error"), 500

@instructor_bp.route('/events/registered', methods=['GET'])
@jwt_required()
def get_registered_events():
    try:
        user_email = get_jwt_identity()
        if not user_email:
            return jsonify(success=False, message="Authentication required"), 401

        print(f"Fetching registered events for user: {user_email}")
        
        # Initialize empty events list
        processed_events = []
        
        try:
            # Find all events where user is registered
            events = list(events_collection.find({
                'registered_users.user_id': user_email
            }))
            
            print(f"Found {len(events)} events")
            
            # Process each event
            for event in events:
                processed_event = {
                    '_id': str(event['_id']),
                    'name': event.get('name'),
                    'description': event.get('description'),
                    'type': event.get('type'),
                    'date': event.get('date'),
                    'time': event.get('time'),
                    'fee': event.get('fee'),
                    'duration': event.get('duration'),
                    'place': event.get('place'),
                    'poster': event.get('poster'),
                    'instructor_id': str(event['instructor_id'])
                }
                
                # Find user's registration
                registration = next(
                    (reg for reg in event.get('registered_users', []) 
                     if reg['user_id'] == user_email),
                    None
                )
                
                if registration:
                    processed_event['registration_details'] = {
                        'payment_status': registration.get('payment_status', 'pending'),
                        'payment_date': registration.get('payment_date', '').strftime('%Y-%m-%d %H:%M:%S') if registration.get('payment_date') else None
                    }
                    processed_events.append(processed_event)
            
            return jsonify(success=True, events=processed_events)
            
        except Exception as e:
            print(f"Database error: {str(e)}")
            return jsonify(success=False, message="Database error"), 500
            
    except Exception as e:
        print(f"Error in get_registered_events: {str(e)}")
        return jsonify(success=False, message=str(e)), 500

@instructor_bp.route('/events/<event_id>/participants', methods=['GET'])
@jwt_required()
def get_event_participants(event_id):
    try:
        instructor_email = get_jwt_identity()
        instructor = instructor_collection.find_one({"email": instructor_email})
        
        if not instructor:
            return jsonify(success=False, message="Instructor not found"), 404

        event = events_collection.find_one({
            "_id": ObjectId(event_id),
            "instructor_id": instructor["_id"]
        })

        if not event:
            return jsonify(success=False, message="Event not found or unauthorized"), 404

        participants = []
        for registration in event.get('registered_users', []):
            user = users_collection.find_one({"email": registration['user_id']})
            if user:
                participants.append({
                    'email': user['email'],
                    'name': f"{user.get('first_name', '')} {user.get('last_name', '')}",
                    'payment_status': registration['payment_status'],
                    'payment_date': registration.get('payment_date', '').strftime('%Y-%m-%d %H:%M:%S') if registration.get('payment_date') else None
                })

        print(f"Found {len(participants)} participants for event {event_id}")
        return jsonify(success=True, participants=participants)

    except Exception as e:
        print(f"Error fetching participants: {str(e)}")
        return jsonify(success=False, message=str(e)), 500

@instructor_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    try:
        instructor_email = get_jwt_identity()
        instructor = instructor_collection.find_one({"email": instructor_email})
        
        if not instructor:
            return jsonify(success=False, message="Instructor not found"), 404

        profile = {
            'email': instructor['email'],
            'first_name': instructor.get('first_name', ''),
            'last_name': instructor.get('last_name', ''),
            'mobile': instructor.get('mobile', ''),
            'address': instructor.get('address', ''),
            'gender': instructor.get('gender', ''),
            'art_specialization': instructor.get('art_specialization', ''),
            'profile_photo': instructor.get('profile_photo')
        }
        
        return jsonify(success=True, profile=profile)

    except Exception as e:
        print(f"Error fetching profile: {str(e)}")
        return jsonify(success=False, message=str(e)), 500

@instructor_bp.route('/profile/update', methods=['PUT'])
@jwt_required()
def update_profile():
    try:
        instructor_email = get_jwt_identity()
        update_data = {}
        
        # Handle form data
        for field in ['first_name', 'last_name', 'mobile', 'address', 'gender', 'art_specialization']:
            if field in request.form:
                update_data[field] = request.form[field]

        # Handle profile photo
        if 'profile_photo' in request.files:
            photo = request.files['profile_photo']
            if photo.filename:
                filename = save_file(photo, UPLOAD_FOLDER_PROFILE)
                update_data['profile_photo'] = filename

        # Update profile
        result = instructor_collection.update_one(
            {"email": instructor_email},
            {"$set": update_data}
        )

        if result.modified_count:
            return jsonify(success=True, message="Profile updated successfully")
        return jsonify(success=True, message="No changes made")

    except Exception as e:
        print(f"Error updating profile: {str(e)}")
        return jsonify(success=False, message=str(e)), 500

@instructor_bp.route('/events/<event_id>', methods=['GET'])
@jwt_required()
def get_event_details(event_id):
    try:
        instructor_email = get_jwt_identity()
        instructor = instructor_collection.find_one({"email": instructor_email})
        
        if not instructor:
            return jsonify(success=False, message="Instructor not found"), 404

        event = events_collection.find_one({
            "_id": ObjectId(event_id),
            "instructor_id": instructor["_id"]
        })

        if not event:
            return jsonify(success=False, message="Event not found or unauthorized"), 404

        # Convert ObjectId to string for JSON serialization
        event['_id'] = str(event['_id'])
        event['instructor_id'] = str(event['instructor_id'])

        return jsonify(success=True, event=event)

    except Exception as e:
        print(f"Error fetching event details: {str(e)}")
        return jsonify(success=False, message=str(e)), 500