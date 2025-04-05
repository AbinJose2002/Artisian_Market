import os
from pathlib import Path
from flask import Blueprint, request, jsonify, send_from_directory, url_for
from werkzeug.utils import secure_filename
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import product_collection, users_collection
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
    quantity = data.get("quantity")

    if not all([name, description, price, category, quantity]):
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
        "quantity": int(quantity),  # Add quantity
        "image": image_url
    }
    product_collection.insert_one(product)

    return jsonify(success=True, message="Product added successfully!", image_url=image_url)

# 🔹 Verify Stock API
@product_bp.route("/verify/stock", methods=["POST"])
@jwt_required()
def verify_stock():
    try:
        product_id = request.json.get("product_id")
        quantity_requested = request.json.get("quantity", 1)
        
        product = product_collection.find_one({"_id": ObjectId(product_id)})
        if not product:
            return jsonify(success=False, message="Product not found"), 404
            
        if product["quantity"] < quantity_requested:
            return jsonify(success=False, message="Insufficient stock"), 400
            
        return jsonify(success=True, available=True)
    except Exception as e:
        return jsonify(success=False, message=str(e)), 500

# 🔹 Update Stock API
@product_bp.route("/update/stock", methods=["PUT"])
@jwt_required()
def update_stock():
    try:
        product_id = request.json.get("product_id")
        quantity_purchased = request.json.get("quantity", 1)
        
        result = product_collection.update_one(
            {"_id": ObjectId(product_id)},
            {"$inc": {"quantity": -quantity_purchased}}
        )
        
        if result.modified_count:
            return jsonify(success=True, message="Stock updated")
        return jsonify(success=False, message="Failed to update stock"), 400
    except Exception as e:
        return jsonify(success=False, message=str(e)), 500

# 🔹 Get Products for a Specific Seller (Authenticated)
@product_bp.route("/seller-list", methods=["GET"])
@jwt_required()
def get_seller_products():
    try:
        seller_id = get_jwt_identity()
        if not seller_id:
            return jsonify(success=False, message="Invalid token"), 401

        products = list(product_collection.find({"seller_id": seller_id}))
        
        # Include _id in response
        for product in products:
            product["_id"] = str(product["_id"])
        
        return jsonify(success=True, products=products)
    except Exception as e:
        return jsonify(success=False, message="Authentication failed"), 401

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

# 🔹 Update Product API
@product_bp.route("/update/<product_id>", methods=["PUT"])
@jwt_required()
def update_product(product_id):
    try:
        seller_id = get_jwt_identity()
        data = request.form
        image = request.files.get("image")

        # Verify product exists and belongs to seller
        existing_product = product_collection.find_one({
            "_id": ObjectId(product_id),
            "seller_id": seller_id
        })

        if not existing_product:
            return jsonify(success=False, message="Product not found or unauthorized"), 404

        # Prepare update data
        update_data = {
            "name": data.get("name"),
            "description": data.get("description"),
            "price": data.get("price"),
            "category": data.get("category"),
            "quantity": int(data.get("quantity")) if data.get("quantity") else existing_product["quantity"]
        }

        # Handle image update if new image provided
        if image:
            filename = secure_filename(image.filename)
            saved_path = os.path.join(UPLOAD_FOLDER, filename)
            image.save(saved_path)
            update_data["image"] = url_for("product.serve_image", filename=filename, _external=True)

        # Update product
        product_collection.update_one(
            {"_id": ObjectId(product_id)},
            {"$set": update_data}
        )

        return jsonify(success=True, message="Product updated successfully!")

    except Exception as e:
        return jsonify(success=False, message=str(e)), 500

# 🔹 Delete Product API
@product_bp.route("/delete/<product_id>", methods=["DELETE"])
@jwt_required()
def delete_product(product_id):
    try:
        seller_id = get_jwt_identity()

        # Verify product exists and belongs to seller
        result = product_collection.delete_one({
            "_id": ObjectId(product_id),
            "seller_id": seller_id
        })

        if result.deleted_count == 0:
            return jsonify(success=False, message="Product not found or unauthorized"), 404

        return jsonify(success=True, message="Product deleted successfully!")

    except Exception as e:
        return jsonify(success=False, message=str(e)), 500

@product_bp.route("/cart/add", methods=["POST"])
@jwt_required()
def add_to_cart():
    try:
        user_email = get_jwt_identity()
        product_id = request.json.get("product_id")
        
        if not product_id:
            return jsonify(success=False, message="Product ID is required"), 400
            
        # Check if product exists
        product = product_collection.find_one({"_id": ObjectId(product_id)})
        if not product:
            return jsonify(success=False, message="Product not found"), 404

        # Initialize cart if it doesn't exist
        result = users_collection.update_one(
            {"email": user_email},
            {"$addToSet": {"cart": ObjectId(product_id)}},
            upsert=True
        )

        if result.modified_count > 0 or result.upserted_id:
            return jsonify(success=True, message="Added to cart successfully")
        return jsonify(success=False, message="Item already in cart"), 200

    except Exception as e:
        print(f"Error adding to cart: {str(e)}")
        return jsonify(success=False, message=str(e)), 500

@product_bp.route("/wishlist/add", methods=["POST"])
@jwt_required()
def add_to_wishlist():
    try:
        user_email = get_jwt_identity()
        product_id = request.json.get("product_id")
        
        if not product_id:
            return jsonify(success=False, message="Product ID is required"), 400
            
        print(f"Adding product {product_id} to wishlist for user {user_email}")  # Debug log
        
        # Check if product exists
        product = product_collection.find_one({"_id": ObjectId(product_id)})
        if not product:
            return jsonify(success=False, message="Product not found"), 404
            
        # Find user and update wishlist
        user = users_collection.find_one({"email": user_email})
        if not user:
            return jsonify(success=False, message="User not found"), 404
            
        # Update wishlist
        result = users_collection.update_one(
            {"email": user_email},
            {"$addToSet": {"wishlist": ObjectId(product_id)}}
        )
        
        if result.modified_count > 0 or result.matched_count > 0:
            return jsonify(success=True, message="Added to wishlist successfully!")
        else:
            return jsonify(success=False, message="Failed to update wishlist"), 500
            
    except Exception as e:
        print(f"Error adding to wishlist: {str(e)}")  # Debug log
        return jsonify(success=False, message=f"An error occurred: {str(e)}"), 500

@product_bp.route("/wishlist", methods=["GET"])
@jwt_required()
def get_wishlist():
    try:
        user_email = get_jwt_identity()
        user = users_collection.find_one({"email": user_email})
        
        if not user or "wishlist" not in user:
            return jsonify(success=True, items=[])
            
        # Fetch all products in the wishlist
        wishlist_items = list(product_collection.find({"_id": {"$in": user["wishlist"]}}))
        
        # Convert ObjectIds to strings
        for item in wishlist_items:
            item["_id"] = str(item["_id"])
            
        return jsonify(success=True, items=wishlist_items)
    except Exception as e:
        print(f"Error fetching wishlist: {str(e)}")
        return jsonify(success=False, message=str(e)), 500

@product_bp.route("/wishlist/remove/<product_id>", methods=["DELETE"])
@jwt_required()
def remove_from_wishlist(product_id):
    try:
        user_email = get_jwt_identity()
        result = users_collection.update_one(
            {"email": user_email},
            {"$pull": {"wishlist": ObjectId(product_id)}}
        )
        
        if result.modified_count > 0:
            return jsonify(success=True, message="Item removed from wishlist")
        return jsonify(success=False, message="Item not found in wishlist"), 404
    except Exception as e:
        return jsonify(success=False, message=str(e)), 500

@product_bp.route("/cart", methods=["GET"])
@jwt_required()
def get_cart():
    try:
        user_email = get_jwt_identity()
        if not user_email:
            return jsonify(success=False, message="Invalid token"), 401

        # Find user and ensure cart exists
        user = users_collection.find_one({"email": user_email})
        if not user:
            return jsonify(success=False, message="User not found"), 404

        # Initialize cart if it doesn't exist
        if "cart" not in user:
            users_collection.update_one(
                {"email": user_email},
                {"$set": {"cart": []}}
            )
            return jsonify(success=True, items=[])

        # Get cart items
        cart_items = []
        if user.get("cart"):
            cart_items = list(product_collection.find({"_id": {"$in": user["cart"]}}))
            for item in cart_items:
                item["_id"] = str(item["_id"])

        return jsonify(success=True, items=cart_items)

    except Exception as e:
        print(f"Cart error: {str(e)}")
        return jsonify(success=False, message=str(e)), 500

@product_bp.route("/cart/remove/<product_id>", methods=["DELETE"])
@jwt_required()
def remove_from_cart(product_id):
    try:
        user_email = get_jwt_identity()
        result = users_collection.update_one(
            {"email": user_email},
            {"$pull": {"cart": ObjectId(product_id)}}
        )
        
        if result.modified_count > 0:
            return jsonify(success=True, message="Item removed from cart")
        return jsonify(success=False, message="Item not found in cart"), 404
    except Exception as e:
        return jsonify(success=False, message=str(e)), 500