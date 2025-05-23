import os
from pathlib import Path
from flask import Blueprint, request, jsonify, send_from_directory, url_for
from werkzeug.utils import secure_filename
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import product_collection, users_collection
from bson import ObjectId
from datetime import datetime, timedelta

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
        
        if not product_id:
            return jsonify(success=False, message="Product ID is required"), 400
        
        product = product_collection.find_one({"_id": ObjectId(product_id)})
        if not product:
            return jsonify(success=False, message="Product not found"), 404
        
        # Safely check quantity - if quantity field is missing, assume 0
        product_quantity = product.get("quantity", 0)
        print(f"Product {product_id} has quantity: {product_quantity}")
        
        if product_quantity < quantity_requested:
            return jsonify(success=False, message="Insufficient stock", available=False), 200
        
        return jsonify(success=True, available=True)
    except Exception as e:
        print(f"Stock verification error: {str(e)}")
        return jsonify(success=False, message=str(e), available=False), 500

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
        # This is the identity from the JWT token
        user_identity = get_jwt_identity()
        
        # Check which type of user we're dealing with (by checking if it's an email or not)
        is_email = '@' in user_identity
        
        if is_email:
            user_email = user_identity
            user = users_collection.find_one({"email": user_email})
        else:
            # If it's not an email, assume it's a seller ID and find by ID
            user = users_collection.find_one({"_id": user_identity})
            
            if not user:
                # Try finding by seller_id field
                user = users_collection.find_one({"seller_id": user_identity})
        
        if not user:
            return jsonify(success=False, message="User not found"), 404

        # Initialize cart if it doesn't exist
        if "cart" not in user:
            users_collection.update_one(
                {"_id": user["_id"]},
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

# 🔹 New API to fetch all unique categories
@product_bp.route("/categories", methods=["GET"])
@jwt_required(optional=True)
def get_categories():
    try:
        # Get all unique categories from products
        categories = product_collection.distinct("category")
        return jsonify(success=True, categories=categories)
    except Exception as e:
        return jsonify(success=False, message=str(e)), 500

@product_bp.route("/stats/<product_id>", methods=["GET"])
@jwt_required()
def get_product_stats(product_id):
    try:
        seller_id = get_jwt_identity()
        print(f"Fetching stats for product {product_id} from seller {seller_id}")
        
        # Verify product exists and belongs to seller
        product = product_collection.find_one({
            "_id": ObjectId(product_id),
            "seller_id": seller_id
        })
        
        if not product:
            return jsonify(success=False, message="Product not found or unauthorized"), 404
        
        # Default response with zero values
        default_stats = {
            "totalSales": 0,
            "totalRevenue": 0,
            "lastOrderDate": None,
            "averageRating": 0,
            "monthlyTrend": [
                {"month": "Jan", "sales": 0},
                {"month": "Feb", "sales": 0},
                {"month": "Mar", "sales": 0},
                {"month": "Apr", "sales": 0},
                {"month": "May", "sales": 0},
                {"month": "Jun", "sales": 0}
            ]
        }
        
        # Find orders containing this product - we need to import orders_collection
        try:
            from app import orders_collection
            
            # First, try to find product in product_ids array
            orders = list(orders_collection.find({
                "product_ids": ObjectId(product_id)
            }))
            
            print(f"Found {len(orders)} orders for product {product_id}")
            
            # If no orders found, check in items array which may contain product details
            if not orders:
                orders = list(orders_collection.find({
                    "items.id": str(product_id)
                }))
                print(f"Found {len(orders)} orders from items array for product {product_id}")
        except Exception as e:
            print(f"Error finding orders: {e}")
            orders = []
        
        # Calculate statistics
        total_sales = len(orders)
        product_price = float(product.get("price", 0))
        total_revenue = product_price * total_sales
        
        # Get last order date
        last_order_date = None
        if orders:
            # Sort orders by created_at date, if available
            try:
                orders.sort(key=lambda x: x.get("created_at", datetime.min), reverse=True)
                last_order_date = orders[0].get("created_at")
            except Exception as e:
                print(f"Error sorting orders: {e}")
                # If sorting fails, just use the first order's date
                last_order_date = orders[0].get("created_at") if orders else None
        
        # Calculate monthly trend (last 6 months)
        monthly_trend = []
        
        # Always provide 6 months of data, even if empty
        current_date = datetime.now()
        for i in range(5, -1, -1):
            month_date = current_date - timedelta(days=30*i)
            month_name = month_date.strftime("%b")
            
            # Count sales for this month
            month_sales = 0
            for order in orders:
                order_date = order.get("created_at")
                if order_date and isinstance(order_date, datetime):
                    if order_date.month == month_date.month and order_date.year == month_date.year:
                        month_sales += 1
            
            monthly_trend.append({
                "month": month_name,
                "sales": month_sales
            })
        
        # For now, we'll just use a placeholder for average rating
        average_rating = 4.5
        
        # Create the stats object with proper initialization
        stats = {
            "totalSales": total_sales,
            "totalRevenue": total_revenue,
            "lastOrderDate": last_order_date,
            "averageRating": average_rating,
            "monthlyTrend": monthly_trend
        }
        
        print(f"Returning stats: {stats}")
        return jsonify(success=True, stats=stats)
        
    except Exception as e:
        print(f"Error getting product stats: {str(e)}")
        # Return default stats on error
        default_stats = {
            "totalSales": 0,
            "totalRevenue": 0,
            "lastOrderDate": None,
            "averageRating": 0,
            "monthlyTrend": [
                {"month": "Jan", "sales": 0},
                {"month": "Feb", "sales": 0},
                {"month": "Mar", "sales": 0},
                {"month": "Apr", "sales": 0},
                {"month": "May", "sales": 0},
                {"month": "Jun", "sales": 0}
            ]
        }
        return jsonify(success=True, stats=default_stats)