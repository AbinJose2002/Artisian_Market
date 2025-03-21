import os
from flask import Blueprint, request, jsonify
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token
from werkzeug.utils import secure_filename
from app import users_collection, bcrypt

user_bp = Blueprint('user', __name__)

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

    # Insert user into MongoDB
    users_collection.insert_one({
        "email": email,
        "password": hashed_password,
        "first_name": fname,
        "last_name": lname,
        "mobile": mobile,
        "address": address,
        "profile_photo": filename  # Save file path or filename
    })

    return jsonify(success=True, message="User registered successfully!")

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
