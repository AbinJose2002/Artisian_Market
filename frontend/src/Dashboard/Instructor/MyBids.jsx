import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const MyBids = () => {
    const [participatedBids, setParticipatedBids] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchParticipatedBids = async () => {
            try {
                const token = localStorage.getItem('instructortoken');
                console.log('Using token:', token ? 'Present' : 'Missing');

                const response = await axios.get(
                    'http://localhost:8080/bids/participated',
                    { 
                        headers: { 
                            'Authorization': `Bearer ${token}`
                        } 
                    }
                );

                console.log('Bid Response:', response.data);

                if (response.data.success && Array.isArray(response.data.bids)) {
                    const processedBids = response.data.bids.map(bid => ({
                        ...bid,
                        current_amount: Number(bid.current_amount) || 0,
                        my_highest_bid: Number(bid.my_highest_bid) || 0,
                        winning_amount: Number(bid.winning_amount) || 0
                    }));
                    setParticipatedBids(processedBids);
                }
            } catch (error) {
                console.error('Error fetching bids:', error);
                toast.error('Failed to fetch bid history');
            } finally {
                setLoading(false);
            }
        };

        fetchParticipatedBids();
    }, []);

    const getStatusBadgeClass = (bid) => {
        if (bid.status === 'active') return 'bg-primary';
        if (bid.status === 'completed' && bid.highest_bidder === bid.my_email) return 'bg-success';
        if (bid.status === 'completed') return 'bg-danger';
        return 'bg-secondary';
    };

    if (loading) return <div className="text-center">Loading...</div>;

    // Updated filtering logic for won bids
    const wonBids = participatedBids.filter(bid => {
        const lastDate = new Date(bid.last_date);
        const now = new Date();
        return lastDate < now && // Bid has ended
               bid.highest_bidder === bid.my_email && // User is highest bidder
               bid.my_highest_bid === bid.current_amount; // User has highest bid
    });

    const activeBids = participatedBids.filter(bid => {
        const lastDate = new Date(bid.last_date);
        const now = new Date();
        return lastDate >= now; // Bid is still active
    });

    const lostBids = participatedBids.filter(bid => {
        const lastDate = new Date(bid.last_date);
        const now = new Date();
        return lastDate < now && // Bid has ended
               (bid.highest_bidder !== bid.my_email || // User is not highest bidder
                bid.my_highest_bid !== bid.current_amount); // User's bid is not highest
    });

    return (
        <div className="container-fluid">
            {/* Won Bids Section */}
            {wonBids.length > 0 && (
                <div className="mb-5">
                    <h3 className="mb-4 text-success">
                        <i className="fas fa-trophy me-2"></i>
                        Won Bids
                    </h3>
                    <div className="row g-4">
                        {wonBids.map(bid => (
                            <div key={bid._id} className="col-md-4">
                                <div className="card h-100 border-success">
                                    {/* Winning badge */}
                                    <div className="winner-badge">Winner!</div>
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
                                        <p><strong>Final Bid:</strong> ₹{bid.current_amount}</p>
                                        <p><strong>Won On:</strong> {new Date(bid.end_date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Active Bids Section */}
            {activeBids.length > 0 && (
                <div className="mb-5">
                    <h3 className="mb-4">Active Bids</h3>
                    <div className="row g-4">
                        {activeBids.map(bid => (
                            <div key={bid._id} className="col-md-4">
                                <div className="card h-100">
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
                                            <p className="mb-1">
                                                <strong>Current Bid:</strong> ₹{bid.current_amount}
                                            </p>
                                            <p className="mb-1">
                                                <strong>Your Highest Bid:</strong> ₹{bid.my_highest_bid}
                                            </p>
                                            <p className="mb-1">
                                                <strong>Status:</strong>{' '}
                                                <span className={`badge ${getStatusBadgeClass(bid)}`}>
                                                    {bid.status.toUpperCase()}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="card-footer">
                                        <small className="text-muted">
                                            Ends on {new Date(bid.last_date).toLocaleDateString()}
                                        </small>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Lost Bids Section */}
            {lostBids.length > 0 && (
                <div className="mb-5">
                    <h3 className="mb-4 text-muted">Past Bids</h3>
                    <div className="row g-4">
                        {lostBids.map(bid => (
                            <div key={bid._id} className="col-md-4">
                                <div className="card h-100">
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
                                            <p className="mb-1">
                                                <strong>Final Bid:</strong> ₹{bid.current_amount}
                                            </p>
                                            <p className="mb-1">
                                                <strong>Status:</strong>{' '}
                                                <span className={`badge ${getStatusBadgeClass(bid)}`}>
                                                    {bid.status.toUpperCase()}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="card-footer">
                                        <small className="text-muted">
                                            Ended on {new Date(bid.last_date).toLocaleDateString()}
                                        </small>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {participatedBids.length === 0 && (
                <div className="text-center py-5">
                    <p className="text-muted">You haven't participated in any bids yet.</p>
                </div>
            )}

            <style>
                {`
                    .winner-badge {
                        position: absolute;
                        top: 10px;
                        right: 10px;
                        background: #28a745;
                        color: white;
                        padding: 5px 15px;
                        border-radius: 20px;
                        font-weight: bold;
                        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                        z-index: 1;
                    }
                    .card {
                        transition: transform 0.2s;
                        position: relative;
                    }
                    .card:hover {
                        transform: translateY(-5px);
                    }
                    .card.border-success {
                        box-shadow: 0 0 15px rgba(40, 167, 69, 0.2);
                    }
                `}
            </style>
        </div>
    );
};

export default MyBids;
