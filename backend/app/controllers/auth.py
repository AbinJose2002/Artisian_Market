from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from werkzeug.security import generate_password_hash, check_password_hash
from app import bcrypt, users_collection

# Create auth blueprint
auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    # Add a proper body for the register function to fix the indentation error
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
    # Add a proper body for the login function
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
        # Generate access token
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
