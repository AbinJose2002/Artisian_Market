from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime
import time
import os
from app import bids_collection, instructor_collection, users_collection

bids_bp = Blueprint('bids', __name__)

@bids_bp.route('/active', methods=['GET'])
def get_active_bids():
    try:
        print("Fetching active bids...") # Debug log
        current_time = datetime.utcnow()
        
        # Debug: Print query parameters
        query = {
            'status': 'approved',
            'last_date': {'$gt': current_time}
        }
        print(f"Query: {query}")
        
        bids = list(bids_collection.find(query))
        print(f"Found {len(bids)} active bids") # Debug log

        processed_bids = []
        for bid in bids:
            try:
                processed_bid = {
                    '_id': str(bid['_id']),
                    'title': bid.get('title'),
                    'description': bid.get('description'),
                    'base_amount': bid.get('base_amount'),
                    'current_amount': bid.get('current_amount'),
                    'min_increment': bid.get('min_increment'),
                    'category': bid.get('category'),
                    'condition': bid.get('condition'),
                    'image': bid.get('image'),
                    'last_date': bid['last_date'].isoformat() if 'last_date' in bid else None,
                    'bids': bid.get('bids', [])
                }
                
                # Check if this is an instructor-created bid or user-requested bid
                if 'instructor_id' in bid:
                    processed_bid['instructor_id'] = str(bid['instructor_id'])
                    
                    # Get instructor details
                    instructor = instructor_collection.find_one({'_id': ObjectId(bid['instructor_id'])})
                    if instructor:
                        processed_bid['instructor_name'] = f"{instructor.get('first_name', '')} {instructor.get('last_name', '')}"
                elif 'requester_email' in bid:
                    processed_bid['requester_email'] = bid['requester_email']
                    processed_bid['instructor_id'] = 'user_requested'  # Add this field for compatibility
                
                processed_bids.append(processed_bid)
                print(f"Successfully processed bid {bid['_id']}")
            except Exception as e:
                print(f"Error processing bid {bid.get('_id')}: {str(e)}")
                continue

        print(f"Processed {len(processed_bids)} bids successfully") # Debug log
        return jsonify(success=True, bids=processed_bids)
        
    except Exception as e:
        print(f"Error in get_active_bids: {str(e)}")
        return jsonify(success=False, message=str(e)), 500

@bids_bp.route('/<bid_id>/place-bid', methods=['POST'])
@jwt_required()
def place_bid(bid_id):
    try:
        user_email = get_jwt_identity()
        
        # Find the bid first
        bid = bids_collection.find_one({'_id': ObjectId(bid_id)})
        if not bid:
            return jsonify(success=False, message="Bid not found"), 404

        # Check if user is the creator of the bid
        if str(bid.get('instructor_id')) == user_email:
            return jsonify(success=False, message="You cannot bid on your own item"), 400

        # Rest of existing validation
        data = request.get_json()
        if not data or 'amount' not in data:
            return jsonify(success=False, message="Amount is required"), 400
        
        amount = float(data['amount'])
        min_required = bid['current_amount'] + bid['min_increment']
        if amount < min_required:
            return jsonify(
                success=False,
                message=f"Minimum bid amount should be ₹{min_required}"
            ), 400

        # Update the bid
        result = bids_collection.update_one(
            {
                '_id': ObjectId(bid_id),
                'status': 'approved',
                'current_amount': {'$lt': amount}
            },
            {
                '$set': {'current_amount': amount},
                '$push': {
                    'bids': {
                        'user_email': user_email,
                        'amount': amount,
                        'timestamp': datetime.utcnow()
                    }
                }
            }
        )

        if result.modified_count:
            updated_bid = bids_collection.find_one({'_id': ObjectId(bid_id)})
            return jsonify({
                'success': True,
                'message': 'Bid placed successfully',
                'current_amount': amount,
                'total_bids': len(updated_bid.get('bids', []))
            })

        return jsonify(success=False, message="Failed to update bid"), 400

    except Exception as e:
        print(f"Error in place_bid: {str(e)}")
        return jsonify(success=False, message=str(e)), 500

@bids_bp.route('/participated', methods=['GET'])
@jwt_required()
def get_participated_bids():
    try:
        user_email = get_jwt_identity()
        current_time = datetime.utcnow()
        
        print(f"Fetching bids for user: {user_email}")
        
        # Modify query to include both bids the user has participated in
        # AND bids the user has requested that are approved
        pipeline = [
            {
                '$match': {
                    '$or': [
                        {'bids.user_email': user_email},
                        {'requester_email': user_email, 'status': 'approved'}
                    ]
                }
            }
        ]
        
        bids = list(bids_collection.aggregate(pipeline))
        print(f"Found {len(bids)} bids")
        
        processed_bids = []
        for bid in bids:
            try:
                # Debug: Print each bid's status
                print(f"Processing bid {bid.get('_id')}, status: {bid.get('status')}")
                
                # Get bid history sorted by amount
                bid_history = sorted(bid.get('bids', []), key=lambda x: x['amount'] if 'amount' in x else 0, reverse=True)
                
                # Get highest bid
                highest_bid = bid_history[0] if bid_history else None
                
                # Get user's highest bid
                user_bids = [b for b in bid_history if b.get('user_email') == user_email]
                user_highest_bid = max(user_bids, key=lambda x: x['amount']) if user_bids else None

                # Determine if bid has ended
                last_date = bid.get('last_date')
                is_ended = last_date and last_date <= current_time
                print(bid)

                processed_bid = {
                    '_id': str(bid['_id']),
                    'title': bid.get('title', 'Untitled'),
                    'first_name': bid.get('first_name', ''),
                    'last_name': bid.get('last_name', ''),
                    'mobile': bid.get('mobile', ''),
                    'description': bid.get('description', ''),
                    'image': bid.get('image'),
                    'category': bid.get('category', 'Other'),
                    'current_amount': float(bid.get('current_amount', 0)),
                    'my_highest_bid': float(user_highest_bid['amount']) if user_highest_bid else 0,
                    'highest_bidder': highest_bid['user_email'] if highest_bid else None,
                    'last_date': bid['last_date'].isoformat() if 'last_date' in bid else None,
                    'my_email': user_email,
                    'status': 'completed' if is_ended else 'active',
                    'total_bids': len(bid_history),
                    'end_date': bid.get('last_date').isoformat() if bid.get('last_date') else None,
                    'requester_email': bid.get('requester_email'),
                    'is_requester': bid.get('requester_email') == user_email
                }
                processed_bids.append(processed_bid)

            except Exception as e:
                print(f"Error processing bid {bid.get('_id')}: {str(e)}")
                continue

        return jsonify(success=True, bids=processed_bids)

    except Exception as e:
        print(f"Error in get_participated_bids: {str(e)}")
        return jsonify(success=False, message=str(e)), 500

@bids_bp.route('/request', methods=['POST'])
@jwt_required()
def request_bid():
    try:
        user_email = get_jwt_identity()
        print(f"Bid request from user: {user_email}")
        
        # Fetch user details
        user = users_collection.find_one({"email": user_email}, {"first_name": 1, "last_name": 1, "mobile": 1})
        if not user:
            return jsonify(success=False, message="User not found"), 404

        # Get form data
        title = request.form.get('title')
        description = request.form.get('description')
        base_amount = float(request.form.get('baseAmount'))
        min_increment = float(request.form.get('minBidIncrement'))
        category = request.form.get('category')
        condition = request.form.get('condition')
        dimensions = request.form.get('dimensions')
        material = request.form.get('material')
        last_date = datetime.fromisoformat(request.form.get('lastDate').replace('Z', '+00:00'))
        
        # Validation
        if not all([title, description, base_amount, min_increment, category, last_date]):
            return jsonify(success=False, message="Missing required fields"), 400
            
        if last_date <= datetime.utcnow():
            return jsonify(success=False, message="End date must be in the future"), 400
        
        # Process the image if provided
        image_filename = None
        if 'image' in request.files:
            image = request.files['image']
            if image.filename:
                # Create safe filename
                ext = image.filename.rsplit('.', 1)[1].lower() if '.' in image.filename else 'jpg'
                image_filename = f"bid_{user_email.split('@')[0]}_{int(time.time())}.{ext}"
                
                # Save the image - use current_app instead of importing app
                upload_folder = current_app.config['UPLOAD_FOLDERS']['event_posters']
                image_path = os.path.join(upload_folder, image_filename)
                image.save(image_path)
                print(f"Image saved at: {image_path}")
        
        # Create bid request document
        bid_request = {
            'title': title,
            'description': description,
            'base_amount': base_amount,
            'min_increment': min_increment,
            'current_amount': base_amount,  # Initially set to base amount
            'category': category,
            'condition': condition,
            'dimensions': dimensions,
            'material': material,
            'last_date': last_date,
            'image': image_filename,
            'requester_email': user_email,
            'first_name': user.get('first_name'),  # Store first name
            'last_name': user.get('last_name'),    # Store last name
            'mobile': user.get('mobile'),          # Store mobile number
            'status': 'pending',  # Initial status
            'created_at': datetime.utcnow(),
            'bids': []  # No bids initially
        }
        
        # Insert into database
        result = bids_collection.insert_one(bid_request)
        
        return jsonify({
            'success': True,
            'message': 'Bid request submitted successfully for review',
            'bid_id': str(result.inserted_id)
        })
        
    except Exception as e:
        print(f"Error creating bid request: {str(e)}")
        return jsonify(success=False, message=str(e)), 500

@bids_bp.route('/seller-request', methods=['POST'])
@jwt_required()
def seller_bid_request():
    try:
        seller_email = get_jwt_identity()
        print(f"Bid request from seller: {seller_email}")
        
        # Get form data
        title = request.form.get('title')
        description = request.form.get('description')
        base_amount = float(request.form.get('baseAmount'))
        min_increment = float(request.form.get('minBidIncrement'))
        category = request.form.get('category')
        condition = request.form.get('condition')
        dimensions = request.form.get('dimensions')
        material = request.form.get('material')
        last_date = datetime.fromisoformat(request.form.get('lastDate').replace('Z', '+00:00'))
        
        # Validation
        if not all([title, description, base_amount, min_increment, category, last_date]):
            return jsonify(success=False, message="Missing required fields"), 400
            
        if last_date <= datetime.utcnow():
            return jsonify(success=False, message="End date must be in the future"), 400
        
        # Process the image if provided
        image_filename = None
        if 'image' in request.files:
            image = request.files['image']
            if image.filename:
                # Create safe filename
                ext = image.filename.rsplit('.', 1)[1].lower() if '.' in image.filename else 'jpg'
                image_filename = f"bid_seller_{seller_email.split('@')[0]}_{int(time.time())}.{ext}"
                
                # Save the image
                upload_folder = current_app.config['UPLOAD_FOLDERS']['event_posters']
                image_path = os.path.join(upload_folder, image_filename)
                image.save(image_path)
                print(f"Image saved at: {image_path}")
        
        # Create bid request document
        bid_request = {
            'title': title,
            'description': description,
            'base_amount': base_amount,
            'min_increment': min_increment,
            'current_amount': base_amount,  # Initially set to base amount
            'category': category,
            'condition': condition,
            'dimensions': dimensions,
            'material': material,
            'last_date': last_date,
            'image': image_filename,
            'seller_email': seller_email,
            'status': 'pending',  # Initial status
            'created_at': datetime.utcnow(),
            'bids': []  # No bids initially
        }
        
        # Insert into database
        result = bids_collection.insert_one(bid_request)
        
        return jsonify({
            'success': True,
            'message': 'Auction request submitted successfully for review',
            'bid_id': str(result.inserted_id)
        })
        
    except Exception as e:
        print(f"Error creating seller bid request: {str(e)}")
        return jsonify(success=False, message=str(e)), 500

@bids_bp.route('/seller/requests', methods=['GET'])
@jwt_required()
def get_seller_bid_requests():
    try:
        seller_email = get_jwt_identity()
        print(f"Fetching bid requests for seller: {seller_email}")
        
        # Find all bid requests submitted by this seller
        requests = list(bids_collection.find({'seller_email': seller_email}))
        print(f"Found {len(requests)} bid requests")
        
        # Format the requests for the response
        formatted_requests = []
        for request in requests:
            try:
                formatted_request = {
                    '_id': str(request['_id']),
                    'title': request.get('title', 'Untitled'),
                    'description': request.get('description', ''),
                    'base_amount': request.get('base_amount', 0),
                    'current_amount': request.get('current_amount', request.get('base_amount', 0)),
                    'min_increment': request.get('min_increment', 0),
                    'category': request.get('category', 'Other'),
                    'condition': request.get('condition', ''),
                    'dimensions': request.get('dimensions', ''),
                    'material': request.get('material', ''),
                    'image': request.get('image', ''),
                    'last_date': request['last_date'].isoformat() if 'last_date' in request else datetime.utcnow().isoformat(),
                    'created_at': request['created_at'].isoformat() if 'created_at' in request else datetime.utcnow().isoformat(),
                    'status': request.get('status', 'pending'),
                    'bids': []
                }
                
                # Include bids if there are any
                if 'bids' in request and request['bids']:
                    for bid in request['bids']:
                        try:
                            formatted_bid = {
                                'user_email': bid.get('user_email', 'Unknown'),
                                'amount': bid.get('amount', 0),
                                'timestamp': bid['timestamp'].isoformat() if 'timestamp' in bid else datetime.utcnow().isoformat()
                            }
                            formatted_request['bids'].append(formatted_bid)
                        except Exception as e:
                            print(f"Error formatting bid: {str(e)}")
                            continue
                
                formatted_requests.append(formatted_request)
            except Exception as e:
                print(f"Error formatting request {request.get('_id')}: {str(e)}")
                continue
        
        return jsonify(success=True, requests=formatted_requests)
        
    except Exception as e:
        print(f"Error fetching seller bid requests: {str(e)}")
        import traceback
        print(traceback.format_exc())  # Print full traceback for debugging
        return jsonify(success=True, requests=[]), 200  # Return empty list instead of error to avoid 500

@bids_bp.route('/summary', methods=['GET'])
@jwt_required()
def get_bid_summary():
    try:
        user_email = get_jwt_identity()
        current_time = datetime.utcnow()
        
        # Get all bids that the user has either participated in or requested
        pipeline = [
            {
                '$match': {
                    '$or': [
                        {'bids.user_email': user_email},
                        {'requester_email': user_email}
                    ]
                }
            }
        ]
        
        bids = list(bids_collection.aggregate(pipeline))
        
        # Initialize counters
        active_count = 0
        won_count = 0
        lost_count = 0
        pending_count = 0
        approved_count = 0
        rejected_count = 0
        
        for bid in bids:
            # Count requested bids by status
            if bid.get('requester_email') == user_email:
                if bid.get('status') == 'pending':
                    pending_count += 1
                elif bid.get('status') == 'approved':
                    approved_count += 1
                elif bid.get('status') == 'rejected':
                    rejected_count += 1
            
            # Count participated bids
            if any(b.get('user_email') == user_email for b in bid.get('bids', [])):
                last_date = bid.get('last_date')
                is_ended = last_date and last_date <= current_time
                
                if not is_ended:
                    active_count += 1
                else:
                    # Get bid history and check if user won
                    bid_history = sorted(bid.get('bids', []), key=lambda x: x['amount'] if 'amount' in x else 0, reverse=True)
                    highest_bid = bid_history[0] if bid_history else None
                    
                    if highest_bid and highest_bid.get('user_email') == user_email:
                        won_count += 1
                    else:
                        lost_count += 1
        
        # Get total bid count and total bid amount
        total_bids = bids_collection.count_documents({})
        total_active_bids = bids_collection.count_documents({
            'status': 'approved',
            'last_date': {'$gt': current_time}
        })
        
        # Get most popular bid categories
        categories = bids_collection.aggregate([
            {'$match': {'status': 'approved'}},
            {'$group': {'_id': '$category', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}},
            {'$limit': 5}
        ])
        
        category_stats = []
        for category in categories:
            category_stats.append({
                'name': category['_id'] or 'Uncategorized',
                'count': category['count']
            })
        
        return jsonify({
            'success': True,
            'stats': {
                'active_count': active_count,
                'won_count': won_count,
                'lost_count': lost_count,
                'pending_count': pending_count,
                'approved_count': approved_count,
                'rejected_count': rejected_count,
                'total_bids': total_bids,
                'total_active_bids': total_active_bids,
                'category_stats': category_stats
            }
        })
        
    except Exception as e:
        print(f"Error in get_bid_summary: {str(e)}")
        return jsonify(success=False, message=str(e)), 500
