import React, { useState } from 'react';

const RequestedBidsView = ({ bids = [] }) => {
    const [selectedBid, setSelectedBid] = useState(null);
    const [showBidders, setShowBidders] = useState(false);
    
    if (!bids || bids.length === 0) {
        return (
            <div className="alert alert-info">
                <p className="mb-0">You haven't submitted any bid requests yet.</p>
            </div>
        );
    }

    const handleViewDetails = (bid) => {
        setSelectedBid(bid);
    };

    const getStatusBadge = (status) => {
        switch (status.toLowerCase()) {
            case 'approved':
                return <span className="badge bg-success">Approved</span>;
            case 'rejected':
                return <span className="badge bg-danger">Rejected</span>;
            case 'pending':
                return <span className="badge bg-warning">Pending</span>;
            default:
                return <span className="badge bg-secondary">{status}</span>;
        }
    };

    return (
        <div className="row">
            {/* Left side: Bid list */}
            <div className={selectedBid ? "col-md-5 mb-4" : "col-md-12 mb-4"}>
                <div className="list-group">
                    {bids.map(bid => (
                        <div 
                            key={bid._id}
                            className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${selectedBid?._id === bid._id ? 'active' : ''}`}
                            onClick={() => handleViewDetails(bid)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="d-flex align-items-center">
                                {bid.image && (
                                    <img
                                        src={`http://localhost:8080/uploads/event_posters/${bid.image}`}
                                        alt={bid.title}
                                        className="me-3 rounded"
                                        style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = "https://via.placeholder.com/50?text=No+Image";
                                        }}
                                    />
                                )}
                                <div>
                                    <h6 className="mb-0">{bid.title}</h6>
                                    <small className={selectedBid?._id === bid._id ? 'text-light' : 'text-muted'}>
                                        Base: ₹{bid.base_amount} • {new Date(bid.created_at || bid.last_date).toLocaleDateString()}
                                    </small>
                                </div>
                            </div>
                            <div>
                                {getStatusBadge(bid.status)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right side: Bid details */}
            {selectedBid && (
                <div className="col-md-7">
                    <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="card-title mb-0">{selectedBid.title}</h5>
                            {getStatusBadge(selectedBid.status)}
                        </div>
                        
                        {selectedBid.image && (
                            <img
                                src={`http://localhost:8080/uploads/event_posters/${selectedBid.image}`}
                                alt={selectedBid.title}
                                className="card-img-top"
                                style={{ height: '250px', objectFit: 'cover' }}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "https://via.placeholder.com/300x200?text=No+Image";
                                }}
                            />
                        )}
                        
                        <div className="card-body">
                            <p className="card-text">{selectedBid.description}</p>
                            
                            <div className="row mt-3">
                                <div className="col-md-6 mb-2">
                                    <strong>Base Amount:</strong> ₹{selectedBid.base_amount}
                                </div>
                                <div className="col-md-6 mb-2">
                                    <strong>Current Amount:</strong> ₹{selectedBid.current_amount}
                                </div>
                                <div className="col-md-6 mb-2">
                                    <strong>Minimum Increment:</strong> ₹{selectedBid.min_increment}
                                </div>
                                <div className="col-md-6 mb-2">
                                    <strong>Category:</strong> {selectedBid.category}
                                </div>
                                <div className="col-md-6 mb-2">
                                    <strong>Condition:</strong> {selectedBid.condition}
                                </div>
                                {selectedBid.dimensions && (
                                    <div className="col-md-6 mb-2">
                                        <strong>Dimensions:</strong> {selectedBid.dimensions}
                                    </div>
                                )}
                                {selectedBid.material && (
                                    <div className="col-md-6 mb-2">
                                        <strong>Material:</strong> {selectedBid.material}
                                    </div>
                                )}
                                <div className="col-md-6 mb-2">
                                    <strong>End Date:</strong> {new Date(selectedBid.last_date).toLocaleString()}
                                </div>
                                <div className="col-md-6 mb-2">
                                    <strong>Submitted On:</strong> {new Date(selectedBid.created_at || selectedBid.last_date).toLocaleDateString()}
                                </div>
                            </div>
                            
                            {selectedBid.status.toLowerCase() === 'pending' && (
                                <div className="alert alert-warning mt-3">
                                    <i className="bi bi-info-circle-fill me-2"></i>
                                    This bid request is under review. You'll be notified when approved.
                                </div>
                            )}
                            
                            {selectedBid.status.toLowerCase() === 'rejected' && (
                                <div className="alert alert-danger mt-3">
                                    <i className="bi bi-x-circle-fill me-2"></i>
                                    This bid request was rejected.
                                </div>
                            )}
                            
                            {/* Bidders section for approved bids */}
                            {selectedBid.status.toLowerCase() === 'approved' && (
                                <div className="mt-4">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h6 className="mb-0">Bidders</h6>
                                        <button
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => setShowBidders(!showBidders)}
                                        >
                                            {showBidders ? 'Hide Bidders' : 'Show Bidders'}
                                        </button>
                                    </div>
                                    
                                    {showBidders && selectedBid.bids && selectedBid.bids.length > 0 ? (
                                        <ul className="list-group">
                                            {selectedBid.bids.slice().sort((a, b) => b.amount - a.amount).map((bid, index) => (
                                                <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <span className="badge bg-secondary me-2">{index + 1}</span>
                                                        <strong>{bid.user_email}</strong>
                                                    </div>
                                                    <div>
                                                        <span className="badge bg-primary me-2">₹{bid.amount}</span>
                                                        <small className="text-muted">{new Date(bid.timestamp).toLocaleString()}</small>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : showBidders ? (
                                        <div className="alert alert-info">
                                            No bids have been placed yet.
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RequestedBidsView;
