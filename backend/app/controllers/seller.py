import os
from flask import Blueprint, request, jsonify
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from pymongo import MongoClient
from werkzeug.utils import secure_filename
from app import seller_collection, bcrypt

# Initialize Blueprint
seller_bp = Blueprint('seller', __name__)

# Set up upload folder
UPLOAD_FOLDER = "uploads/profile_photos"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# 🔹 Seller Registration (Accepts Image)
@seller_bp.route('/register', methods=['POST'])
def register_seller():
    data = request.form  # Form data for text fields
    image = request.files.get("profilePhoto")  # Image file

    # Extract fields
    first_name = data.get("first_name")
    last_name = data.get("last_name")
    email = data.get("email")
    password = data.get("password")
    mobile = data.get("mobile")
    shop_name = data.get("shop_name")
    shop_address = data.get("shop_address")
    gender = data.get("gender")

    if not all([first_name, last_name, email, password, mobile, shop_name, shop_address, gender]):
        return jsonify(success=False, message="All fields are required"), 400
    print(first_name)

    # Check if seller already exists
    if seller_collection.find_one({"email": email}):
        return jsonify(success=False, message="Email already registered"), 400

    # Hash the password
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    # Save image if provided
    image_path = None
    if image:
        filename = secure_filename(image.filename)
        image_path = os.path.join(UPLOAD_FOLDER, filename)
        image.save(image_path)  # Save image locally

    # Store seller in database
    seller_collection.insert_one({
        "firstName": first_name,
        "lastName": last_name,
        "email": email,
        "password": hashed_password,
        "mobile": mobile,
        "shopName": shop_name,
        "shopAddress": shop_address,
        "gender": gender,
        "profilePhoto": image_path  # Store image path
    })

    return jsonify(success=True, message="Seller registered successfully!")

# 🔹 Seller Login
@seller_bp.route('/login', methods=['POST'])
def login_seller():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    seller = seller_collection.find_one({"email": email})

    if seller and bcrypt.check_password_hash(seller["password"], password):
        # Generate JWT Token
        access_token = create_access_token(identity=email)
        return jsonify(success=True, token=access_token)

    return jsonify(success=False, message="Invalid email or password"), 401

# 🔹 Protected Route (Example)
@seller_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def seller_dashboard():
    seller_email = get_jwt_identity()
    seller = seller_collection.find_one({"email": seller_email}, {"_id": 0, "password": 0})
    return jsonify(success=True, seller=seller)
