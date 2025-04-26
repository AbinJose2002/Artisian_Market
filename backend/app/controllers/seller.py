import os
from flask import Blueprint, request, jsonify, current_app
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from pymongo import MongoClient
from werkzeug.utils import secure_filename
from app import seller_collection, bcrypt, db
from bson.objectid import ObjectId
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
import uuid
import traceback  # Add this for better error tracking

# Collection references
sellers_collection = db.get_collection("sellers")
product_collection = db.get_collection("products")
orders_collection = db.get_collection("orders")
material_collection = db.get_collection("materials")  # Add this for materials

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

# 🔹 Dashboard endpoint
@seller_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_data():
    try:
        seller_id = get_jwt_identity()
        print(f"Fetching dashboard data for seller: {seller_id}")
        
        # Default empty dashboard data structure
        dashboard_data = {
            "totalProducts": 0,
            "totalOrders": 0,
            "totalRevenue": 0,
            "totalMaterials": 0,
            "recentOrders": [],
            "productInventory": [],
            "materialInventory": [],
            "monthlySales": [],
            "categoryDistribution": {},
            "lowStockItems": [],
            "productRatings": {},
            "pendingOrdersCount": 0,
            "completedOrdersCount": 0
        }
        
        # 1. First try to find products directly with seller_id
        seller_products = list(product_collection.find({"seller_id": seller_id}))
        print(f"Direct seller_id query found {len(seller_products)} products")
        
        # 2. If no products found, try alternate approaches
        if not seller_products:
            # Try to find by email if seller_id contains @ (might be email)
            if '@' in seller_id:
                seller_products = list(product_collection.find({"seller_email": seller_id}))
                print(f"seller_email query found {len(seller_products)} products")
            
            # Try to find by other potential seller identifiers
            if not seller_products and ObjectId.is_valid(seller_id):
                seller_products = list(product_collection.find({"seller_id": ObjectId(seller_id)}))
                print(f"ObjectId seller_id query found {len(seller_products)} products")
        
        # Print debug details of products found
        for idx, product in enumerate(seller_products):
            print(f"Product {idx+1}: ID={product.get('_id')}, Name={product.get('name')}")
            
        # Process products and build response
        dashboard_data["totalProducts"] = len(seller_products)
        product_ids = [p["_id"] for p in seller_products]
        product_id_strs = [str(pid) for pid in product_ids]
        
        # 3. Add products to inventory - IMPORTANT: Clear the array first to avoid duplication
        dashboard_data["productInventory"] = []
        
        for product in seller_products:
            dashboard_data["productInventory"].append({
                "_id": str(product["_id"]),
                "name": product.get("name", "Unnamed Product"),
                "description": product.get("description", ""),
                "price": product.get("price", 0),
                "category": product.get("category", "Uncategorized"),
                "quantity": product.get("quantity", 0),
                "image": product.get("image", ""),
                "type": "product"
            })
            
            # Add to category distribution
            category = product.get("category", "Uncategorized")
            dashboard_data["categoryDistribution"][category] = dashboard_data["categoryDistribution"].get(category, 0) + 1
        
        # 4. Find seller's materials
        seller_materials = list(material_collection.find({"seller_id": seller_id}))
        material_ids = [m["_id"] for m in seller_materials]
        material_id_strs = [str(mid) for mid in material_ids]
        
        dashboard_data["totalMaterials"] = len(seller_materials)
        
        # Clear materials inventory to avoid duplication
        dashboard_data["materialInventory"] = []
                
        for material in seller_materials:
            dashboard_data["materialInventory"].append({
                "_id": str(material["_id"]),
                "name": material.get("name", "Unnamed Material"),
                "description": material.get("description", ""),
                "price": material.get("price", 0),
                "category": material.get("category", "Uncategorized"),
                "quantity": material.get("quantity", 0),
                "image": material.get("image", ""),
                "type": "material"
            })
            
            # Add to category distribution
            category = material.get("category", "Uncategorized")
            if category in dashboard_data["categoryDistribution"]:
                dashboard_data["categoryDistribution"][category] += 1
            else:
                dashboard_data["categoryDistribution"][category] = 1
        
        # Handle materials and other data as before
        seller_materials = list(material_collection.find({"seller_id": seller_id}))
        material_ids = [m["_id"] for m in seller_materials]
        material_id_strs = [str(mid) for mid in material_ids]
        
        dashboard_data["totalMaterials"] = len(seller_materials)
        
        # 3. Build product and material inventory
        for product in seller_products:
            dashboard_data["productInventory"].append({
                "_id": str(product["_id"]),
                "name": product.get("name", "Unnamed Product"),
                "description": product.get("description", ""),
                "price": product.get("price", 0),
                "category": product.get("category", "Uncategorized"),
                "quantity": product.get("quantity", 0),
                "image": product.get("image", ""),
                "type": "product"
            })
            
            # Add to category distribution
            category = product.get("category", "Uncategorized")
            if category in dashboard_data["categoryDistribution"]:
                dashboard_data["categoryDistribution"][category] += 1
            else:
                dashboard_data["categoryDistribution"][category] = 1
                
        for material in seller_materials:
            dashboard_data["materialInventory"].append({
                "_id": str(material["_id"]),
                "name": material.get("name", "Unnamed Material"),
                "description": material.get("description", ""),
                "price": material.get("price", 0),
                "category": material.get("category", "Uncategorized"),
                "quantity": material.get("quantity", 0),
                "image": material.get("image", ""),
                "type": "material"
            })
            
            # Add to category distribution
            category = material.get("category", "Uncategorized")
            if category in dashboard_data["categoryDistribution"]:
                dashboard_data["categoryDistribution"][category] += 1
            else:
                dashboard_data["categoryDistribution"][category] = 1
        
        # 4. Get product reviews data
        try:
            from app.controllers.reviews import product_reviews_collection
            
            product_ratings = {}
            for product_id in product_id_strs:
                reviews = list(product_reviews_collection.find({"product_id": product_id}))
                if reviews:
                    avg_rating = sum(review.get("rating", 0) for review in reviews) / len(reviews)
                    product_ratings[product_id] = {
                        "avg_rating": avg_rating,
                        "review_count": len(reviews)
                    }
                    
            dashboard_data["productRatings"] = product_ratings
        except Exception as e:
            print(f"Error fetching product reviews: {e}")
        
        # 5. Find orders containing seller's products or materials
        seller_orders = []

        # Look for orders with product_ids
        try:
            # Use $in operator to find orders containing any of the seller's products
            if product_ids:
                product_orders = list(orders_collection.find({"product_ids": {"$in": product_ids}}))
                seller_orders.extend(product_orders)
            
            # Also check items.id field for string IDs
            if product_id_strs:
                item_orders = list(orders_collection.find({"items.id": {"$in": product_id_strs}}))
                
                # Add only those not already present
                for order in item_orders:
                    if not any(str(existing["_id"]) == str(order["_id"]) for existing in seller_orders):
                        seller_orders.append(order)
                        
            # Check for material IDs
            if material_ids:
                material_orders = list(orders_collection.find({"material_ids": {"$in": material_ids}}))
                
                # Add only those not already present
                for order in material_orders:
                    if not any(str(existing["_id"]) == str(order["_id"]) for existing in seller_orders):
                        seller_orders.append(order)
            
            # Also check material_items.id field for string IDs
            if material_id_strs:
                material_item_orders = list(orders_collection.find({"material_items.id": {"$in": material_id_strs}}))
                
                # Add only those not already present
                for order in material_item_orders:
                    if not any(str(existing["_id"]) == str(order["_id"]) for existing in seller_orders):
                        seller_orders.append(order)
        except Exception as e:
            print(f"Error finding orders: {e}")
        
        # 6. Process orders for revenue and metrics
        monthly_revenue = {}  # by month-year
        total_revenue = 0
        recent_orders = []
        pending_count = 0
        completed_count = 0
        
        for order in seller_orders:
            order_id = str(order["_id"])
            order_date = order.get("created_at", datetime.now())
            order_status = order.get("status", "completed").lower()
            
            # Count by status
            if order_status in ["completed", "delivered"]:
                completed_count += 1
            elif order_status in ["pending", "processing", "confirmed", "shipped"]:
                pending_count += 1
                
            # Calculate revenue from seller's products/materials in this order
            order_total = 0
            
            # Check product_ids
            if "product_ids" in order:
                for pid in order["product_ids"]:
                    if pid in product_ids:
                        # Find product price
                        for product in seller_products:
                            if product["_id"] == pid:
                                try:
                                    order_total += float(product.get("price", 0))
                                except:
                                    pass
            
            # Check material_ids
            if "material_ids" in order:
                for mid in order["material_ids"]:
                    if mid in material_ids:
                        # Find material price
                        for material in seller_materials:
                            if material["_id"] == mid:
                                try:
                                    order_total += float(material.get("price", 0))
                                except:
                                    pass
            
            # Check items array
            if "items" in order and isinstance(order["items"], list):
                for item in order["items"]:
                    item_id = item.get("id")
                    if item_id in product_id_strs:
                        # Use price from item or from our product data
                        item_price = 0
                        try:
                            item_price = float(item.get("price", 0))
                        except:
                            # Find in products
                            for product in seller_products:
                                if str(product["_id"]) == item_id:
                                    item_price = float(product.get("price", 0))
                                    break
                        order_total += item_price
            
            # Check material_items array
            if "material_items" in order and isinstance(order["material_items"], list):
                for item in order["material_items"]:
                    item_id = item.get("id")
                    if item_id in material_id_strs:
                        # Use price from item or from our material data
                        item_price = 0
                        try:
                            item_price = float(item.get("price", 0))
                        except:
                            # Find in materials
                            for material in seller_materials:
                                if str(material["_id"]) == item_id:
                                    item_price = float(material.get("price", 0))
                                    break
                        order_total += item_price
            
            # Accumulate total revenue
            total_revenue += order_total
            
            # Add to monthly revenue tracking
            month_key = f"{order_date.year}-{order_date.month}"
            if month_key in monthly_revenue:
                monthly_revenue[month_key]["revenue"] += order_total
            else:
                monthly_revenue[month_key] = {
                    "month": order_date.strftime("%b"),
                    "revenue": order_total
                }
            
            # Format order for display in recent orders
            formatted_order = {
                "order_id": order_id,
                "customer_email": order.get("user_email", order.get("user_identity", "Anonymous")),
                "date": order_date.strftime("%Y-%m-%d") if isinstance(order_date, datetime) else order_date,
                "amount": order_total,
                "status": order_status
            }
            
            recent_orders.append(formatted_order)
        
        # Sort recent orders by date (newest first) and limit to 5
        recent_orders.sort(key=lambda x: x["date"], reverse=True)
        dashboard_data["recentOrders"] = recent_orders[:5]
        
        # 7. Generate monthly sales data
        formatted_monthly = []
        current_date = datetime.now()
        
        for i in range(5, -1, -1):  # Last 6 months
            month_date = current_date - timedelta(days=30*i)
            month_key = f"{month_date.year}-{month_date.month}"
            month_name = month_date.strftime("%b")
            
            if month_key in monthly_revenue:
                formatted_monthly.append(monthly_revenue[month_key])
            else:
                formatted_monthly.append({
                    "month": month_name,
                    "revenue": 0
                })
        
        # 8. Identify low stock items
        low_stock_items = []
        
        for product in seller_products:
            if product.get("quantity", 0) <= 5:
                low_stock_items.append({
                    "id": str(product["_id"]),
                    "name": product.get("name", "Unnamed Product"),
                    "quantity": product.get("quantity", 0),
                    "type": "product"
                })
                
        for material in seller_materials:
            if material.get("quantity", 0) <= 5:
                low_stock_items.append({
                    "id": str(material["_id"]),
                    "name": material.get("name", "Unnamed Material"),
                    "quantity": material.get("quantity", 0),
                    "type": "material"
                })
        
        # 9. Update dashboard data with all calculated values
        dashboard_data["totalOrders"] = len(seller_orders)
        dashboard_data["totalRevenue"] = total_revenue
        dashboard_data["pendingOrdersCount"] = pending_count
        dashboard_data["completedOrdersCount"] = completed_count
        dashboard_data["monthlySales"] = formatted_monthly
        dashboard_data["lowStockItems"] = low_stock_items
        
        print(f"Dashboard data ready. Products: {dashboard_data['totalProducts']}, Materials: {dashboard_data['totalMaterials']}, Orders: {dashboard_data['totalOrders']}, Revenue: {dashboard_data['totalRevenue']}")
        return jsonify(success=True, data=dashboard_data)
    
    except Exception as e:
        print(f"Error generating dashboard data: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        # Return simplified data on error
        return jsonify(success=True, data={
            "totalProducts": len(list(product_collection.find({"seller_id": seller_id}))),
            "totalOrders": 0,
            "totalRevenue": 0,
            "totalMaterials": len(list(material_collection.find({"seller_id": seller_id}))),
            "recentOrders": [],
            "productInventory": [],
            "materialInventory": [],
            "monthlySales": [{"month": month, "revenue": 0} for month in ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]],
            "categoryDistribution": {},
            "lowStockItems": [],
            "productRatings": {},
            "pendingOrdersCount": 0,
            "completedOrdersCount": 0
        })

# Add seller profile route
@seller_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_seller_profile():
    try:
        seller_email = get_jwt_identity()
        seller = seller_collection.find_one({'email': seller_email})
        
        if not seller:
            return jsonify(success=False, message="Seller not found"), 404
        
        # Format profile data
        profile = {
            'first_name': seller.get('firstName', ''),
            'last_name': seller.get('lastName', ''),
            'email': seller.get('email', ''),
            'mobile': seller.get('mobile', ''),
            'shop_name': seller.get('shopName', ''),
            'address': seller.get('shopAddress', ''),
            'gender': seller.get('gender', ''),
            'profile_photo': seller.get('profilePhoto', None),
            'bio': seller.get('bio', '')
        }
        
        return jsonify(success=True, profile=profile)
        
    except Exception as e:
        print(f"Error fetching seller profile: {str(e)}")
        return jsonify(success=False, message=str(e)), 500

# Update seller profile
@seller_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_seller_profile():
    try:
        seller_email = get_jwt_identity()
        seller = seller_collection.find_one({'email': seller_email})
        
        if not seller:
            return jsonify(success=False, message="Seller not found"), 404
        
        # Get form data
        data = request.form
        profile_photo = request.files.get('profile_photo')
        
        # Prepare update data
        update_data = {
            'firstName': data.get('first_name', seller.get('firstName', '')),
            'lastName': data.get('last_name', seller.get('lastName', '')),
            'mobile': data.get('mobile', seller.get('mobile', '')),
            'shopName': data.get('shop_name', seller.get('shopName', '')),
            'shopAddress': data.get('address', seller.get('shopAddress', '')),
            'bio': data.get('bio', seller.get('bio', ''))
        }
        
        # Handle profile photo upload
        if profile_photo:
            filename = f"seller_{seller['_id']}_{int(datetime.now().timestamp())}.{profile_photo.filename.split('.')[-1]}"
            profile_photo_path = os.path.join(UPLOAD_FOLDER, filename)
            profile_photo.save(profile_photo_path)
            update_data['profilePhoto'] = filename
        
        # Update seller in database
        seller_collection.update_one({'_id': seller['_id']}, {'$set': update_data})
        
        return jsonify(success=True, message="Profile updated successfully")
        
    except Exception as e:
        print(f"Error updating seller profile: {str(e)}")
        return jsonify(success=False, message=str(e)), 500

@seller_bp.route('/list', methods=['GET'])
@jwt_required()
def get_sellers_list():
    """Get list of all sellers for complaints dropdown"""
    try:
        # This endpoint returns a simplified list of sellers for the dropdown
        sellers = list(seller_collection.find({}, {
            "firstName": 1, 
            "lastName": 1,
            "shopName": 1,
            "email": 1
        }))
        
        # Format sellers for response
        formatted_sellers = []
        for seller in sellers:
            formatted_sellers.append({
                "_id": str(seller["_id"]),
                "firstName": seller.get("firstName", ""),
                "lastName": seller.get("lastName", ""),
                "shopName": seller.get("shopName", "Unnamed Shop"),
                "email": seller.get("email", "")
            })
            
        return jsonify(success=True, sellers=formatted_sellers)
        
    except Exception as e:
        print(f"Error fetching sellers list: {str(e)}")
        return jsonify(success=False, message=str(e)), 500
