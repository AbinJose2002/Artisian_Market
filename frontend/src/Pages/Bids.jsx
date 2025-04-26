import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const Bids = () => {
    const [bids, setBids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeBid, setActiveBid] = useState(null);
    const [bidAmount, setBidAmount] = useState('');

    useEffect(() => {
        fetchBids();
    }, []);

    const fetchBids = async () => {
        try {
            console.log('Fetching active bids...'); // Debug log
            const response = await axios.get('http://localhost:8080/bids/active');
            console.log('Response:', response.data); // Debug log
            
            if (response.data.success && Array.isArray(response.data.bids)) {
                setBids(response.data.bids);
            } else {
                console.error('Invalid response format:', response.data);
                toast.error('Invalid data format received');
            }
        } catch (error) {
            console.error('Error fetching bids:', error);
            toast.error('Failed to fetch bids');
        } finally {
            setLoading(false);
        }
    };

    const handleBid = async (bidId) => {
        try {
            // Allow both user and instructor tokens
            const token = localStorage.getItem('usertoken') || localStorage.getItem('instructortoken') || localStorage.getItem('sellertoken');
            if (!token) {
                toast.error('Please login to place a bid');
                return;
            }

            console.log('Placing bid:', {
                bidId,
                amount: parseFloat(bidAmount),
                token: token ? 'present' : 'missing'
            });

            const response = await fetch(`http://localhost:8080/bids/${bidId}/place-bid`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ amount: parseFloat(bidAmount) })
            });

            const data = await response.json();
            console.log('Response:', data);

            if (data.success) {
                toast.success('Bid placed successfully!');
                await fetchBids(); // Refresh all bids
                setActiveBid(null);
                setBidAmount('');
            } else {
                throw new Error(data.message || 'Failed to place bid');
            }
        } catch (error) {
            toast.error(error.message || error.response?.data?.message || 'Failed to place bid');
            console.error('Bid error:', error);
        }
    };

    if (loading) return <div className="text-center py-5">Loading...</div>;

    return (
        <div className="container py-5">
            <h2 className="mb-4">Active Bids</h2>
            
            <div className="row g-4">
                {bids.map(bid => (
                    <div key={bid._id} className="col-md-4">
                        <div className="card h-100 shadow-sm">
                            {bid.image && (
                                <img 
                                    src={`http://localhost:8080/uploads/event_posters/${bid.image}`}
                                    className="card-img-top"
                                    alt={bid.title}
                                    style={{ height: '200px', objectFit: 'cover' }}
                                />
                            )}
                            <div className="card-body">
                                <h5 className="card-title">{bid.title}</h5>
                                <p className="card-text">{bid.description}</p>
                                
                                <div className="mt-3">
                                    <p><strong>Current Bid:</strong> ₹{bid.current_amount}</p>
                                    <p><strong>Minimum Increment:</strong> ₹{bid.min_increment}</p>
                                    <p><strong>Ends on:</strong> {new Date(bid.last_date).toLocaleDateString()}</p>
                                    
                                    {/* Show highest bidder name if available */}
                                    {bid.bids && bid.bids.length > 0 && (
                                        <p>
                                            <strong>Current Highest Bidder:</strong> {
                                                bid.bids[bid.bids.length - 1]?.user_name || 
                                                'Unknown'
                                            }
                                        </p>
                                    )}
                                    
                                    {activeBid === bid._id ? (
                                        <div className="mt-3">
                                            <div className="input-group mb-3">
                                                <span className="input-group-text">₹</span>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={bidAmount}
                                                    onChange={(e) => setBidAmount(e.target.value)}
                                                    min={bid.current_amount + bid.min_increment}
                                                    placeholder={`Min: ₹${bid.current_amount + bid.min_increment}`}
                                                />
                                            </div>
                                            <div className="d-flex gap-2">
                                                <button 
                                                    className="btn btn-primary"
                                                    onClick={() => handleBid(bid._id)}
                                                    disabled={!bidAmount || parseFloat(bidAmount) < (bid.current_amount + bid.min_increment)}
                                                >
                                                    Place Bid
                                                </button>
                                                <button 
                                                    className="btn btn-secondary"
                                                    onClick={() => {
                                                        setActiveBid(null);
                                                        setBidAmount('');
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button 
                                            className="btn btn-outline-primary"
                                            onClick={() => setActiveBid(bid._id)}
                                        >
                                            Bid Now
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="card-footer">
                                <small className="text-muted">
                                    {bid.bids?.length || 0} bids placed
                                </small>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {bids.length === 0 && (
                <div className="text-center">
                    <p>No active bids available at the moment.</p>
                </div>
            )}
        </div>
    );
};

export default Bids;
