from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from werkzeug.security import generate_password_hash, check_password_hash
from app import bcrypt, users_collection
from datetime import datetime, timezone

# Create auth blueprint
auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    if not data:
        return jsonify(success=False, message="No data provided"), 400
        
    # Extract user data
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify(success=False, message="Email and password are required"), 400
    
    # Check if user already exists
    if users_collection.find_one({"email": email}):
        return jsonify(success=False, message="Email already registered"), 400
    
    # Hash password and create user
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    
    # Create user document
    user = {
        "email": email,
        "password": hashed_password,
        "first_name": data.get('first_name', ''),
        "last_name": data.get('last_name', ''),
        "created_at": datetime.now()
    }
    
    # Insert user into database
    users_collection.insert_one(user)
    
    # Generate token for auto login
    token = create_access_token(identity=email)
    
    return jsonify(success=True, message="User registered successfully", token=token)

@auth_bp.route('/login', methods=['POST'])
def login():
    """User login endpoint with strict ban enforcement"""
    data = request.json
    if not data:
        return jsonify(success=False, message="No data provided"), 400
    
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify(success=False, message="Email and password are required"), 400
    
    # Find user in database
    user = users_collection.find_one({"email": email})
    
    # Check if user exists and password is correct
    if user and bcrypt.check_password_hash(user['password'], password):
        # STRICT BAN CHECKING
        
        # Check if user is permanently blocked
        if user.get('is_blocked', False):
            print(f"User {email} is permanently blocked")
            return jsonify(
                success=False, 
                message="Your account has been permanently blocked. Please contact support."
            ), 403
            
        # Check if user is temporarily banned
        if 'banned_until' in user and user['banned_until']:
            # Get current time in UTC for consistency
            current_time = datetime.now(timezone.utc)
            
            # Ensure ban_until is datetime with timezone
            ban_until = user['banned_until']
            if ban_until.tzinfo is None:
                # If ban_until doesn't have timezone, assume it's UTC
                ban_until = ban_until.replace(tzinfo=timezone.utc)
            
            # Debug output
            print(f"User {email} - Ban check")
            print(f"Current time (UTC): {current_time}")
            print(f"Ban until: {ban_until}")
            print(f"Is banned: {ban_until > current_time}")
            
            # Compare times with timezone awareness
            if ban_until > current_time:
                # Calculate remaining time
                time_diff = ban_until - current_time
                days = time_diff.days
                hours = time_diff.seconds // 3600
                
                if days > 0:
                    message = f"Your account is temporarily disabled for {days} more days and {hours} hours."
                else:
                    message = f"Your account is temporarily disabled for {hours} more hours."
                
                print(f"Login denied: {message}")
                return jsonify(success=False, message=message), 403
        
        # If we get here, user is not banned - create token
        token = create_access_token(identity=email)
        return jsonify(success=True, message="Login successful", token=token)
    
    return jsonify(success=False, message="Invalid email or password"), 401

@auth_bp.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    # This is a protected route that requires a valid JWT
    current_user = get_jwt_identity()
    return jsonify(logged_in_as=current_user), 200

# Make sure this file properly exports the blueprint
# The rest of the code remains unchanged
