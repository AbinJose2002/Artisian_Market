import os
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import users_collection, product_collection, material_collection, orders_collection
from bson import ObjectId
from datetime import datetime
from app.utils.pdf_generator import generate_invoice_pdf

order_bp = Blueprint("order", __name__)

ORDER_STATUSES = ['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled']

@order_bp.route('/user/orders', methods=['GET'])
@jwt_required()
def get_user_orders():
    try:
        user_identity = get_jwt_identity()
        print(f"Fetching orders for user: {user_identity}")
        
        # Find all orders for this user
        all_orders = list(orders_collection.find({
            "$or": [
                {"user_identity": user_identity},
                {"user_email": user_identity}
            ]
        }))
        
        print(f"Found {len(all_orders)} orders in database")
        
        formatted_orders = []
        for order in all_orders:
            order_dict = {
                "_id": str(order["_id"]),
                "status": order.get("status", "completed"),
                "payment_id": order.get("payment_id", ""),
                "created_at": order.get("created_at", datetime.now()),
                "items": [],
                "material_items": []
            }
            
            # Get product details
            product_ids = order.get("product_ids", [])
            if isinstance(product_ids, list) and product_ids:
                print(f"Order {order_dict['_id']} has {len(product_ids)} product IDs")
                for product_id in product_ids:
                    try:
                        product = product_collection.find_one({"_id": product_id})
                        if product:
                            order_dict["items"].append({
                                "id": str(product["_id"]),
                                "name": product.get("name", "Unknown Product"),
                                "price": product.get("price", "0"),
                                "image": product.get("image", ""),
                                "category": product.get("category", ""),
                                "itemType": "product"
                            })
                    except Exception as e:
                        print(f"Error processing product {product_id}: {e}")
            
            # Get material details
            material_ids = order.get("material_ids", [])
            if isinstance(material_ids, list) and material_ids:
                print(f"Order {order_dict['_id']} has {len(material_ids)} material IDs")
                for material_id in material_ids:
                    try:
                        material = material_collection.find_one({"_id": material_id})
                        if material:
                            order_dict["material_items"].append({
                                "id": str(material["_id"]),
                                "name": material.get("name", "Unknown Material"),
                                "price": material.get("price", "0"),
                                "image": material.get("image", ""),
                                "category": material.get("category", ""),
                                "itemType": "material"
                            })
                    except Exception as e:
                        print(f"Error processing material {material_id}: {e}")
            
            # Calculate total amount
            all_items = order_dict["items"] + order_dict["material_items"]
            total_amount = sum(float(item.get("price", 0)) for item in all_items)
            order_dict["total_amount"] = total_amount
            
            # Always include the order, even if it has no items
            formatted_orders.append(order_dict)
        
        print(f"Returning {len(formatted_orders)} formatted orders")
        return jsonify(success=True, orders=formatted_orders)
    
    except Exception as e:
        print(f"Error fetching user orders: {e}")
        return jsonify(success=False, message=str(e)), 500

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

@order_bp.route("/seller-purchases", methods=["GET"])
@jwt_required()
def get_seller_purchases():
    try:
        seller_id = get_jwt_identity()
        print(f"Fetching purchases for seller: {seller_id}")
        
        # Find orders where the seller is the purchaser
        orders = []
        
        # Check if the user/seller has made any purchases
        all_orders = list(orders_collection.find({"user_identity": seller_id}))
        
        # If no orders with user_identity, try finding by email if seller_id is an email
        if not all_orders and '@' in seller_id:
            all_orders = list(orders_collection.find({"user_email": seller_id}))
        
        # Format orders for response
        formatted_orders = []
        for order in all_orders:
            order_dict = {
                "_id": str(order["_id"]),
                "status": order.get("status", "completed"),
                "payment_id": order.get("payment_id", ""),
                "created_at": order.get("created_at", datetime.now()),
                "items": []
            }
            
            # Get product details
            product_ids = order.get("product_ids", [])
            if isinstance(product_ids, list) and product_ids:
                for product_id in product_ids:
                    try:
                        product = product_collection.find_one({"_id": product_id})
                        if product:
                            order_dict["items"].append({
                                "id": str(product["_id"]),
                                "name": product.get("name", "Unknown Product"),
                                "price": product.get("price", "0"),
                                "image": product.get("image", ""),
                                "category": product.get("category", ""),
                                "itemType": "product"
                            })
                    except Exception as e:
                        print(f"Error getting product {product_id}: {e}")
            
            # Get material details
            material_ids = order.get("material_ids", [])
            if isinstance(material_ids, list) and material_ids:
                for material_id in material_ids:
                    try:
                        material = material_collection.find_one({"_id": material_id})
                        if material:
                            order_dict["items"].append({
                                "id": str(material["_id"]),
                                "name": material.get("name", "Unknown Material"),
                                "price": material.get("price", "0"),
                                "image": material.get("image", ""),
                                "category": material.get("category", ""),
                                "itemType": "material"
                            })
                    except Exception as e:
                        print(f"Error getting material {material_id}: {e}")
            
            # Calculate total amount
            total_amount = sum(float(item.get("price", 0)) for item in order_dict["items"])
            order_dict["total_amount"] = total_amount
            
            # Only add orders that have items
            if order_dict["items"]:
                formatted_orders.append(order_dict)
            
        print(f"Found {len(formatted_orders)} orders with {sum(len(order['items']) for order in formatted_orders)} total items")
        return jsonify(success=True, orders=formatted_orders)
    
    except Exception as e:
        print(f"Error fetching seller purchases: {e}")
        return jsonify(success=False, message=str(e)), 500

@order_bp.route("/invoice/<order_id>", methods=["GET"])
@jwt_required()
def download_invoice(order_id):
    try:
        user_identity = get_jwt_identity()
        
        # Find the order
        order = orders_collection.find_one({"_id": ObjectId(order_id)})
        
        if not order:
            return jsonify(success=False, message="Order not found"), 404
            
        # Check if the user is authorized to access this order
        if order.get("user_identity") != user_identity and order.get("user_email") != user_identity:
            return jsonify(success=False, message="Unauthorized to access this order"), 403
            
        # Format the order data for the PDF
        formatted_order = {
            "_id": str(order["_id"]),
            "payment_id": order.get("payment_id", ""),
            "created_at": order.get("created_at", datetime.now()),
            "items": [],
            "total_amount": 0
        }
        
        # Get product details
        total_amount = 0
        product_ids = order.get("product_ids", [])
        for product_id in product_ids:
            product = product_collection.find_one({"_id": product_id})
            if product:
                item = {
                    "id": str(product["_id"]),
                    "name": product.get("name", "Unknown Product"),
                    "price": product.get("price", "0"),
                    "category": product.get("category", ""),
                    "itemType": "product"
                }
                formatted_order["items"].append(item)
                total_amount += float(product.get("price", 0))
                
        # Get material details
        material_ids = order.get("material_ids", [])
        for material_id in material_ids:
            material = material_collection.find_one({"_id": material_id})
            if material:
                item = {
                    "id": str(material["_id"]),
                    "name": material.get("name", "Unknown Material"),
                    "price": material.get("price", "0"),
                    "category": material.get("category", ""),
                    "itemType": "material"
                }
                formatted_order["items"].append(item)
                total_amount += float(material.get("price", 0))
                
        formatted_order["total_amount"] = total_amount
        
        # Generate PDF
        pdf_buffer = generate_invoice_pdf(formatted_order)
        
        # Return the PDF
        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f"invoice_{order_id[:8]}.pdf"
        )
        
    except Exception as e:
        print(f"Error generating invoice: {e}")
        return jsonify(success=False, message=str(e)), 500
