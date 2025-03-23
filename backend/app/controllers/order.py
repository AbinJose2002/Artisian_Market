from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import orders_collection
from bson import ObjectId
from datetime import datetime

order_bp = Blueprint('order', __name__)

ORDER_STATUSES = ['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled']

@order_bp.route('/user/orders', methods=['GET'])
@jwt_required()
def get_user_orders():
    try:
        user_email = get_jwt_identity()
        orders = list(orders_collection.find({"user_email": user_email}))
        
        # Process orders for response
        formatted_orders = []
        for order in orders:
            try:
                formatted_order = {
                    'order_id': str(order['_id']),
                    'items': [{
                        'name': item.get('name', ''),
                        'price': item.get('price', 0),
                        'quantity': item.get('quantity', 1),
                        'image': item.get('image', '')
                    } for item in order.get('items', [])],
                    'total_amount': sum(float(item.get('price', 0)) * item.get('quantity', 1) 
                                     for item in order.get('items', [])),
                    'payment_id': order.get('payment_id', ''),
                    'status': order.get('status', 'pending'),
                    'created_at': order.get('created_at', datetime.now()).strftime('%Y-%m-%d %H:%M:%S'),
                    'shipping_address': order.get('shipping_address', {})
                }
                formatted_orders.append(formatted_order)
            except Exception as e:
                print(f"Error processing order {order.get('_id')}: {str(e)}")
                continue
            
        return jsonify(success=True, orders=formatted_orders)
    except Exception as e:
        print(f"Error fetching orders: {str(e)}")
        return jsonify(success=False, message="Failed to fetch orders"), 500

@order_bp.route('/seller/orders', methods=['GET'])
@jwt_required()
def get_seller_orders():
    try:
        seller_email = get_jwt_identity()
        orders = list(orders_collection.find({
            "items.seller_id": seller_email
        }).sort("created_at", -1))

        formatted_orders = []
        for order in orders:
            # Filter items for this seller only
            seller_items = [
                item for item in order.get('items', [])
                if item.get('seller_id') == seller_email
            ]
            
            if seller_items:
                formatted_order = {
                    'order_id': str(order['_id']),
                    'items': seller_items,
                    'customer_email': order.get('user_email'),
                    'total_amount': sum(float(item.get('price', 0)) for item in seller_items),
                    'status': order.get('status', 'pending'),
                    'created_at': order.get('created_at').strftime('%Y-%m-%d %H:%M:%S'),
                    'shipping_address': order.get('shipping_address', {})
                }
                formatted_orders.append(formatted_order)

        return jsonify(success=True, orders=formatted_orders)
    except Exception as e:
        print(f"Error fetching seller orders: {str(e)}")
        return jsonify(success=False, message=str(e)), 500

@order_bp.route('/seller/update-status/<order_id>', methods=['PUT'])
@jwt_required()
def update_order_status(order_id):  # Add order_id parameter here
    try:
        seller_email = get_jwt_identity()
        new_status = request.json.get('status')
        
        if not new_status or new_status not in ORDER_STATUSES:
            return jsonify(success=False, message="Invalid status"), 400

        # Convert string ID to ObjectId
        order_obj_id = ObjectId(order_id)

        result = orders_collection.update_one(
            {
                "_id": order_obj_id,
                "items.seller_id": seller_email
            },
            {"$set": {"status": new_status}}
        )

        if result.modified_count:
            return jsonify(success=True, message="Order status updated successfully")
        return jsonify(success=False, message="Order not found or unauthorized"), 404

    except Exception as e:
        print(f"Error updating order status: {str(e)}")
        return jsonify(success=False, message=str(e)), 500
