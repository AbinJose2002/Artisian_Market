import os
from flask import Blueprint, request, jsonify
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from bson import ObjectId
from app import users_collection, bcrypt, product_collection

user_bp = Blueprint('user_service', __name__)  # Changed the name to 'user_service'

UPLOAD_FOLDER = "uploads/profile_photos"
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@user_bp.route('/register', methods=['POST'])
def register():
    email = request.form.get("email")
    fname = request.form.get("first_name")
    lname = request.form.get("last_name")
    password = request.form.get("password")
    mobile = request.form.get("mobile")
    address = request.form.get("address")
    
    if "profile_photo" in request.files:
        file = request.files["profile_photo"]
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            file.save(filepath)
        else:
            return jsonify(success=False, message="Invalid file type"), 400
    else:
        filename = None  # No profile photo uploaded

    # Check if the user already exists
    if users_collection.find_one({"email": email}):
        return jsonify(success=False, message="Email already registered"), 400

    # Hash the password before storing it
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    # Insert user into MongoDB with initialized cart and wishlist
    user_data = {
        "email": email,
        "password": hashed_password,
        "first_name": fname,  # Ensure first name is stored
        "last_name": lname,   # Ensure last name is stored
        "mobile": mobile,     # Ensure mobile number is stored
        "address": address,
        "profile_photo": filename,
        "cart": [],  # Initialize empty cart array
        "wishlist": [],  # Initialize empty wishlist array
    }
    
    users_collection.insert_one(user_data)

    # Create token
    access_token = create_access_token(identity=email)
    
    return jsonify(success=True, message="User registered successfully!", token=access_token)

@user_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    user = users_collection.find_one({"email": email})

    if user and bcrypt.check_password_hash(user["password"], password):
        access_token = create_access_token(identity=email)
        return jsonify(success=True, token=access_token, profile_photo=user.get("profile_photo"))

    return jsonify(success=False, message="Invalid credentials"), 401

@user_bp.route('/cart', methods=['GET'])
@jwt_required()
def get_cart():
    try:
        user_email = get_jwt_identity()
        user = users_collection.find_one({'email': user_email})
        
        if not user:
            return jsonify(success=False, message="User not found"), 404
        
        # Return cart items if they exist, or empty array
        cart_ids = user.get('cart', [])
        cart_items = []
        
        if cart_ids:
            # Get product details for cart items
            cart_items = list(product_collection.find({'_id': {'$in': cart_ids}}))
            # Convert ObjectIds to strings
            for item in cart_items:
                item['_id'] = str(item['_id'])
                if 'seller_id' in item and isinstance(item['seller_id'], ObjectId):
                    item['seller_id'] = str(item['seller_id'])
        
        return jsonify(success=True, items=cart_items)
    
    except Exception as e:
        print(f"Error getting cart: {str(e)}")
        return jsonify(success=False, message=str(e)), 500

@user_bp.route('/wishlist', methods=['GET'])
@jwt_required()
def get_wishlist():
    try:
        user_email = get_jwt_identity()
        user = users_collection.find_one({'email': user_email})
        
        if not user:
            return jsonify(success=False, message="User not found"), 404
        
        # Return wishlist items if they exist, or empty array
        wishlist_ids = user.get('wishlist', [])
        wishlist_items = []
        
        if wishlist_ids:
            # Get product details for wishlist items
            wishlist_items = list(product_collection.find({'_id': {'$in': wishlist_ids}}))
            # Convert ObjectIds to strings
            for item in wishlist_items:
                item['_id'] = str(item['_id'])
                if 'seller_id' in item and isinstance(item['seller_id'], ObjectId):
                    item['seller_id'] = str(item['seller_id'])
        
        return jsonify(success=True, items=wishlist_items)
    
    except Exception as e:
        print(f"Error getting wishlist: {str(e)}")
        return jsonify(success=False, message=str(e)), 500

def convert_objectid_to_str(data):
    """Recursively convert ObjectId fields to strings in a dictionary or list."""
    if isinstance(data, dict):
        return {key: convert_objectid_to_str(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [convert_objectid_to_str(item) for item in data]
    elif isinstance(data, ObjectId):
        return str(data)
    return data

@user_bp.route('/details', methods=['GET'])
@jwt_required()
def get_user_details():
    try:
        user_email = get_jwt_identity()
        user = users_collection.find_one({"email": user_email}, {"password": 0})  # Exclude password from response

        if not user:
            return jsonify(success=False, message="User not found"), 404

        # Recursively convert ObjectId fields to strings
        user = convert_objectid_to_str(user)

        return jsonify(success=True, user=user)  # Ensure first_name, last_name, and mobile are included
    except Exception as e:
        print(f"Error fetching user details: {str(e)}")
        return jsonify(success=False, message="Failed to fetch user details"), 500

@user_bp.route('/update', methods=['PUT'])
@jwt_required()
def update_user():
    try:
        user_email = get_jwt_identity()
        user = users_collection.find_one({"email": user_email})

        if not user:
            return jsonify(success=False, message="User not found"), 404

        # Get form data
        update_data = {}
        for field in ['first_name', 'last_name', 'mobile', 'address']:
            if field in request.form:
                update_data[field] = request.form.get(field)

        # Handle profile photo upload
        if "profile_photo" in request.files:
            file = request.files["profile_photo"]
            if file and file.filename and allowed_file(file.filename):
                # Delete old profile photo if exists
                old_photo = user.get('profile_photo')
                if old_photo:
                    old_photo_path = os.path.join(UPLOAD_FOLDER, old_photo)
                    if os.path.exists(old_photo_path):
                        try:
                            os.remove(old_photo_path)
                        except Exception as e:
                            print(f"Error deleting old profile photo: {e}")

                # Save new profile photo
                filename = secure_filename(file.filename)
                filepath = os.path.join(UPLOAD_FOLDER, filename)
                file.save(filepath)
                update_data['profile_photo'] = filename

        if not update_data:
            return jsonify(success=False, message="No data to update"), 400

        # Update user in database
        result = users_collection.update_one(
            {"email": user_email},
            {"$set": update_data}
        )

        if result.modified_count > 0:
            return jsonify(success=True, message="Profile updated successfully")
        else:
            return jsonify(success=True, message="No changes made")

    except Exception as e:
        print(f"Error updating user profile: {str(e)}")
        return jsonify(success=False, message=f"Failed to update profile: {str(e)}"), 500
