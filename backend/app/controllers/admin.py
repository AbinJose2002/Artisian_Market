from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app import admin_collection, bcrypt, db
from datetime import datetime
from bson import ObjectId  # Add this import

# Add this line to define bids_collection
bids_collection = db.get_collection("bids")

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    
    # Check if admin already exists
    if admin_collection.find_one({"email": data['email']}):
        return jsonify(success=False, message="Email already registered"), 400
        
    # Create admin document
    admin_data = {
        "email": data['email'],
        "password": bcrypt.generate_password_hash(data['password']).decode('utf-8'),
        "first_name": data['first_name'],
        "last_name": data['last_name'],
        "role": "admin",
        "created_at": datetime.utcnow()
    }
    
    # Insert into database
    admin_collection.insert_one(admin_data)
    return jsonify(success=True, message="Admin registered successfully")

@admin_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    admin = admin_collection.find_one({"email": data['email']})
    
    if admin and bcrypt.check_password_hash(admin['password'], data['password']):
        token = create_access_token(identity=admin['email'])
        return jsonify(success=True, token=token)
    
    return jsonify(success=False, message="Invalid credentials"), 401

@admin_bp.route('/dashboard/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    from app import users_collection, instructor_collection, events_collection, product_collection
    
    try:
        stats = {
            "total_users": users_collection.count_documents({}),
            "total_instructors": instructor_collection.count_documents({}),
            "total_events": events_collection.count_documents({}),
            "total_products": product_collection.count_documents({}),
        }
        return jsonify(success=True, stats=stats)
    except Exception as e:
        return jsonify(success=False, message=str(e)), 500

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    from app import users_collection
    users = list(users_collection.find({}, {"password": 0}))
    
    # Convert ObjectId to string and handle nested ObjectIds
    def convert_object_id(obj):
        if isinstance(obj, dict):
            return {key: convert_object_id(value) for key, value in obj.items()}
        elif isinstance(obj, list):
            return [convert_object_id(item) for item in obj]
        elif isinstance(obj, ObjectId):
            return str(obj)
        else:
            return obj

    users = [convert_object_id(user) for user in users]
    return jsonify(success=True, users=users)

@admin_bp.route('/instructors', methods=['GET'])
@jwt_required()
def get_instructors():
    from app import instructor_collection
    instructors = list(instructor_collection.find({}, {"password": 0}))
    # Convert ObjectIds to strings
    for instructor in instructors:
        instructor['_id'] = str(instructor['_id'])
        # Handle any other ObjectId fields
        if 'created_at' in instructor:
            instructor['created_at'] = instructor['created_at'].isoformat()
    return jsonify(success=True, instructors=instructors)

@admin_bp.route('/events', methods=['GET'])
@jwt_required()
def get_events():
    from app import events_collection
    events = list(events_collection.find({}))
    # Convert ObjectIds to strings
    for event in events:
        event['_id'] = str(event['_id'])
        event['instructor_id'] = str(event['instructor_id'])
        # Handle registered_users if present
        if 'registered_users' in event:
            for user in event['registered_users']:
                if 'user_id' in user and isinstance(user['user_id'], ObjectId):
                    user['user_id'] = str(user['user_id'])
    return jsonify(success=True, events=events)

@admin_bp.route('/sellers', methods=['GET'])
@jwt_required()
def get_sellers():
    from app import seller_collection
    sellers = list(seller_collection.find({}, {"password": 0}))
    # Convert ObjectIds to strings
    for seller in sellers:
        seller['_id'] = str(seller['_id'])
    return jsonify(success=True, sellers=sellers)

@admin_bp.route('/products', methods=['GET'])
@jwt_required()
def get_products():
    from app import product_collection
    products = list(product_collection.find({}))
    # Convert ObjectIds to strings
    for product in products:
        product['_id'] = str(product['_id'])
        if 'seller_id' in product:
            product['seller_id'] = str(product['seller_id'])
    return jsonify(success=True, products=products)

@admin_bp.route('/user/<user_id>/block', methods=['PUT'])
@jwt_required()
def block_user(user_id):
    from app import users_collection
    try:
        users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"is_blocked": True}}
        )
        return jsonify(success=True, message="User blocked successfully")
    except Exception as e:
        return jsonify(success=False, message=str(e)), 500

@admin_bp.route('/bids', methods=['GET'])
@jwt_required()
def get_all_bids():
    from app import instructor_collection
    try:
        # Get all bids from database (including pending requests)
        bids = list(bids_collection.find())
        
        # If no bids found, return empty list
        if not bids:
            print("No bids found in database")
            return jsonify(success=True, bids=[])
        
        # Process bids for response
        processed_bids = []
        for bid in bids:
            # Process ObjectId to string
            bid_dict = {
                '_id': str(bid['_id']),
                'title': bid.get('title', 'Untitled'),
                'description': bid.get('description', ''),
                'base_amount': bid.get('base_amount', 0),
                'current_amount': bid.get('current_amount', 0),
                'min_increment': bid.get('min_increment', 0),
                'status': bid.get('status', 'pending'),
                'category': bid.get('category', 'Other'),
                'condition': bid.get('condition', ''),
                'image': bid.get('image'),
                'created_at': bid['created_at'].isoformat() if 'created_at' in bid else None,
                'last_date': bid['last_date'].isoformat() if 'last_date' in bid else None
            }
            
            # Add requester information
            if 'requester_email' in bid:
                bid_dict['requester_email'] = bid['requester_email']
                
            # Add instructor information if available
            if 'instructor_id' in bid:
                instructor_id = bid['instructor_id']
                bid_dict['instructor_id'] = str(instructor_id) if isinstance(instructor_id, ObjectId) else instructor_id
                
                # Try to find instructor name
                try:
                    instructor = instructor_collection.find_one({'_id': ObjectId(str(instructor_id))})
                    if instructor:
                        bid_dict['instructor_name'] = f"{instructor.get('first_name', '')} {instructor.get('last_name', '')}"
                except Exception as e:
                    print(f"Error getting instructor details: {str(e)}")
                    
            processed_bids.append(bid_dict)

        return jsonify(success=True, bids=processed_bids)
        
    except Exception as e:
        print(f"Error in get_all_bids: {str(e)}")
        return jsonify(success=False, message=str(e)), 500

@admin_bp.route('/bids/<bid_id>/status', methods=['PUT'])
@jwt_required()
def update_bid_status(bid_id):
    try:
        status = request.json.get('status')
        if status not in ['approved', 'rejected']:
            return jsonify(success=False, message="Invalid status"), 400

        # Update bid status
        result = bids_collection.update_one(
            {'_id': ObjectId(bid_id)},
            {'$set': {
                'status': status,
                'updated_at': datetime.utcnow(),
                'updated_by': get_jwt_identity()
            }}
        )

        if result.modified_count:
            # Get updated bid
            updated_bid = bids_collection.find_one({'_id': ObjectId(bid_id)})
            if updated_bid:
                updated_bid['_id'] = str(updated_bid['_id'])
                updated_bid['instructor_id'] = str(updated_bid['instructor_id'])
                if 'created_at' in updated_bid:
                    updated_bid['created_at'] = updated_bid['created_at'].isoformat()
                if 'updated_at' in updated_bid:
                    updated_bid['updated_at'] = updated_bid['updated_at'].isoformat()
                return jsonify({
                    'success': True,
                    'message': f'Bid {status} successfully',
                    'bid': updated_bid
                })
            
        return jsonify(success=False, message="Bid not found"), 404

    except Exception as e:
        print(f"Error updating bid status: {str(e)}")
        return jsonify(success=False, message=str(e)), 500

@admin_bp.route('/bid-requests', methods=['GET'])
@jwt_required()
def get_bid_requests():
    try:
        # Verify admin
        admin_email = get_jwt_identity()
        admin = admin_collection.find_one({'email': admin_email})
        if not admin:
            return jsonify(success=False, message="Unauthorized"), 401
        
        # Get all bid requests
        bids = list(bids_collection.find({}))
        
        # Process and format the bids
        processed_bids = []
        for bid in bids:
            try:
                processed_bid = {
                    '_id': str(bid['_id']),
                    'title': bid.get('title', 'Untitled'),
                    'description': bid.get('description', ''),
                    'base_amount': bid.get('base_amount', 0),
                    'current_amount': bid.get('current_amount', bid.get('base_amount', 0)),
                    'min_increment': bid.get('min_increment', 0),
                    'category': bid.get('category', 'Other'),
                    'condition': bid.get('condition', ''),
                    'dimensions': bid.get('dimensions', ''),
                    'material': bid.get('material', ''),
                    'image': bid.get('image', ''),
                    'last_date': bid['last_date'].isoformat() if 'last_date' in bid else None,
                    'created_at': bid['created_at'].isoformat() if 'created_at' in bid else None,
                    'status': bid.get('status', 'pending'),
                    'bids': bid.get('bids', []),
                    'requester_email': bid.get('requester_email'),
                    'seller_email': bid.get('seller_email'),
                    'instructor_id': str(bid['instructor_id']) if 'instructor_id' in bid else None
                }
                processed_bids.append(processed_bid)
            except Exception as e:
                print(f"Error processing bid {bid.get('_id')}: {str(e)}")
                continue

        return jsonify(success=True, bids=processed_bids)
        
    except Exception as e:
        print(f"Error getting bid requests: {str(e)}")
        return jsonify(success=False, message=str(e)), 500

@admin_bp.route('/bid-requests/<bid_id>/approve', methods=['PUT'])
@jwt_required()
def approve_bid_request(bid_id):
    try:
        # Verify admin
        admin_email = get_jwt_identity()
        admin = admin_collection.find_one({'email': admin_email})
        if not admin:
            return jsonify(success=False, message="Unauthorized"), 401
        
        # Update bid status
        result = bids_collection.update_one(
            {'_id': ObjectId(bid_id)},
            {'$set': {'status': 'approved'}}
        )
        
        if result.modified_count:
            return jsonify(success=True, message="Bid request approved successfully")
        else:
            return jsonify(success=False, message="Failed to approve bid request"), 400
            
    except Exception as e:
        print(f"Error approving bid request: {str(e)}")
        return jsonify(success=False, message=str(e)), 500

@admin_bp.route('/bid-requests/<bid_id>/reject', methods=['PUT'])
@jwt_required()
def reject_bid_request(bid_id):
    try:
        # Verify admin
        admin_email = get_jwt_identity()
        admin = admin_collection.find_one({'email': admin_email})
        if not admin:
            return jsonify(success=False, message="Unauthorized"), 401
        
        # Update bid status
        result = bids_collection.update_one(
            {'_id': ObjectId(bid_id)},
            {'$set': {'status': 'rejected'}}
        )
        
        if result.modified_count:
            return jsonify(success=True, message="Bid request rejected successfully")
        else:
            return jsonify(success=False, message="Failed to reject bid request"), 400
            
    except Exception as e:
        print(f"Error rejecting bid request: {str(e)}")
        return jsonify(success=False, message=str(e)), 500
