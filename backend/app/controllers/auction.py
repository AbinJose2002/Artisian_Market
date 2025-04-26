import os
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import auctions_collection, seller_collection, users_collection
from bson import ObjectId
from app.utils.pdf_generator import generate_auction_invoice_pdf

auction_bp = Blueprint("auction", __name__)

# ...existing code...

@auction_bp.route("/invoice/<auction_id>", methods=["GET"])
@jwt_required()
def download_auction_invoice(auction_id):
    try:
        user_identity = get_jwt_identity()
        
        # Find the auction
        auction = auctions_collection.find_one({"_id": ObjectId(auction_id)})
        
        if not auction:
            return jsonify(success=False, message="Auction not found"), 404
            
        # Check if auction is completed and has a winner
        if auction.get("status") != "completed" or not auction.get("winner"):
            return jsonify(success=False, message="No invoice available - auction not completed or no winner"), 400
            
        # Verify user is authorized to access this invoice (either seller or winning bidder)
        if user_identity != auction.get("seller_id") and user_identity != auction.get("winner"):
            return jsonify(success=False, message="Unauthorized to access this invoice"), 403
            
        # Get seller info
        seller = seller_collection.find_one({"email": auction.get("seller_id")})
        seller_name = f"{seller.get('firstName', '')} {seller.get('lastName', '')}" if seller else "Unknown Seller"
        
        # Get bidder info
        bidder = users_collection.find_one({"email": auction.get("winner")})
        bidder_name = f"{bidder.get('firstName', '')} {bidder.get('lastName', '')}" if bidder else "Unknown Bidder"
        
        # Format the auction data for the PDF
        auction_data = {
            "auction_id": str(auction["_id"]),
            "end_date": auction.get("end_time", "Unknown"),
            "item_name": auction.get("title", "Unnamed Item"),
            "item_description": auction.get("description", ""),
            "winning_bid": auction.get("current_bid", 0),
            "bidder_name": bidder_name,
            "bidder_email": auction.get("winner", "Unknown"),
            "seller_name": seller_name,
            "seller_email": auction.get("seller_id", "Unknown"),
            "platform_fee": float(auction.get("current_bid", 0)) * 0.05,  # 5% platform fee
            "total_amount": float(auction.get("current_bid", 0)) * 1.05  # bid + 5% fee
        }
        
        # Generate PDF
        pdf_buffer = generate_auction_invoice_pdf(auction_data)
        
        # Return the PDF
        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f"auction_invoice_{auction_id[:8]}.pdf"
        )
        
    except Exception as e:
        print(f"Error generating auction invoice: {e}")
        return jsonify(success=False, message=str(e)), 500