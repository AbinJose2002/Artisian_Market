from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import stripe
from app import events_collection, users_collection, product_collection, orders_collection  # Add orders_collection
from bson import ObjectId
import datetime

payment_bp = Blueprint('payment', __name__)

stripe.api_key = 'sk_test_51Pf271RrUp4W2KP50qaO3bSd04UIjWNdXooG7UzzDvzdDaPK6XtJDOdTBjyoRNKmkKdYe16gqfsFZNxoZTY3SX7o00q8jPSEoQ'

@payment_bp.route('/create-session', methods=['POST'])
@jwt_required()
def create_checkout_session():
    try:
        print("Creating checkout session...") # Debug log
        data = request.get_json()
        if not data:
            return jsonify(error="No data provided"), 400

        event_id = data.get('eventId')
        if not event_id:
            return jsonify(error="Event ID is required"), 400

        print(f"Looking up event: {event_id}") # Debug log
        event = events_collection.find_one({'_id': ObjectId(event_id)})
        
        if not event:
            return jsonify(error="Event not found"), 404

        # Update Stripe session creation with better error handling
        try:
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'inr',
                        'product_data': {
                            'name': event['name'],
                            'description': event.get('description', '')[:255],  # Stripe limit
                        },
                        'unit_amount': int(float(event['fee']) * 100),
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url='http://localhost:5173/payment/success?session_id={CHECKOUT_SESSION_ID}',
                cancel_url='http://localhost:5173/payment/cancel',
                metadata={
                    'event_id': str(event['_id']),
                    'user_id': get_jwt_identity()
                }
            )
            print(f"Session created successfully: {session.id}")
            return jsonify({"success": True, "sessionId": session.id})
        
        except stripe.error.StripeError as e:
            print(f"Stripe error: {str(e)}")
            return jsonify({"success": False, "error": str(e)}), 400
            
    except Exception as e:
        print(f"Server error: {str(e)}")
        return jsonify({"success": False, "error": "Internal server error"}), 500

@payment_bp.route('/verify', methods=['POST'])
@jwt_required()
def verify_payment():
    try:
        session_id = request.json.get('sessionId')
        payment_type = request.json.get('type', 'event')
        
        if not session_id:
            return jsonify({"success": False, "error": "Session ID required"}), 400
            
        session = stripe.checkout.Session.retrieve(session_id)
        
        if session.payment_status == 'paid':
            user_email = get_jwt_identity()
            
            if payment_type == 'cart':
                # Create order from cart items
                user = users_collection.find_one({"email": user_email})
                cart_items = list(product_collection.find({"_id": {"$in": user.get('cart', [])}}))

                # Check and update product quantities
                for item in cart_items:
                    if item['quantity'] < 1:
                        return jsonify({
                            "success": False, 
                            "error": f"Product {item['name']} is out of stock"
                        }), 400

                    # Decrease quantity
                    product_collection.update_one(
                        {"_id": item['_id']},
                        {"$inc": {"quantity": -1}}
                    )
                
                order = {
                    'user_email': user_email,
                    'items': [{
                        'id': str(item['_id']),
                        'name': item['name'],
                        'price': item['price'],
                        'image': item.get('image', ''),
                        'seller_id': str(item.get('seller_id', '')),  # Convert ObjectId to string and handle missing seller_id
                        'quantity': 1
                    } for item in cart_items],
                    'total_amount': sum(float(item['price']) for item in cart_items),
                    'payment_id': session.id,
                    'status': 'confirmed',
                    'created_at': datetime.datetime.now(),
                    'payment_status': 'completed'
                }
                
                # Save order and clear cart
                orders_collection.insert_one(order)
                users_collection.update_one(
                    {"email": user_email},
                    {"$set": {"cart": []}}
                )
                
                print(f"Created order for user {user_email} with {len(cart_items)} items")
                
            else:  # Event registration
                # Check if already registered
                event = events_collection.find_one({
                    '_id': ObjectId(session.metadata['event_id']),
                    'registered_users.payment_id': session.id
                })
                
                if not event:  # Only register if not already done
                    events_collection.update_one(
                        {'_id': ObjectId(session.metadata['event_id'])},
                        {'$addToSet': {'registered_users': {
                            'user_id': get_jwt_identity(),
                            'payment_status': 'completed',
                            'payment_id': session.id,
                            'payment_date': datetime.datetime.now()
                        }}}
                    )
                    print(f"Registered user for event {session.metadata['event_id']}")
            
            return jsonify({"success": True, "type": payment_type})
            
        return jsonify({"success": False, "error": "Payment incomplete"}), 400
            
    except Exception as e:
        print(f"Payment verification error: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@payment_bp.route('/webhook', methods=['POST'])
def webhook():
    try:
        # Remove webhook registration logic since it's handled in verify endpoint
        event = stripe.Webhook.construct_event(
            request.data, 
            request.headers['Stripe-Signature'], 
            'your_webhook_secret'
        )
        print(f"Received webhook event: {event['type']}")
        return jsonify(success=True)
    except Exception as e:
        print(f"Webhook error: {str(e)}")
        return jsonify(error=str(e)), 400

@payment_bp.route('/create-cart-session', methods=['POST'])
@jwt_required()
def create_cart_checkout_session():
    try:
        print("Creating cart checkout session...") # Debug log
        user_email = get_jwt_identity()
        user = users_collection.find_one({"email": user_email})
        
        if not user:
            return jsonify(error="User not found"), 404

        # Get cart items
        cart_items = []
        cart_products = []
        
        if 'cart' in user:
            cart_products = list(product_collection.find({"_id": {"$in": user['cart']}}))
            print(f"Found {len(cart_products)} items in cart") # Debug log

        for product in cart_products:
            cart_items.append({
                'price_data': {
                    'currency': 'inr',
                    'product_data': {
                        'name': product['name'],
                        'description': product.get('description', '')[:255],
                    },
                    'unit_amount': int(float(product['price']) * 100),
                },
                'quantity': 1,
            })

        if not cart_items:
            return jsonify(error="Cart is empty"), 400

        # Create Stripe checkout session
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=cart_items,
            mode='payment',
            success_url='http://localhost:5173/payment/success?session_id={CHECKOUT_SESSION_ID}&type=cart',
            cancel_url='http://localhost:5173/cart',
            metadata={
                'user_id': user_email,
                'type': 'cart_purchase'
            }
        )

        print(f"Created cart checkout session: {session.id}") # Debug log
        return jsonify({"success": True, "sessionId": session.id})
    except Exception as e:
        print(f"Error creating cart checkout: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500
