import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import BidRequestForm from './BidRequestForm';
import RequestedBidsView from './RequestedBidsView';

const UserBids = () => {
    const [participatedBids, setParticipatedBids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [activeTab, setActiveTab] = useState('active'); // 'active', 'won', 'lost', 'requests'

    const fetchParticipatedBids = async () => {
        try {
            const token = localStorage.getItem('usertoken');
            if (!token) {
                setError('Please log in to view your bids');
                setLoading(false);
                return;
            }

            console.log('Fetching bids with token:', token ? 'Present' : 'Missing');
            
            const response = await axios.get(
                'http://localhost:8080/bids/participated',
                { 
                    headers: { 
                        'Authorization': `Bearer ${token}`
                    } 
                }
            );

            console.log('API Response:', response.data);

            if (response.data.success && Array.isArray(response.data.bids)) {
                console.log(`Fetched ${response.data.bids.length} bids`);
                const processedBids = response.data.bids.map(bid => ({
                    ...bid,
                    current_amount: Number(bid.current_amount) || 0,
                    my_highest_bid: Number(bid.my_highest_bid) || 0
                }));
                setParticipatedBids(processedBids);
            } else {
                console.warn("No bids found or response format unexpected:", response.data);
            }
        } catch (error) {
            console.error('Error fetching bids:', error);
            console.error('Error details:', error.response?.data);
            setError('Failed to fetch bid history');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchParticipatedBids();
    }, []);

    const wonBids = participatedBids.filter(bid => {
        const lastDate = new Date(bid.last_date);
        const now = new Date();
        return lastDate < now && 
               bid.highest_bidder === bid.my_email && 
               bid.my_highest_bid === bid.current_amount;
    });

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

    const myRequestedBids = participatedBids.filter(bid => bid.requester_email === bid.my_email);

    const handleTabChange = (tabName) => {
        setActiveTab(tabName);
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Loading your bid history...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-danger m-4" role="alert">
                <h4 className="alert-heading">Error!</h4>
                <p>{error}</p>
                <hr />
                <button 
                    className="btn btn-outline-danger" 
                    onClick={() => window.location.reload()}
                >
                    Refresh Page
                </button>
            </div>
        );
    }

    return (
        <div className="container-fluid py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>My Bid History</h2>
                <button 
                    className="btn btn-primary"
                    onClick={() => setShowRequestForm(!showRequestForm)}
                >
                    {showRequestForm ? 'Hide Form' : '+ Request New Bid'}
                </button>
            </div>

            {showRequestForm && (
                <div className="mb-5">
                    <BidRequestForm 
                        onRequestSubmitted={() => {
                            setShowRequestForm(false);
                            fetchParticipatedBids();
                            setActiveTab('requests');
                        }} 
                    />
                </div>
            )}

            <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                    <button 
                        className={`nav-link ${activeTab === 'active' ? 'active' : ''}`}
                        onClick={() => handleTabChange('active')}
                    >
                        Active Bids {activeBids.length > 0 && <span className="badge bg-primary ms-2">{activeBids.length}</span>}
                    </button>
                </li>
                <li className="nav-item">
                    <button 
                        className={`nav-link ${activeTab === 'won' ? 'active' : ''}`}
                        onClick={() => handleTabChange('won')}
                    >
                        Won Bids {wonBids.length > 0 && <span className="badge bg-success ms-2">{wonBids.length}</span>}
                    </button>
                </li>
                <li className="nav-item">
                    <button 
                        className={`nav-link ${activeTab === 'lost' ? 'active' : ''}`}
                        onClick={() => handleTabChange('lost')}
                    >
                        Lost Bids {lostBids.length > 0 && <span className="badge bg-secondary ms-2">{lostBids.length}</span>}
                    </button>
                </li>
                <li className="nav-item">
                    <button 
                        className={`nav-link ${activeTab === 'requests' ? 'active' : ''}`}
                        onClick={() => handleTabChange('requests')}
                    >
                        My Requests {myRequestedBids.length > 0 && <span className="badge bg-primary ms-2">{myRequestedBids.length}</span>}
                    </button>
                </li>
            </ul>

            {participatedBids.length === 0 && !showRequestForm && (
                <div className="alert alert-info">
                    <p className="mb-0">You haven't placed any bids yet.</p>
                </div>
            )}

            <div className="tab-content">
                <div className={`tab-pane ${activeTab === 'active' ? 'show active' : ''}`}>
                    {activeTab === 'active' && activeBids.length === 0 ? (
                        <div className="alert alert-info">
                            <p className="mb-0">You don't have any active bids at the moment.</p>
                        </div>
                    ) : activeTab === 'active' && (
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
                                                    <strong>Current Bid:</strong> ₹{bid.current_amount}
                                                </p>
                                                <p className="mb-1">
                                                    <strong>Your Highest Bid:</strong> ₹{bid.my_highest_bid}
                                                </p>
                                                <p className="mb-1">
                                                    <strong>Your Status:</strong>{' '}
                                                    {bid.highest_bidder === bid.my_email ? (
                                                        <span className="text-success fw-bold">Highest Bidder</span>
                                                    ) : (
                                                        <span className="text-danger fw-bold">Outbid</span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="card-footer d-flex justify-content-between align-items-center">
                                            <small className="text-muted">
                                                Ends on {new Date(bid.last_date).toLocaleDateString()}
                                            </small>
                                            <a href="/bids" className="btn btn-sm btn-outline-primary">
                                                Go to Auctions
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={`tab-pane ${activeTab === 'won' ? 'show active' : ''}`}>
                    {activeTab === 'won' && wonBids.length === 0 ? (
                        <div className="alert alert-info">
                            <p className="mb-0">You haven't won any bids yet.</p>
                        </div>
                    ) : activeTab === 'won' && (
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
                                                style={{ height: '200px', objectFit: 'cover' }}
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
                                                <p className="mb-0">
                                                    <strong>Won On:</strong> {new Date(bid.last_date).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="card-footer">
                                            <span className="badge bg-success">Auction Won</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={`tab-pane ${activeTab === 'lost' ? 'show active' : ''}`}>
                    {activeTab === 'lost' && lostBids.length === 0 ? (
                        <div className="alert alert-info">
                            <p className="mb-0">You don't have any lost bids.</p>
                        </div>
                    ) : activeTab === 'lost' && (
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
                                                    <strong>Your Highest Bid:</strong> ₹{bid.my_highest_bid}
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
                    )}
                </div>

                <div className={`tab-pane ${activeTab === 'requests' ? 'show active' : ''}`}>
                    {activeTab === 'requests' && (
                        <RequestedBidsView bids={myRequestedBids} />
                    )}
                </div>
            </div>

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
                    position: relative;
                }
                
                .card:hover {
                    transform: translateY(-5px);
                }
                
                .border-success {
                    border-color: #28a745 !important;
                    box-shadow: 0 0 15px rgba(40, 167, 69, 0.2);
                }
                
                .text-truncate {
                    max-width: 100%;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .form-label {
                    font-weight: 500;
                }
                
                .form-control:focus, .form-select:focus {
                    border-color: var(--primary-color);
                    box-shadow: 0 0 0 0.25rem rgba(58, 29, 110, 0.25);
                }
                
                .tab-pane {
                    display: none;
                }
                
                .tab-pane.show.active {
                    display: block;
                }
                
                .nav-tabs .badge {
                    font-size: 0.7rem;
                }
            `}</style>
        </div>
    );
};

export default UserBids;
