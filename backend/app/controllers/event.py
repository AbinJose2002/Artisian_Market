import os
from flask import Blueprint, request, jsonify, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from app import db, users_collection
from bson import ObjectId
from datetime import datetime

# Create blueprint
event_bp = Blueprint('event', __name__)

# Get MongoDB collections
events_collection = db.get_collection("events")

# Set up upload folders
UPLOAD_FOLDER_POSTERS = os.path.join(os.getcwd(), "uploads", "event_posters")
os.makedirs(UPLOAD_FOLDER_POSTERS, exist_ok=True)

# Serve event poster images
@event_bp.route("/uploads/event_posters/<filename>")
def serve_poster(filename):
    return send_from_directory(UPLOAD_FOLDER_POSTERS, filename)

@event_bp.route("/list", methods=["GET"])
def get_all_events():
    """Get all upcoming events"""
    try:
        # Fetch all events from the database
        events = list(events_collection.find())
        
        # Format the events for response
        formatted_events = []
        for event in events:
            formatted_event = {
                "_id": str(event["_id"]),
                "name": event.get("name", ""),
                "description": event.get("description", ""),
                "type": event.get("type", "online"),
                "date": event.get("date", ""),
                "time": event.get("time", ""),
                "place": event.get("place", ""),
                "fee": event.get("fee", ""),
                "duration": event.get("duration", ""),
                "instructor_id": str(event.get("instructor_id", "")) if event.get("instructor_id") else "",
                "registered_users_count": len(event.get("registered_users", []))
            }
            
            # Add poster URL if available
            if event.get("poster"):
                poster_filename = event["poster"]
                formatted_event["poster"] = poster_filename
                formatted_event["poster_url"] = f"{request.host_url.rstrip('/')}/event/uploads/event_posters/{poster_filename}"
            
            formatted_events.append(formatted_event)
            
        return jsonify(success=True, events=formatted_events)
    
    except Exception as e:
        print(f"Error fetching events: {str(e)}")
        return jsonify(success=False, message=str(e)), 500

@event_bp.route("/<event_id>", methods=["GET"])
def get_event_details(event_id):
    """Get details for a specific event"""
    try:
        # Find event by ID
        event = events_collection.find_one({"_id": ObjectId(event_id)})
        
        if not event:
            return jsonify(success=False, message="Event not found"), 404
            
        # Format the event for response
        formatted_event = {
            "_id": str(event["_id"]),
            "name": event.get("name", ""),
            "description": event.get("description", ""),
            "type": event.get("type", "online"),
            "date": event.get("date", ""),
            "time": event.get("time", ""),
            "place": event.get("place", ""),
            "fee": event.get("fee", ""),
            "duration": event.get("duration", ""),
            "instructor_id": str(event.get("instructor_id", "")) if event.get("instructor_id") else "",
            "registered_users_count": len(event.get("registered_users", []))
        }
        
        # Add poster URL if available
        if event.get("poster"):
            poster_filename = event["poster"]
            formatted_event["poster"] = poster_filename
            formatted_event["poster_url"] = f"{request.host_url.rstrip('/')}/event/uploads/event_posters/{poster_filename}"
        
        return jsonify(success=True, event=formatted_event)
    
    except Exception as e:
        print(f"Error fetching event details: {str(e)}")
        return jsonify(success=False, message=str(e)), 500

@event_bp.route("/register/<event_id>", methods=["POST"])
@jwt_required()
def register_for_event(event_id):
    """Register a user for an event"""
    try:
        user_email = get_jwt_identity()
        
        # Find the event
        event = events_collection.find_one({"_id": ObjectId(event_id)})
        
        if not event:
            return jsonify(success=False, message="Event not found"), 404
            
        # Check if user is already registered
        registered_users = event.get("registered_users", [])
        
        for user in registered_users:
            if user.get("user_id") == user_email:
                return jsonify(success=False, message="You are already registered for this event"), 400
                
        # Add user to registered users list
        events_collection.update_one(
            {"_id": ObjectId(event_id)},
            {"$push": {"registered_users": {
                "user_id": user_email,
                "payment_status": "pending",
                "registration_date": datetime.now()
            }}}
        )
        
        return jsonify(success=True, message="Registration successful")
    
    except Exception as e:
        print(f"Error registering for event: {str(e)}")
        return jsonify(success=False, message=str(e)), 500

@event_bp.route("/user/registered", methods=["GET"])
@jwt_required()
def get_user_registered_events():
    """Get all events that the user is registered for"""
    try:
        user_email = get_jwt_identity()
        
        # Find all events where user is registered
        events = list(events_collection.find({
            "registered_users.user_id": user_email
        }))
        
        # Format events for response
        formatted_events = []
        for event in events:
            formatted_event = {
                "_id": str(event["_id"]),
                "name": event.get("name", ""),
                "description": event.get("description", ""),
                "type": event.get("type", "online"),
                "date": event.get("date", ""),
                "time": event.get("time", ""),
                "place": event.get("place", ""),
                "fee": event.get("fee", ""),
                "duration": event.get("duration", "")
            }
            
            # Add poster URL if available
            if event.get("poster"):
                poster_filename = event["poster"]
                formatted_event["poster"] = poster_filename
                formatted_event["poster_url"] = f"{request.host_url.rstrip('/')}/event/uploads/event_posters/{poster_filename}"
            
            # Add registration status
            for registration in event.get("registered_users", []):
                if registration.get("user_id") == user_email:
                    formatted_event["registration_status"] = registration.get("payment_status", "pending")
                    break
            
            formatted_events.append(formatted_event)
        
        return jsonify(success=True, events=formatted_events)
    
    except Exception as e:
        print(f"Error fetching registered events: {str(e)}")
        return jsonify(success=False, message=str(e)), 500

@event_bp.route("/filter", methods=["POST"])
def filter_events():
    """Filter events based on criteria"""
    try:
        data = request.json
        
        # Initialize query
        query = {}
        
        # Add filters
        if data.get("type"):
            query["type"] = data["type"]
            
        if data.get("date"):
            query["date"] = data["date"]
            
        if data.get("fee_range"):
            min_fee = data["fee_range"].get("min", 0)
            max_fee = data["fee_range"].get("max", float("inf"))
            
            # Convert fee to numeric for comparison
            query["fee"] = {"$gte": min_fee, "$lte": max_fee}
        
        # Find events based on query
        events = list(events_collection.find(query))
        
        # Format events for response
        formatted_events = []
        for event in events:
            formatted_event = {
                "_id": str(event["_id"]),
                "name": event.get("name", ""),
                "description": event.get("description", ""),
                "type": event.get("type", "online"),
                "date": event.get("date", ""),
                "time": event.get("time", ""),
                "place": event.get("place", ""),
                "fee": event.get("fee", ""),
                "duration": event.get("duration", "")
            }
            
            # Add poster URL if available
            if event.get("poster"):
                poster_filename = event["poster"]
                formatted_event["poster"] = poster_filename
                formatted_event["poster_url"] = f"{request.host_url.rstrip('/')}/event/uploads/event_posters/{poster_filename}"
            
            formatted_events.append(formatted_event)
        
        return jsonify(success=True, events=formatted_events)
    
    except Exception as e:
        print(f"Error filtering events: {str(e)}")
        return jsonify(success=False, message=str(e)), 500

@event_bp.route("/search", methods=["GET"])
def search_events():
    """Search events by name or description"""
    try:
        search_term = request.args.get("term", "")
        
        if not search_term:
            return jsonify(success=True, events=[])
            
        # Search in name and description
        events = list(events_collection.find({
            "$or": [
                {"name": {"$regex": search_term, "$options": "i"}},
                {"description": {"$regex": search_term, "$options": "i"}}
            ]
        }))
        
        # Format events for response
        formatted_events = []
        for event in events:
            formatted_event = {
                "_id": str(event["_id"]),
                "name": event.get("name", ""),
                "description": event.get("description", ""),
                "type": event.get("type", "online"),
                "date": event.get("date", ""),
                "time": event.get("time", ""),
                "place": event.get("place", ""),
                "fee": event.get("fee", ""),
                "duration": event.get("duration", "")
            }
            
            # Add poster URL if available
            if event.get("poster"):
                poster_filename = event["poster"]
                formatted_event["poster"] = poster_filename
                formatted_event["poster_url"] = f"{request.host_url.rstrip('/')}/event/uploads/event_posters/{poster_filename}"
            
            formatted_events.append(formatted_event)
        
        return jsonify(success=True, events=formatted_events)
    
    except Exception as e:
        print(f"Error searching events: {str(e)}")
        return jsonify(success=False, message=str(e)), 500

@event_bp.route("/cancel/<event_id>", methods=["POST"])
@jwt_required()
def cancel_registration(event_id):
    """Cancel a user's registration for an event"""
    try:
        user_email = get_jwt_identity()
        
        # Find the event
        event = events_collection.find_one({"_id": ObjectId(event_id)})
        
        if not event:
            return jsonify(success=False, message="Event not found"), 404
            
        # Check if user is registered
        registered_users = event.get("registered_users", [])
        user_registered = False
        
        for user in registered_users:
            if user.get("user_id") == user_email:
                user_registered = True
                break
                
        if not user_registered:
            return jsonify(success=False, message="You are not registered for this event"), 400
                
        # Remove user from registered users list
        events_collection.update_one(
            {"_id": ObjectId(event_id)},
            {"$pull": {"registered_users": {"user_id": user_email}}}
        )
        
        return jsonify(success=True, message="Registration cancelled successfully")
    
    except Exception as e:
        print(f"Error cancelling registration: {str(e)}")
        return jsonify(success=False, message=str(e)), 500

@event_bp.route("/update/<event_id>", methods=["PUT"])
@jwt_required()
def update_event(event_id):
    """Update an event (instructor only)"""
    try:
        instructor_email = get_jwt_identity()
        
        # Find the event
        event = events_collection.find_one({
            "_id": ObjectId(event_id),
            "instructor_id": {"$exists": True}
        })
        
        if not event:
            return jsonify(success=False, message="Event not found"), 404
            
        # Check if instructor owns this event
        from app import instructor_collection
        instructor = instructor_collection.find_one({"email": instructor_email})
        
        if not instructor or str(event.get("instructor_id")) != str(instructor["_id"]):
            return jsonify(success=False, message="Unauthorized to update this event"), 403
            
        # Get form data
        data = request.form
        
        # Prepare update data
        update_data = {}
        
        if data.get("name"):
            update_data["name"] = data["name"]
            
        if data.get("description"):
            update_data["description"] = data["description"]
            
        if data.get("type"):
            update_data["type"] = data["type"]
            
        if data.get("date"):
            update_data["date"] = data["date"]
            
        if data.get("time"):
            update_data["time"] = data["time"]
            
        if data.get("place") and data.get("type") == "offline":
            update_data["place"] = data["place"]
            
        if data.get("fee"):
            update_data["fee"] = data["fee"]
            
        if data.get("duration"):
            update_data["duration"] = data["duration"]
            
        # Handle poster file upload
        poster = request.files.get("poster")
        if poster:
            filename = secure_filename(poster.filename)
            saved_path = os.path.join(UPLOAD_FOLDER_POSTERS, filename)
            poster.save(saved_path)
            update_data["poster"] = filename
            
        # Update event
        events_collection.update_one(
            {"_id": ObjectId(event_id)},
            {"$set": update_data}
        )
        
        return jsonify(success=True, message="Event updated successfully")
    
    except Exception as e:
        print(f"Error updating event: {str(e)}")
        return jsonify(success=False, message=str(e)), 500
