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
        seller_email = get_jwt_identity()
        print(f"Fetching dashboard data for seller: {seller_email}")
        
        # Get seller ID
        seller = seller_collection.find_one({'email': seller_email})
        if not seller:
            print(f"Seller not found with email: {seller_email}")
            return jsonify(success=False, message="Seller not found"), 404
            
        seller_id = str(seller['_id'])
        print(f"Found seller with ID: {seller_id}")
        
        # Get total products count
        total_products = product_collection.count_documents({'seller_id': seller_id})
        print(f"Total products: {total_products}")
        
        # Get product inventory with low stock - catch errors if schema doesn't match
        try:
            product_inventory = list(product_collection.find(
                {'seller_id': seller_id},
                {'name': 1, 'price': 1, 'category': 1, 'quantity': 1, 'image': 1}
            ).sort('quantity', 1).limit(10))
            print(f"Retrieved {len(product_inventory)} inventory items")
        except Exception as e:
            print(f"Error fetching product inventory: {str(e)}")
            product_inventory = []
        
        # Format product inventory
        formatted_inventory = []
        for product in product_inventory:
            try:
                formatted_inventory.append({
                    '_id': str(product['_id']),
                    'name': product.get('name', 'Unknown'),
                    'price': product.get('price', 0),
                    'category': product.get('category', 'Other'),
                    'quantity': product.get('quantity', 0),
                    'image': product.get('image')
                })
            except Exception as e:
                print(f"Error formatting product: {str(e)}")
                continue
        
        # Get category distribution
        categories = {}
        try:
            all_products = product_collection.find({'seller_id': seller_id})
            for product in all_products:
                category = product.get('category', 'Other')
                if category in categories:
                    categories[category] += 1
                else:
                    categories[category] = 1
        except Exception as e:
            print(f"Error building category distribution: {str(e)}")
                
        # Process orders - provide defensive fallbacks if data isn't available
        try:
            # Find orders that contain this seller's products
            pipeline = [
                {
                    '$match': {
                        'items.seller_id': seller_id
                    }
                },
                {
                    '$sort': {
                        'created_at': -1
                    }
                }
            ]
            
            seller_orders = list(orders_collection.aggregate(pipeline))
            print(f"Retrieved {len(seller_orders)} orders")
        except Exception as e:
            print(f"Error fetching orders: {str(e)}")
            seller_orders = []
        
        # Calculate total orders and revenue
        total_orders = len(seller_orders)
        total_revenue = 0
        
        # Format recent orders
        recent_orders = []
        
        # Monthly sales data
        monthly_sales = [{'month': f"{i+1}", 'revenue': 0} for i in range(12)]
        
        # Initialize current month for fallback
        current_month = datetime.utcnow().month - 1
        
        for order in seller_orders:
            try:
                # Calculate revenue for this seller's products in the order
                seller_revenue = 0
                for item in order.get('items', []):
                    if item.get('seller_id') == seller_id:
                        try:
                            price = float(item.get('price', 0))
                            quantity = int(item.get('quantity', 0))
                            seller_revenue += price * quantity
                        except (ValueError, TypeError) as e:
                            print(f"Error calculating item revenue: {str(e)}")
                            continue
                
                # Add to total revenue
                total_revenue += seller_revenue
                
                # Add to monthly sales data
                try:
                    if 'created_at' in order:
                        month_index = order['created_at'].month - 1  # 0-indexed
                    else:
                        month_index = current_month  # Fallback to current month
                    
                    monthly_sales[month_index]['revenue'] += seller_revenue
                except Exception as e:
                    print(f"Error adding to monthly sales: {str(e)}")
                
                # Add to recent orders if within the 10 most recent
                if len(recent_orders) < 10:
                    try:
                        recent_orders.append({
                            'order_id': str(order['_id']),
                            'customer_email': order.get('customer_email', 'Unknown'),
                            'customer_name': order.get('customer_name', ''),
                            'date': order.get('created_at', datetime.utcnow()).isoformat(),
                            'amount': round(seller_revenue, 2),
                            'status': order.get('status', 'processing')
                        })
                    except Exception as e:
                        print(f"Error adding recent order: {str(e)}")
            except Exception as e:
                print(f"Error processing order: {str(e)}")
                continue
        
        # Get top selling products
        top_products = []
        # This would require more complex aggregation in a production system
        
        print("Successfully generated dashboard data")
        # Return dashboard data
        return jsonify(
            success=True,
            data={
                'totalProducts': total_products,
                'totalOrders': total_orders,
                'totalRevenue': round(total_revenue, 2),
                'recentOrders': recent_orders,
                'productInventory': formatted_inventory,
                'monthlySales': monthly_sales,
                'categoryDistribution': categories,
                'topProducts': top_products
            }
        )
            
    except Exception as e:
        print(f"Error fetching dashboard data: {str(e)}")
        print(traceback.format_exc())  # Print full traceback for debugging
        return jsonify(success=True, data={
            'totalProducts': 0,
            'totalOrders': 0,
            'totalRevenue': 0,
            'recentOrders': [],
            'productInventory': [],
            'monthlySales': [{'month': f"{i+1}", 'revenue': 0} for i in range(12)],
            'categoryDistribution': {},
            'topProducts': []
        }, message="Error loading complete data, showing default values"), 200

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
