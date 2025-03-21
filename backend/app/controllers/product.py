import os
from pathlib import Path
from flask import Blueprint, request, jsonify, send_from_directory, url_for
from werkzeug.utils import secure_filename
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import product_collection
from bson import ObjectId

product_bp = Blueprint("product", __name__)

# Define upload folder using app config
UPLOAD_FOLDER = os.path.join(os.getcwd(), "uploads", "product_images")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Serve uploaded product images
@product_bp.route("/uploads/product_images/<filename>")
def serve_image(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

# 🔹 Add Product API (Authenticated)
@product_bp.route("/add", methods=["POST"])
@jwt_required()
def add_product():
    data = request.form
    image = request.files.get("image")

    # ✅ Extract seller ID from token
    seller_id = get_jwt_identity()

    name = data.get("name")
    description = data.get("description")
    price = data.get("price")
    category = data.get("category")

    if not all([name, description, price, category]):
        return jsonify(success=False, message="All fields are required"), 400

    image_url = None
    if image:
        filename = secure_filename(image.filename)
        saved_path = os.path.join(UPLOAD_FOLDER, filename)
        image.save(saved_path)

        # Generate image URL
        image_url = url_for("product.serve_image", filename=filename, _external=True)

    product = {
        "seller_id": seller_id,  # ✅ Store seller ID with the product
        "name": name,
        "description": description,
        "price": price,
        "category": category,
        "image": image_url
    }
    product_collection.insert_one(product)

    return jsonify(success=True, message="Product added successfully!", image_url=image_url)

# 🔹 Get Products for a Specific Seller (Authenticated)
@product_bp.route("/seller-list", methods=["GET"])
@jwt_required()
def get_seller_products():
    seller_id = get_jwt_identity()  # ✅ Extract seller ID from 
    # print(seller_id)
    products = list(product_collection.find({"seller_id": seller_id}, {"_id": 0}))

    return jsonify(success=True, products=products)

@product_bp.route("/list", methods=["GET"])
def get_products():
    products = list(product_collection.find())

    # Convert MongoDB ObjectId to string
    for product in products:
        product["_id"] = str(product["_id"])

    return jsonify(success=True, products=products)

@product_bp.route("/art/<string:art_id>", methods=["GET"])
def get_product(art_id):
    try:
        product = product_collection.find_one({"_id": ObjectId(art_id)})
        print(product)
        if not product:
            return jsonify(success=False, message="Product not found"), 404

        # Convert MongoDB ObjectId to string before sending JSON response
        product["_id"] = str(product["_id"])

        return jsonify(success=True, product=product)
    except Exception as e:
        return jsonify(success=False, message=str(e)), 500