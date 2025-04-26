from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime
import os
import traceback
from app import db, users_collection

# Create events collection reference
events_collection = db.get_collection("events")

# Create events blueprint
events_bp = Blueprint('events', __name__)

@events_bp.route('/list', methods=['GET'])
def get_events_list():
    """Get list of all public events"""
    try:
        # Find all events that are not private
        events = list(events_collection.find({"is_private": {"$ne": True}}))
        
        # Format events for response
        formatted_events = []
        for event in events:
            formatted_event = {
                "_id": str(event["_id"]),
                "name": event.get("name", "Untitled Event"),
                "description": event.get("description", ""),
                "type": event.get("type", "offline"),
                "date": event.get("date", ""),
                "time": event.get("time", ""),
                "fee": event.get("fee", 0),
                "duration": event.get("duration", 1),
                "place": event.get("place", ""),
                "poster": event.get("poster", None),
                "instructor_id": str(event["instructor_id"]) if "instructor_id" in event else None
            }
            formatted_events.append(formatted_event)
            
        return jsonify(success=True, events=formatted_events)
        
    except Exception as e:
        print(f"Error fetching events: {str(e)}")
        traceback.print_exc()
        return jsonify(success=False, message=str(e)), 500

@events_bp.route('/<event_id>', methods=['GET'])
def get_event_details(event_id):
    """Get details of a specific event"""
    try:
        event = events_collection.find_one({"_id": ObjectId(event_id)})
        
        if not event:
            return jsonify(success=False, message="Event not found"), 404
            
        # Format event for response
        formatted_event = {
            "_id": str(event["_id"]),
            "name": event.get("name", "Untitled Event"),
            "description": event.get("description", ""),
            "type": event.get("type", "offline"),
            "date": event.get("date", ""),
            "time": event.get("time", ""),
            "fee": event.get("fee", 0),
            "duration": event.get("duration", 1),
            "place": event.get("place", ""),
            "poster": event.get("poster", None),
            "instructor_id": str(event["instructor_id"]) if "instructor_id" in event else None
        }
        
        return jsonify(success=True, event=formatted_event)
        
    except Exception as e:
        print(f"Error fetching event details: {str(e)}")
        return jsonify(success=False, message=str(e)), 500

@events_bp.route('/register/<event_id>', methods=['POST'])
@jwt_required()
def register_for_event(event_id):
    """Register the user for an event"""
    try:
        user_email = get_jwt_identity()
        
        # Check if the event exists
        event = events_collection.find_one({"_id": ObjectId(event_id)})
        if not event:
            return jsonify(success=False, message="Event not found"), 404
            
        # Check if the user is already registered
        if "registered_users" in event:
            for user in event["registered_users"]:
                if user.get("user_id") == user_email:
                    return jsonify(success=False, message="You are already registered for this event"), 400
                    
        # Register user for the event
        result = events_collection.update_one(
            {"_id": ObjectId(event_id)},
            {"$push": {"registered_users": {
                "user_id": user_email,
                "registration_date": datetime.now(),
                "payment_status": "pending"
            }}}
        )
        
        if result.modified_count > 0:
            return jsonify(success=True, message="Registration successful")
        else:
            return jsonify(success=False, message="Registration failed"), 400
            
    except Exception as e:
        print(f"Error registering for event: {str(e)}")
        return jsonify(success=False, message=str(e)), 500

@events_bp.route('/user/registered', methods=['GET'])
@jwt_required()
def get_user_registered_events():
    """Get list of events registered by the user"""
    try:
        user_email = get_jwt_identity()
        
        # Find all events where the user is registered
        events = list(events_collection.find(
            {"registered_users.user_id": user_email}
        ))
        
        # Format events for response
        formatted_events = []
        for event in events:
            # Find user's registration details
            registration = None
            for user in event.get("registered_users", []):
                if user.get("user_id") == user_email:
                    registration = user
                    break
                    
            formatted_event = {
                "_id": str(event["_id"]),
                "name": event.get("name", "Untitled Event"),
                "description": event.get("description", ""),
                "type": event.get("type", "offline"),
                "date": event.get("date", ""),
                "time": event.get("time", ""),
                "fee": event.get("fee", 0),
                "duration": event.get("duration", 1),
                "place": event.get("place", ""),
                "poster": event.get("poster", None),
                "registration_date": registration.get("registration_date").isoformat() if registration and registration.get("registration_date") else None,
                "payment_status": registration.get("payment_status", "pending") if registration else "pending"
            }
            formatted_events.append(formatted_event)
            
        return jsonify(success=True, events=formatted_events)
        
    except Exception as e:
        print(f"Error fetching user registered events: {str(e)}")
        return jsonify(success=False, message=str(e)), 500
