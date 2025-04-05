from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson.objectid import ObjectId
from datetime import datetime
from app import db, product_collection, events_collection, orders_collection

reviews_bp = Blueprint('reviews', __name__)

# Initialize reviews collections
product_reviews_collection = db.get_collection("product_reviews")
event_reviews_collection = db.get_collection("event_reviews")

@reviews_bp.route('/product/<product_id>', methods=['POST'])
@jwt_required()
def add_product_review(product_id):
    try:
        user_email = get_jwt_identity()
        print(f"Adding product review from user: {user_email} for product: {product_id}")
        
        data = request.json
        if not data:
            return jsonify(success=False, message="No data provided"), 400
            
        rating = int(data.get('rating', 5))
        comment = data.get('comment', '')
        
        if rating < 1 or rating > 5:
            return jsonify(success=False, message="Rating must be between 1 and 5"), 400
        
        # For product reviews, relax the verification since we may not have proper order records yet
        # In a production environment, you would want to verify purchases
        
        # Create review document
        review = {
            'product_id': product_id,
            'user_email': user_email,
            'rating': rating,
            'comment': comment,
            'created_at': datetime.utcnow()
        }
        
        # Insert review
        result = product_reviews_collection.insert_one(review)
        
        # Update product with review information
        product_collection.update_one(
            {'_id': ObjectId(product_id)},
            {
                '$push': {'reviews': {
                    'review_id': str(result.inserted_id),
                    'user_email': user_email,
                    'rating': rating,
                    'comment': comment,
                    'created_at': review['created_at']
                }},
                '$inc': {'review_count': 1}  # Increment review count
            }
        )
        
        # Calculate and update average rating
        all_reviews = list(product_reviews_collection.find({'product_id': product_id}))
        avg_rating = sum(review['rating'] for review in all_reviews) / len(all_reviews)
        
        product_collection.update_one(
            {'_id': ObjectId(product_id)},
            {'$set': {'avg_rating': avg_rating}}
        )
        
        print(f"Product review added successfully: {result.inserted_id}")
        return jsonify(success=True, message="Review submitted successfully")
        
    except Exception as e:
        print(f"Error submitting product review: {str(e)}")
        return jsonify(success=False, message=str(e)), 500


@reviews_bp.route('/event/<event_id>', methods=['POST'])
@jwt_required()
def add_event_review(event_id):
    try:
        user_email = get_jwt_identity()
        print(f"Adding event review from user: {user_email} for event: {event_id}")
        
        data = request.json
        if not data:
            return jsonify(success=False, message="No data provided"), 400
            
        rating = int(data.get('rating', 5))
        comment = data.get('comment', '')
        
        if rating < 1 or rating > 5:
            return jsonify(success=False, message="Rating must be between 1 and 5"), 400
        
        # For event reviews, relax the verification for now
        # In a production environment, you would want to verify registration
        
        # Create review document
        review = {
            'event_id': event_id,
            'user_email': user_email,
            'rating': rating,
            'comment': comment,
            'created_at': datetime.utcnow()
        }
        
        # Insert review
        result = event_reviews_collection.insert_one(review)
        
        # Update event with review information
        events_collection.update_one(
            {'_id': ObjectId(event_id)},
            {
                '$push': {'reviews': {
                    'review_id': str(result.inserted_id),
                    'user_email': user_email,
                    'rating': rating,
                    'comment': comment,
                    'created_at': review['created_at']
                }},
                '$inc': {'review_count': 1}  # Increment review count
            }
        )
        
        print(f"Event review added successfully: {result.inserted_id}")
        return jsonify(success=True, message="Review submitted successfully")
        
    except Exception as e:
        print(f"Error submitting event review: {str(e)}")
        return jsonify(success=False, message=str(e)), 500


@reviews_bp.route('/product/<product_id>', methods=['GET'])
def get_product_reviews(product_id):
    try:
        reviews = list(product_reviews_collection.find({'product_id': product_id}))
        
        # Format reviews for response
        formatted_reviews = []
        for review in reviews:
            formatted_reviews.append({
                'review_id': str(review['_id']),
                'user_email': review['user_email'],
                'rating': review['rating'],
                'comment': review['comment'],
                'created_at': review['created_at'].isoformat()
            })
            
        return jsonify(success=True, reviews=formatted_reviews)
        
    except Exception as e:
        print(f"Error fetching product reviews: {str(e)}")
        return jsonify(success=False, message=str(e)), 500


@reviews_bp.route('/event/<event_id>', methods=['GET'])
def get_event_reviews(event_id):
    try:
        reviews = list(event_reviews_collection.find({'event_id': event_id}))
        
        # Format reviews for response
        formatted_reviews = []
        for review in reviews:
            formatted_reviews.append({
                'review_id': str(review['_id']),
                'user_email': review['user_email'],
                'rating': review['rating'],
                'comment': review['comment'],
                'created_at': review['created_at'].isoformat()
            })
        
        # Calculate average rating
        avg_rating = None
        if reviews:
            total_rating = sum(review['rating'] for review in reviews)
            avg_rating = total_rating / len(reviews)
            
        return jsonify(success=True, reviews=formatted_reviews, avg_rating=avg_rating)
        
    except Exception as e:
        print(f"Error fetching event reviews: {str(e)}")
        return jsonify(success=False, message=str(e)), 500


@reviews_bp.route('/user/products', methods=['GET'])
@jwt_required()
def get_user_product_reviews():
    try:
        user_email = get_jwt_identity()
        
        # Find reviews submitted by this user
        reviews = list(product_reviews_collection.find({'user_email': user_email}))
        
        # Format reviews for response with product details
        formatted_reviews = []
        for review in reviews:
            try:
                product_id = review.get('product_id')
                product = product_collection.find_one({'_id': ObjectId(product_id)})
                
                formatted_review = {
                    'review_id': str(review['_id']),
                    'product_id': product_id,
                    'product_name': product.get('name', 'Unknown Product') if product else 'Unknown Product',
                    'product_image': product.get('image') if product else None,
                    'rating': review['rating'],
                    'comment': review['comment'],
                    'created_at': review['created_at'].isoformat()
                }
                formatted_reviews.append(formatted_review)
            except Exception as e:
                print(f"Error processing review {review.get('_id')}: {str(e)}")
                continue
            
        return jsonify(success=True, reviews=formatted_reviews)
        
    except Exception as e:
        print(f"Error fetching user product reviews: {str(e)}")
        return jsonify(success=False, message=str(e)), 500

@reviews_bp.route('/user/events', methods=['GET'])
@jwt_required()
def get_user_event_reviews():
    try:
        user_email = get_jwt_identity()
        
        # Find reviews submitted by this user
        reviews = list(event_reviews_collection.find({'user_email': user_email}))
        
        # Format reviews for response with event details
        formatted_reviews = []
        for review in reviews:
            try:
                event_id = review.get('event_id')
                event = events_collection.find_one({'_id': ObjectId(event_id)})
                
                formatted_review = {
                    'review_id': str(review['_id']),
                    'event_id': event_id,
                    'event_name': event.get('name', 'Unknown Event') if event else 'Unknown Event',
                    'event_poster': event.get('poster') if event else None,
                    'rating': review['rating'],
                    'comment': review['comment'],
                    'created_at': review['created_at'].isoformat()
                }
                formatted_reviews.append(formatted_review)
            except Exception as e:
                print(f"Error processing review {review.get('_id')}: {str(e)}")
                continue
            
        return jsonify(success=True, reviews=formatted_reviews)
        
    except Exception as e:
        print(f"Error fetching user event reviews: {str(e)}")
        return jsonify(success=False, message=str(e)), 500
