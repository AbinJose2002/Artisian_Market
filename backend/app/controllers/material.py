import os
from pathlib import Path
from flask import Blueprint, request, jsonify, send_from_directory, url_for
from werkzeug.utils import secure_filename
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import material_collection, users_collection
from bson import ObjectId

material_bp = Blueprint("material", __name__)

# Define upload folder using app config
UPLOAD_FOLDER = os.path.join(os.getcwd(), "uploads", "material_images")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Serve uploaded material images
@material_bp.route("/uploads/material_images/<filename>")
def serve_image(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

# Add Material API (Authenticated)
@material_bp.route("/add", methods=["POST"])
@jwt_required()
def add_material():
    data = request.form
    image = request.files.get("image")

    # Extract seller ID from token
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
        image_url = url_for("material.serve_image", filename=filename, _external=True)

    material = {
        "seller_id": seller_id,
        "name": name,
        "description": description,
        "price": price,
        "category": category,
        "quantity": int(quantity),
        "image": image_url
    }
    material_collection.insert_one(material)

    return jsonify(success=True, message="Material added successfully!", image_url=image_url)

# Get Materials for a Specific Seller (Authenticated)
@material_bp.route("/seller-list", methods=["GET"])
@jwt_required()
def get_seller_materials():
    try:
        seller_id = get_jwt_identity()
        if not seller_id:
            return jsonify(success=False, message="Invalid token"), 401

        materials = list(material_collection.find({"seller_id": seller_id}))
        
        # Include _id in response
        for material in materials:
            material["_id"] = str(material["_id"])
        
        return jsonify(success=True, materials=materials)
    except Exception as e:
        return jsonify(success=False, message="Authentication failed"), 401

# Get all materials
@material_bp.route("/list", methods=["GET"])
def get_materials():
    materials = list(material_collection.find())

    # Convert MongoDB ObjectId to string and ensure quantity field exists
    for material in materials:
        material["_id"] = str(material["_id"])
        # Make sure quantity exists and is an integer
        if "quantity" not in material:
            material["quantity"] = 0
        else:
            # Ensure it's an integer value
            material["quantity"] = int(material.get("quantity", 0))

    return jsonify(success=True, materials=materials)

# Get a specific material
@material_bp.route("/<string:material_id>", methods=["GET"])
def get_material(material_id):
    try:
        material = material_collection.find_one({"_id": ObjectId(material_id)})
        if not material:
            return jsonify(success=False, message="Material not found"), 404

        # Convert MongoDB ObjectId to string before sending JSON response
        material["_id"] = str(material["_id"])

        return jsonify(success=True, material=material)
    except Exception as e:
        return jsonify(success=False, message=str(e)), 500

# Update Material API
@material_bp.route("/update/<material_id>", methods=["PUT"])
@jwt_required()
def update_material(material_id):
    try:
        seller_id = get_jwt_identity()
        data = request.form
        image = request.files.get("image")

        # Verify material exists and belongs to seller
        existing_material = material_collection.find_one({
            "_id": ObjectId(material_id),
            "seller_id": seller_id
        })

        if not existing_material:
            return jsonify(success=False, message="Material not found or unauthorized"), 404

        # Prepare update data
        update_data = {
            "name": data.get("name"),
            "description": data.get("description"),
            "price": data.get("price"),
            "category": data.get("category"),
            "quantity": int(data.get("quantity")) if data.get("quantity") else existing_material["quantity"]
        }

        # Handle image update if new image provided
        if image:
            filename = secure_filename(image.filename)
            saved_path = os.path.join(UPLOAD_FOLDER, filename)
            image.save(saved_path)
            update_data["image"] = url_for("material.serve_image", filename=filename, _external=True)

        # Update material
        material_collection.update_one(
            {"_id": ObjectId(material_id)},
            {"$set": update_data}
        )

        return jsonify(success=True, message="Material updated successfully!")

    except Exception as e:
        return jsonify(success=False, message=str(e)), 500

# Delete Material API
@material_bp.route("/delete/<material_id>", methods=["DELETE"])
@jwt_required()
def delete_material(material_id):
    try:
        seller_id = get_jwt_identity()

        # Verify material exists and belongs to seller
        result = material_collection.delete_one({
            "_id": ObjectId(material_id),
            "seller_id": seller_id
        })

        if result.deleted_count == 0:
            return jsonify(success=False, message="Material not found or unauthorized"), 404

        return jsonify(success=True, message="Material deleted successfully!")

    except Exception as e:
        return jsonify(success=False, message=str(e)), 500

# API to fetch all unique categories
@material_bp.route("/categories", methods=["GET"])
@jwt_required(optional=True)
def get_categories():
    try:
        # Get all unique categories from materials
        categories = material_collection.distinct("category")
        return jsonify(success=True, categories=categories)
    except Exception as e:
        return jsonify(success=False, message=str(e)), 500

@material_bp.route("/cart/add", methods=["POST"])
@jwt_required()
def add_to_cart():
    try:
        user_identity = get_jwt_identity()
        material_id = request.json.get("material_id")
        
        if not material_id:
            return jsonify(success=False, message="Material ID is required"), 400
            
        # Check if material exists
        material = material_collection.find_one({"_id": ObjectId(material_id)})
        if not material:
            return jsonify(success=False, message="Material not found"), 404
            
        # Check if user is email (regular user) or ID (seller/instructor)
        is_email = '@' in user_identity
        
        if is_email:
            # For regular users with email
            user = users_collection.find_one({"email": user_identity})
            if not user:
                return jsonify(success=False, message="User not found"), 404
                
            # Initialize cart if it doesn't exist
            if "cart_materials" not in user:
                users_collection.update_one(
                    {"email": user_identity},
                    {"$set": {"cart_materials": []}}
                )
                
            # Add material to cart
            result = users_collection.update_one(
                {"email": user_identity},
                {"$addToSet": {"cart_materials": ObjectId(material_id)}}
            )
        else:
            # For sellers/instructors with ID
            user = users_collection.find_one({"_id": user_identity})
            if not user:
                user = users_collection.find_one({"seller_id": user_identity})
                
            if not user:
                return jsonify(success=False, message="User not found"), 404
                
            # Initialize cart if it doesn't exist
            if "cart_materials" not in user:
                users_collection.update_one(
                    {"_id": user["_id"]},
                    {"$set": {"cart_materials": []}}
                )
                
            # Add material to cart
            result = users_collection.update_one(
                {"_id": user["_id"]},
                {"$addToSet": {"cart_materials": ObjectId(material_id)}}
            )

        if result.modified_count > 0 or result.matched_count > 0:
            return jsonify(success=True, message="Added to cart successfully!")
        else:
            return jsonify(success=False, message="Failed to update cart"), 500

    except Exception as e:
        print(f"Error adding material to cart: {str(e)}")
        return jsonify(success=False, message=str(e)), 500

@material_bp.route("/wishlist/add", methods=["POST"])
@jwt_required()
def add_to_wishlist():
    try:
        # Get user identity from the token
        user_identity = get_jwt_identity()
        print(f"User identity from token: {user_identity}")
        
        # Get material ID from request
        material_id = request.json.get("material_id")
        
        if not material_id:
            return jsonify(success=False, message="Material ID is required"), 400
            
        # Check if material exists
        material = material_collection.find_one({"_id": ObjectId(material_id)})
        if not material:
            return jsonify(success=False, message="Material not found"), 404
        
        # Determine if user_identity is an email (user) or ID (seller/instructor)
        is_email = '@' in user_identity
        
        if is_email:
            # For regular users
            user = users_collection.find_one({"email": user_identity})
            if not user:
                return jsonify(success=False, message="User not found"), 404
                
            # Make sure wishlist_materials field exists
            if "wishlist_materials" not in user:
                users_collection.update_one(
                    {"email": user_identity},
                    {"$set": {"wishlist_materials": []}}
                )
                
            # Add material to wishlist
            result = users_collection.update_one(
                {"email": user_identity},
                {"$addToSet": {"wishlist_materials": ObjectId(material_id)}}
            )
        else:
            # For sellers/instructors by ID
            user = users_collection.find_one({"_id": ObjectId(user_identity)})
            if not user:
                user = users_collection.find_one({"seller_id": user_identity})
                if not user:
                    return jsonify(success=False, message="User not found"), 404
            
            # Make sure wishlist_materials field exists
            if "wishlist_materials" not in user:
                users_collection.update_one(
                    {"_id": user["_id"]},
                    {"$set": {"wishlist_materials": []}}
                )
                
            # Add material to wishlist
            result = users_collection.update_one(
                {"_id": user["_id"]},
                {"$addToSet": {"wishlist_materials": ObjectId(material_id)}}
            )
                
        if result.modified_count > 0 or result.matched_count > 0:
            return jsonify(success=True, message="Added to wishlist successfully!")
        else:
            return jsonify(success=False, message="Failed to update wishlist or item already in wishlist"), 200
            
    except Exception as e:
        print(f"Error adding material to wishlist: {str(e)}")
        return jsonify(success=False, message=f"An error occurred: {str(e)}"), 500

@material_bp.route("/cart", methods=["GET"])
@jwt_required()
def get_cart():
    try:
        user_identity = get_jwt_identity()
        
        # Handle different user types
        is_email = '@' in user_identity
        
        if is_email:
            user = users_collection.find_one({"email": user_identity})
        else:
            user = users_collection.find_one({"_id": user_identity})
            if not user:
                user = users_collection.find_one({"seller_id": user_identity})
        
        if not user:
            return jsonify(success=False, message="User not found"), 404

        # Initialize cart if it doesn't exist
        if "cart_materials" not in user:
            if is_email:
                users_collection.update_one(
                    {"email": user_identity},
                    {"$set": {"cart_materials": []}}
                )
            else:
                users_collection.update_one(
                    {"_id": user["_id"]},
                    {"$set": {"cart_materials": []}}
                )
            return jsonify(success=True, items=[])

        # Get cart items
        cart_items = []
        if user.get("cart_materials"):
            cart_items = list(material_collection.find({"_id": {"$in": user["cart_materials"]}}))
            for item in cart_items:
                item["_id"] = str(item["_id"])

        return jsonify(success=True, items=cart_items)

    except Exception as e:
        print(f"Cart materials error: {str(e)}")
        return jsonify(success=False, message=str(e)), 500

@material_bp.route("/cart/remove/<material_id>", methods=["DELETE"])
@jwt_required()
def remove_from_cart(material_id):
    try:
        user_identity = get_jwt_identity()
        
        # Handle different user types
        is_email = '@' in user_identity
        
        if is_email:
            result = users_collection.update_one(
                {"email": user_identity},
                {"$pull": {"cart_materials": ObjectId(material_id)}}
            )
        else:
            user = users_collection.find_one({"_id": user_identity})
            if not user:
                user = users_collection.find_one({"seller_id": user_identity})
                
            if not user:
                return jsonify(success=False, message="User not found"), 404
                
            result = users_collection.update_one(
                {"_id": user["_id"]},
                {"$pull": {"cart_materials": ObjectId(material_id)}}
            )
        
        if result.modified_count > 0:
            return jsonify(success=True, message="Item removed from cart")
        return jsonify(success=False, message="Item not found in cart"), 404
    except Exception as e:
        return jsonify(success=False, message=str(e)), 500

@material_bp.route("/wishlist", methods=["GET"])
@jwt_required()
def get_wishlist():
    try:
        user_identity = get_jwt_identity()
        
        # Handle different user types
        is_email = '@' in user_identity
        
        if is_email:
            user = users_collection.find_one({"email": user_identity})
        else:
            user = users_collection.find_one({"_id": user_identity})
            if not user:
                user = users_collection.find_one({"seller_id": user_identity})
                
        if not user or "wishlist_materials" not in user:
            return jsonify(success=True, items=[])
            
        # Fetch all materials in the wishlist
        wishlist_items = list(material_collection.find({"_id": {"$in": user["wishlist_materials"]}}))
        
        # Convert ObjectIds to strings
        for item in wishlist_items:
            item["_id"] = str(item["_id"])
            
        return jsonify(success=True, items=wishlist_items)
    except Exception as e:
        print(f"Error fetching wishlist materials: {str(e)}")
        return jsonify(success=False, message=str(e)), 500

@material_bp.route("/wishlist/remove/<material_id>", methods=["DELETE"])
@jwt_required()
def remove_from_wishlist(material_id):
    try:
        user_identity = get_jwt_identity()
        
        # Handle different user types
        is_email = '@' in user_identity
        
        if is_email:
            result = users_collection.update_one(
                {"email": user_identity},
                {"$pull": {"wishlist_materials": ObjectId(material_id)}}
            )
        else:
            user = users_collection.find_one({"_id": user_identity})
            if not user:
                user = users_collection.find_one({"seller_id": user_identity})
                
            if not user:
                return jsonify(success=False, message="User not found"), 404
                
            result = users_collection.update_one(
                {"_id": user["_id"]},
                {"$pull": {"wishlist_materials": ObjectId(material_id)}}
            )
        
        if result.modified_count > 0:
            return jsonify(success=True, message="Item removed from wishlist")
        return jsonify(success=False, message="Item not found in wishlist"), 404
    except Exception as e:
        return jsonify(success=False, message=str(e)), 500

# Verify Material Stock API
@material_bp.route("/verify/stock", methods=["POST"])
@jwt_required()
def verify_stock():
    try:
        material_id = request.json.get("material_id")
        quantity_requested = request.json.get("quantity", 1)
        
        if not material_id:
            return jsonify(success=False, message="Material ID is required"), 400
        
        material = material_collection.find_one({"_id": ObjectId(material_id)})
        if not material:
            return jsonify(success=False, message="Material not found"), 404
        
        # Safely check quantity - if quantity field is missing, assume 0
        material_quantity = material.get("quantity", 0)
        print(f"Material {material_id} has quantity: {material_quantity}")
        
        if material_quantity < quantity_requested:
            return jsonify(success=False, message="Insufficient stock", available=False), 200
        
        return jsonify(success=True, available=True)
    except Exception as e:
        print(f"Material stock verification error: {str(e)}")
        return jsonify(success=False, message=str(e), available=False), 500

# Update Material Stock API
@material_bp.route("/update/stock", methods=["PUT"])
@jwt_required()
def update_stock():
    try:
        material_id = request.json.get("material_id")
        quantity_purchased = request.json.get("quantity", 1)
        
        result = material_collection.update_one(
            {"_id": ObjectId(material_id)},
            {"$inc": {"quantity": -quantity_purchased}}
        )
        
        if result.modified_count:
            return jsonify(success=True, message="Stock updated")
        return jsonify(success=False, message="Failed to update stock"), 400
    except Exception as e:
        return jsonify(success=False, message=str(e)), 500
