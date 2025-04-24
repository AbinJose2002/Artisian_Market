import os
import stripe
from flask import Blueprint, request, jsonify, redirect, url_for
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import users_collection, product_collection, material_collection, orders_collection, events_collection
from bson import ObjectId
from datetime import datetime

payment_bp = Blueprint("payment", __name__)

# Use environment variable for Stripe API key with proper fallback
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY", "sk_test_51Pf271RrUp4W2KP50qaO3bSd04UIjWNdXooG7UzzDvzdDaPK6XtJDOdTBjyoRNKmkKdYe16gqfsFZNxoZTY3SX7o00q8jPSEoQ")

@payment_bp.route("/create-cart-session", methods=["POST"])
@jwt_required()
def create_cart_session():
    try:
        user_identity = get_jwt_identity()
        is_email = '@' in user_identity
        
        # Find the user based on the identity type
        if is_email:
            user = users_collection.find_one({"email": user_identity})
        else:
            user = users_collection.find_one({"_id": user_identity})
            if not user:
                user = users_collection.find_one({"seller_id": user_identity})
                
        if not user:
            return jsonify(success=False, message="User not found"), 404
        
        # Get both product and material cart items
        product_items = []
        material_items = []
        
        # Get product items if cart exists
        if "cart" in user and user["cart"]:
            product_items = list(product_collection.find({"_id": {"$in": user["cart"]}}))
            for item in product_items:
                item["_id"] = str(item["_id"])
        
        # Get material items if cart_materials exists
        if "cart_materials" in user and user["cart_materials"]:
            material_items = list(material_collection.find({"_id": {"$in": user["cart_materials"]}}))
            for item in material_items:
                item["_id"] = str(item["_id"])
                item["itemType"] = "material"  # Add type indicator
        
        # Add type indicator to product items
        for item in product_items:
            item["itemType"] = "product"
            
        # Combine the items
        all_items = product_items + material_items
        
        print(f"Found {len(all_items)} items in cart")
        
        if not all_items:
            return jsonify(success=False, message="Cart is empty"), 400
        
        # Convert items to Stripe line items with fixed formatting
        line_items = []
        for item in all_items:
            price_in_cents = int(float(item["price"]) * 100)
            
            # Ensure description is not too long for Stripe
            description = item.get("description", "")
            if description and len(description) > 500:
                description = description[:497] + "..."
                
            line_item = {
                "price_data": {
                    "currency": "inr",
                    "product_data": {
                        "name": item["name"][:100],  # Limit name length
                        "description": description,
                    },
                    "unit_amount": price_in_cents,
                },
                "quantity": 1,
            }
            
            # Only add image if it's a valid URL
            if item.get("image") and isinstance(item["image"], str) and item["image"].startswith(("http://", "https://")):
                line_item["price_data"]["product_data"]["images"] = [item["image"]]
                
            line_items.append(line_item)
        
        # Create Stripe checkout session with proper domain for redirect URLs
        domain_url = request.host_url.rstrip('/')
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=line_items,
            mode="payment",
            success_url=f"{domain_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{domain_url}/payment/cancel",
            metadata={
                "user_identity": user_identity,
                "is_email": str(is_email),
                "product_ids": ",".join([item["_id"] for item in product_items]),
                "material_ids": ",".join([item["_id"] for item in material_items])
            }
        )
        
        print(f"Created cart checkout session: {checkout_session.id}")
        
        return jsonify(success=True, sessionId=checkout_session.id, url=checkout_session.url)
    
    except Exception as e:
        print(f"Error creating checkout session: {str(e)}")
        return jsonify(success=False, message=str(e)), 500

@payment_bp.route("/success", methods=["GET"])
def payment_success():
    session_id = request.args.get("session_id")
    
    try:
        # Retrieve the session from Stripe
        checkout_session = stripe.checkout.Session.retrieve(session_id)
        
        # Extract metadata
        user_identity = checkout_session.metadata.get("user_identity")
        is_email = checkout_session.metadata.get("is_email") == "True"
        product_ids_str = checkout_session.metadata.get("product_ids", "")
        material_ids_str = checkout_session.metadata.get("material_ids", "")
        
        product_ids = [ObjectId(pid) for pid in product_ids_str.split(",") if pid]
        material_ids = [ObjectId(mid) for mid in material_ids_str.split(",") if mid]
        
        # Process order
        order = {
            "user_identity": user_identity,
            "is_email": is_email,
            "product_ids": product_ids,
            "material_ids": material_ids,
            "status": "completed",
            "payment_id": checkout_session.id,
            "created_at": datetime.now()
        }
        
        orders_collection.insert_one(order)
        
        # Update product inventory
        for pid in product_ids:
            product_collection.update_one(
                {"_id": pid},
                {"$inc": {"quantity": -1}}
            )
            
        # Update material inventory
        for mid in material_ids:
            material_collection.update_one(
                {"_id": mid},
                {"$inc": {"quantity": -1}}
            )
        
        # Clear cart
        if is_email:
            users_collection.update_one(
                {"email": user_identity},
                {"$set": {"cart": [], "cart_materials": []}}
            )
        else:
            # Handle seller/instructor
            users_collection.update_one(
                {"_id": user_identity} if users_collection.find_one({"_id": user_identity}) else {"seller_id": user_identity},
                {"$set": {"cart": [], "cart_materials": []}}
            )
        
        # Redirect to frontend thank-you page instead of backend endpoint
        return redirect("http://localhost:5173/thank-you")
    
    except Exception as e:
        print(f"Error processing payment: {str(e)}")
        return redirect("http://localhost:5173/payment/error")

@payment_bp.route("/thank-you", methods=["GET"])
def thank_you():
    # Keep this endpoint for backward compatibility, but it just redirects
    return redirect("http://localhost:5173/thank-you")

@payment_bp.route("/error", methods=["GET"])
def payment_error():
    return jsonify(success=False, message="There was an error processing your payment. Please try again.")

@payment_bp.route("/cancel", methods=["GET"])
def payment_cancel():
    return jsonify(success=False, message="Payment was cancelled.")

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
