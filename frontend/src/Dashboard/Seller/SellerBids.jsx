import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import SellerBidRequestForm from './SellerBidRequestForm';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';

const SellerBids = () => {
    const [bids, setBids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeBid, setActiveBid] = useState(null);
    const [bidAmount, setBidAmount] = useState('');
    const [participatedBids, setParticipatedBids] = useState([]);
    const [viewMode, setViewMode] = useState('available');
    const [bidStats, setBidStats] = useState({
        active_count: 0,
        won_count: 0,
        lost_count: 0,
        total_active_bids: 0,
        category_stats: []
    });
    const [showRequestForm, setShowRequestForm] = useState(false);

    useEffect(() => {
        Promise.all([
            fetchBids(),
            fetchParticipatedBids(),
            fetchBidStats()
        ]);
    }, []);

    const fetchBids = async () => {
        try {
            const response = await axios.get('http://localhost:8080/bids/active');
            
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

    const fetchParticipatedBids = async () => {
        try {
            const token = localStorage.getItem('sellertoken');
            if (!token) return;

            const response = await axios.get(
                'http://localhost:8080/bids/participated',
                { 
                    headers: { 
                        'Authorization': `Bearer ${token}`
                    } 
                }
            );

            if (response.data.success && Array.isArray(response.data.bids)) {
                const processedBids = response.data.bids.map(bid => ({
                    ...bid,
                    current_amount: Number(bid.current_amount) || 0,
                    my_highest_bid: Number(bid.my_highest_bid) || 0
                }));
                setParticipatedBids(processedBids);
            }
        } catch (error) {
            console.error('Error fetching participated bids:', error);
        }
    };

    const fetchBidStats = async () => {
        try {
            const token = localStorage.getItem('sellertoken');
            if (!token) return;
            
            const response = await axios.get(
                'http://localhost:8080/bids/summary',
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            if (response.data.success) {
                setBidStats(response.data.stats);
            }
        } catch (error) {
            console.error('Error fetching bid stats:', error);
        }
    };

    const handleBid = async (bidId) => {
        try {
            const token = localStorage.getItem('sellertoken');
            if (!token) {
                toast.error('Please login to place a bid');
                return;
            }

            const response = await axios.post(
                `http://localhost:8080/bids/${bidId}/place-bid`,
                { amount: parseFloat(bidAmount) },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.success) {
                toast.success('Bid placed successfully!');
                await fetchBids();
                await fetchParticipatedBids();
                setActiveBid(null);
                setBidAmount('');
            } else {
                throw new Error(response.data.message || 'Failed to place bid');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to place bid');
            console.error('Bid error:', error);
        }
    };

    const downloadAuctionInvoice = (bid) => {
        try {
            // Force the status to be 'completed' before sending to the server
            const bidWithCompletedStatus = {
                ...bid,
                status: 'completed'
            };
            
            const token = localStorage.getItem('sellertoken');
            if (!token) {
                toast.error('Authentication required to download invoice');
                return;
            }
            
            toast.info('Preparing invoice for download...');
            
            // Create a downloadable link
            const downloadLink = document.createElement('a');
            
            // Use correct endpoint for bid invoices
            const bidId = bidWithCompletedStatus._id;
            downloadLink.href = `http://localhost:8080/bids/invoice/${bidId}`;
            
            // Use fetch to get the PDF with authentication
            fetch(downloadLink.href, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    // Add a custom header to indicate this is a completed auction
                    'X-Auction-Status': 'completed'
                },
                method: 'GET'
            })
            .then(response => {
                if (!response.ok) {
                    // Handle HTTP errors
                    console.error(`HTTP error: ${response.status}`);
                    if (response.status === 400) {
                        throw new Error('Auction must be completed before generating invoice');
                    } else if (response.status === 404) {
                        throw new Error('Invoice not found');
                    } else if (response.status === 403) {
                        throw new Error('Not authorized to download this invoice');
                    } else {
                        throw new Error(`Server error: ${response.status}`);
                    }
                }
                return response.blob();
            })
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                downloadLink.href = url;
                downloadLink.download = `auction_invoice_${bidId.substring(0, 8)}.pdf`;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(downloadLink);
                toast.success('Invoice downloaded successfully');
            })
            .catch(error => {
                console.error('Error downloading invoice:', error);
                toast.error(error.message || 'Failed to download invoice');
            });
        } catch (error) {
            console.error('Error setting up invoice download:', error);
            toast.error('Failed to set up invoice download');
        }
    };

    if (loading) return (
        <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading bids...</p>
        </div>
    );

    // Filter for participated bids
    const wonBids = participatedBids.filter(bid => {
        const lastDate = new Date(bid.last_date);
        const now = new Date();
        return lastDate < now && 
               bid.highest_bidder === bid.my_email && 
               bid.my_highest_bid === bid.current_amount;
    }).map(bid => ({
        ...bid,
        status: 'completed' // Mark all won bids as completed
    }));

    const activeBids = participatedBids.filter(bid => {
        const lastDate = new Date(bid.last_date);
        const now = new Date();
        return lastDate >= now;
    });

    const lostBids = participatedBids.filter(bid => {
        const lastDate = new Date(bid.last_date);
        const now = new Date();
        return lastDate < now && 
               (bid.highest_bidder !== bid.my_email || 
                bid.my_highest_bid !== bid.current_amount);
    });

    return (
        <div className="container-fluid py-4">
            <div className="d-flex justify-content-between align-items-center">
                <h2 className="mb-4">Art Auction Marketplace</h2>
                <button 
                    className="btn btn-primary mb-4"
                    onClick={() => setShowRequestForm(!showRequestForm)}
                >
                    {showRequestForm ? 'Hide Form' : '+ Request New Auction'}
                </button>
            </div>
            
            {/* Bid Request Form */}
            {showRequestForm && (
                <div className="mb-4">
                    <SellerBidRequestForm 
                        onRequestSubmitted={() => {
                            setShowRequestForm(false);
                            fetchBids();
                            fetchParticipatedBids();
                            toast.success('Your bid request has been submitted to admin for approval');
                        }}
                    />
                </div>
            )}
            
            {/* Stats Cards */}
            <div className="row g-4 mb-4">
                <div className="col-md-3">
                    <div className="card bg-primary text-white">
                        <div className="card-body">
                            <div className="d-flex justify-content-between">
                                <div>
                                    <h5 className="card-title">Active Bids</h5>
                                    <h2 className="mb-0">{bidStats.active_count}</h2>
                                </div>
                                <div className="fs-1">🔄</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="col-md-3">
                    <div className="card bg-success text-white">
                        <div className="card-body">
                            <div className="d-flex justify-content-between">
                                <div>
                                    <h5 className="card-title">Won Auctions</h5>
                                    <h2 className="mb-0">{bidStats.won_count}</h2>
                                </div>
                                <div className="fs-1">🏆</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="col-md-3">
                    <div className="card bg-secondary text-white">
                        <div className="card-body">
                            <div className="d-flex justify-content-between">
                                <div>
                                    <h5 className="card-title">Lost Auctions</h5>
                                    <h2 className="mb-0">{bidStats.lost_count}</h2>
                                </div>
                                <div className="fs-1">📉</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="col-md-3">
                    <div className="card bg-info text-white">
                        <div className="card-body">
                            <div className="d-flex justify-content-between">
                                <div>
                                    <h5 className="card-title">Total Auctions</h5>
                                    <h2 className="mb-0">{bidStats.total_active_bids}</h2>
                                </div>
                                <div className="fs-1">🔨</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Popular Categories */}
            {bidStats.category_stats && bidStats.category_stats.length > 0 && (
                <div className="card mb-4">
                    <div className="card-header">
                        <h5 className="mb-0">Popular Categories</h5>
                    </div>
                    <div className="card-body">
                        <div className="row">
                            {bidStats.category_stats.map((category, index) => (
                                <div key={index} className="col-md-3 mb-3">
                                    <div className="p-3 border rounded">
                                        <h6>{category.name}</h6>
                                        <div className="d-flex justify-content-between">
                                            <span>Items:</span>
                                            <span className="badge bg-primary">{category.count}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            
            {/* Toggle buttons for view modes */}
            <div className="btn-group mb-4">
                <button 
                    className={`btn ${viewMode === 'available' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setViewMode('available')}
                >
                    Available Bids
                </button>
                <button 
                    className={`btn ${viewMode === 'participated' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setViewMode('participated')}
                >
                    My Bids History
                </button>
            </div>
            
            {/* Available Bids View */}
            {viewMode === 'available' && (
                <div className="row g-4">
                    {bids.length === 0 ? (
                        <div className="col-12">
                            <div className="alert alert-info">
                                No active bids available at the moment.
                            </div>
                        </div>
                    ) : (
                        bids.map(bid => (
                            <div key={bid._id} className="col-md-4">
                                <div className="card h-100 shadow-sm">
                                    {bid.image && (
                                        <img 
                                            src={`http://localhost:8080/uploads/event_posters/${bid.image}`}
                                            className="card-img-top"
                                            alt={bid.title}
                                            style={{ height: '200px', objectFit: 'cover' }}
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = "https://via.placeholder.com/200x200?text=No+Image";
                                            }}
                                        />
                                    )}
                                    <div className="card-body">
                                        <h5 className="card-title">{bid.title}</h5>
                                        <p className="card-text">{bid.description}</p>
                                        
                                        <div className="mt-3">
                                            <div className="d-flex justify-content-between mb-2">
                                                <span><strong>Current Bid:</strong></span>
                                                <span className="text-primary fw-bold">₹{bid.current_amount}</span>
                                            </div>
                                            <div className="d-flex justify-content-between mb-2">
                                                <span><strong>Min Increment:</strong></span>
                                                <span>₹{bid.min_increment}</span>
                                            </div>
                                            <div className="d-flex justify-content-between mb-3">
                                                <span><strong>Ends on:</strong></span>
                                                <span>{new Date(bid.last_date).toLocaleDateString()}</span>
                                            </div>
                                            
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
                                                            className="btn btn-primary w-100"
                                                            onClick={() => handleBid(bid._id)}
                                                            disabled={!bidAmount || parseFloat(bidAmount) < (bid.current_amount + bid.min_increment)}
                                                        >
                                                            Place Bid
                                                        </button>
                                                        <button 
                                                            className="btn btn-outline-secondary"
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
                                                    className="btn btn-outline-primary w-100"
                                                    onClick={() => setActiveBid(bid._id)}
                                                >
                                                    Bid Now
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="card-footer">
                                        <small className="text-muted">
                                            Category: {bid.category} | Condition: {bid.condition}
                                        </small>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
            
            {/* My Bids History View */}
            {viewMode === 'participated' && (
                <div>
                    {/* Won Bids Section */}
                    {wonBids.length > 0 && (
                        <div className="mb-5">
                            <h3 className="mb-3 text-success">
                                <i className="bi bi-trophy me-2"></i>
                                Won Bids
                            </h3>
                            <div className="row g-4">
                                {wonBids.map(bid => (
                                    <div key={bid._id} className="col-md-4">
                                        <div className="card h-100 border-success">
                                            <div className="winner-badge">Winner!</div>
                                            {bid.image && (
                                                <img 
                                                    src={`http://localhost:8080/uploads/event_posters/${bid.image}`}
                                                    className="card-img-top"
                                                    alt={bid.title}
                                                    style={{ height: '180px', objectFit: 'cover' }}
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = "https://via.placeholder.com/200x200?text=No+Image";
                                                    }}
                                                />
                                            )}
                                            <div className="card-body">
                                                <h5 className="card-title">{bid.title}</h5>
                                                <p className="card-text text-truncate">{bid.description}</p>
                                                <div className="mt-3">
                                                    <p className="mb-1">
                                                        <strong>Final Bid:</strong> ₹{bid.current_amount}
                                                    </p>
                                                    <p className="mb-1">
                                                        <strong>Won On:</strong> {new Date(bid.last_date).toLocaleDateString()}
                                                    </p>
                                                    <p className="mb-1">
                                                        <strong>Winner:</strong> {bid.winner_name || 'You'}
                                                    </p>
                                                    <p className="mb-1">
                                                        <strong>Status:</strong> <span className="text-success">Completed</span>
                                                    </p>
                                                    
                                                    {/* Download button with no disabled state since we mark them all as completed */}
                                                    <button 
                                                        className="btn btn-sm btn-outline-success mt-3"
                                                        onClick={() => downloadAuctionInvoice(bid)}
                                                    >
                                                        <FontAwesomeIcon icon={faDownload} className="me-1" /> Download Invoice
                                                    </button>
                                                </div>
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
                            <h3 className="mb-3">Active Bids</h3>
                            <div className="row g-4">
                                {activeBids.map(bid => (
                                    <div key={bid._id} className="col-md-4">
                                        <div className="card h-100">
                                            {bid.image && (
                                                <img 
                                                    src={`http://localhost:8080/uploads/event_posters/${bid.image}`}
                                                    className="card-img-top"
                                                    alt={bid.title}
                                                    style={{ height: '180px', objectFit: 'cover' }}
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = "https://via.placeholder.com/200x200?text=No+Image";
                                                    }}
                                                />
                                            )}
                                            <div className="card-body">
                                                <h5 className="card-title">{bid.title}</h5>
                                                <div className="mt-3">
                                                    <p className="mb-1">
                                                        <strong>Current Bid:</strong> ₹{bid.current_amount}
                                                    </p>
                                                    <p className="mb-1">
                                                        <strong>Your Bid:</strong> ₹{bid.my_highest_bid}
                                                    </p>
                                                    <p className="mb-0">
                                                        <strong>Status:</strong>{' '}
                                                        {bid.highest_bidder === bid.my_email ? (
                                                            <span className="text-success">Highest Bidder</span>
                                                        ) : (
                                                            <span className="text-danger">Outbid</span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="card-footer">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <small className="text-muted">
                                                        Ends on {new Date(bid.last_date).toLocaleDateString()}
                                                    </small>
                                                    {bid.highest_bidder !== bid.my_email && (
                                                        <button 
                                                            className="btn btn-sm btn-outline-primary"
                                                            onClick={() => {
                                                                setViewMode('available');
                                                                const bidToSet = bids.find(b => b._id === bid._id);
                                                                if (bidToSet) {
                                                                    setActiveBid(bid._id);
                                                                    setBidAmount((bidToSet.current_amount + bidToSet.min_increment).toString());
                                                                }
                                                            }}
                                                        >
                                                            Bid Again
                                                        </button>
                                                    )}
                                                </div>
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
                            <h3 className="mb-3 text-muted">Past Bids</h3>
                            <div className="row g-4">
                                {lostBids.map(bid => (
                                    <div key={bid._id} className="col-md-4">
                                        <div className="card h-100 bg-light">
                                            {bid.image && (
                                                <img 
                                                    src={`http://localhost:8080/uploads/event_posters/${bid.image}`}
                                                    className="card-img-top"
                                                    alt={bid.title}
                                                    style={{ height: '180px', objectFit: 'cover' }}
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = "https://via.placeholder.com/200x200?text=No+Image";
                                                    }}
                                                />
                                            )}
                                            <div className="card-body">
                                                <h5 className="card-title">{bid.title}</h5>
                                                <div className="mt-3">
                                                    <p className="mb-1">
                                                        <strong>Final Amount:</strong> ₹{bid.current_amount}
                                                    </p>
                                                    <p className="mb-1">
                                                        <strong>Your Bid:</strong> ₹{bid.my_highest_bid}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="card-footer">
                                                <span className="badge bg-secondary">Auction Ended</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {participatedBids.length === 0 && (
                        <div className="alert alert-info">
                            <p className="mb-0">You haven't participated in any bids yet.</p>
                        </div>
                    )}
                </div>
            )}

            <style jsx>{`
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
                    transition: transform 0.3s ease;
                    border-radius: 10px;
                    overflow: hidden;
                }
                .card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 20px rgba(0,0,0,0.1);
                }
                .card-img-top {
                    transition: transform 0.5s ease;
                }
                .card:hover .card-img-top {
                    transform: scale(1.05);
                }
                .border-success {
                    border: 2px solid #28a745 !important;
                }
                .text-truncate {
                    max-width: 100%;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
            `}</style>
        </div>
    );
};

export default SellerBids;
