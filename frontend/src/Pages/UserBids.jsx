import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileInvoice, faDownload } from '@fortawesome/free-solid-svg-icons';

// ...existing code...

const UserBids = () => {
    // ...existing code...

    const downloadAuctionInvoice = (auctionId) => {
        try {
            const token = localStorage.getItem('usertoken');
            
            // Create a downloadable link
            const downloadLink = document.createElement('a');
            downloadLink.href = `http://localhost:8080/auction/invoice/${auctionId}`;
            
            // Use fetch to get the PDF with authentication
            fetch(downloadLink.href, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(response => {
                if (response.ok) return response.blob();
                throw new Error('Failed to download invoice');
            })
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                downloadLink.href = url;
                downloadLink.download = `auction_invoice_${auctionId.substring(0, 8)}.pdf`;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(downloadLink);
                toast.success('Invoice downloaded successfully');
            })
            .catch(error => {
                console.error('Error downloading invoice:', error);
                toast.error('Failed to download invoice');
            });
        } catch (error) {
            console.error('Error setting up invoice download:', error);
            toast.error('Failed to download invoice');
        }
    };

    // ...existing code...

    return (
        <div className="container py-5">
            <h2 className="mb-4">My Bids</h2>
            
            {/* ...existing code... */}
            
            {/* Won Auctions Section */}
            <div className="mb-5">
                <h3 className="mb-3">Won Auctions</h3>
                {wonAuctions.length === 0 ? (
                    <p>You haven't won any auctions yet.</p>
                ) : (
                    <div className="row">
                        {wonAuctions.map((auction) => (
                            <div key={auction._id} className="col-md-4 mb-4">
                                <div className="card h-100">
                                    {auction.image ? (
                                        <img src={auction.image} className="card-img-top" alt={auction.title} />
                                    ) : (
                                        <div className="placeholder-image">No Image</div>
                                    )}
                                    <div className="card-body">
                                        <h5 className="card-title">{auction.title}</h5>
                                        <p className="card-text">{auction.description}</p>
                                        <p><strong>Winning Bid:</strong> ₹{auction.current_bid}</p>
                                        <p><strong>End Date:</strong> {new Date(auction.end_time).toLocaleDateString()}</p>
                                        
                                        {/* Download Invoice Button for Won Auctions */}
                                        <button 
                                            className="btn btn-outline-secondary w-100 mt-2"
                                            onClick={() => downloadAuctionInvoice(auction._id)}
                                        >
                                            <FontAwesomeIcon icon={faDownload} /> Download Invoice
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            {/* ...existing code... */}
        </div>
    );
};

export default UserBids;