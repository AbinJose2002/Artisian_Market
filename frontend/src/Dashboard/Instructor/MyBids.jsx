import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faTrophy, faSpinner } from '@fortawesome/free-solid-svg-icons';

const MyBids = () => {
    const [participatedBids, setParticipatedBids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generatingInvoice, setGeneratingInvoice] = useState(null);

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

    const downloadAuctionInvoice = async (bid) => {
        try {
            setGeneratingInvoice(bid._id);
            const token = localStorage.getItem('instructortoken');
            
            // Using fetch API which handles blob data better
            const response = await fetch(`http://localhost:8080/bids/invoice/${bid._id}`, {
                method: 'GET',
                headers: { 
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
            
            // Get blob from response
            const blob = await response.blob();
            
            // Create a URL for the blob
            const url = window.URL.createObjectURL(blob);
            
            // Create a temporary link element to trigger the download
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `auction-invoice-${bid._id.substring(0, 8)}.pdf`);
            document.body.appendChild(link);
            link.click();
            
            // Clean up
            window.URL.revokeObjectURL(url);
            document.body.removeChild(link);
            
            toast.success('Invoice downloaded successfully');
        } catch (error) {
            console.error('Error downloading invoice:', error);
            toast.error('Failed to download invoice. Please try again later.');
        } finally {
            setGeneratingInvoice(null);
        }
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
                        <FontAwesomeIcon icon={faTrophy} className="me-2" />
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
                                        
                                        {/* Display bidder name if available */}
                                        {bid.bids && bid.bids.length > 0 && (
                                            <p>
                                                <strong>Winner:</strong> {
                                                    bid.highest_bidder === "me" ? "You" : 
                                                    bid.bids.find(b => b.user_email === bid.highest_bidder)?.user_name || 
                                                    bid.winner_name || bid.highest_bidder
                                                }
                                            </p>
                                        )}
                                        
                                        {/* Invoice Download Button */}
                                        <button 
                                            className="btn btn-outline-primary mt-2"
                                            onClick={() => downloadAuctionInvoice(bid)}
                                            disabled={generatingInvoice === bid._id}
                                        >
                                            {generatingInvoice === bid._id ? (
                                                <>
                                                    <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                                                    Generating...
                                                </>
                                            ) : (
                                                <>
                                                    <FontAwesomeIcon icon={faDownload} className="me-2" />
                                                    Download Invoice
                                                </>
                                            )}
                                        </button>
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
                    .btn-outline-primary {
                        color: #3a1d6e;
                        border-color: #3a1d6e;
                    }
                    .btn-outline-primary:hover {
                        background-color: #3a1d6e;
                        color: white;
                    }
                    .btn-outline-primary:disabled {
                        opacity: 0.6;
                        cursor: not-allowed;
                    }
                `}
            </style>
        </div>
    );
};

export default MyBids;
