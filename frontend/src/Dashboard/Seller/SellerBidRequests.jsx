import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const SellerBidRequests = () => {
    const [bidRequests, setBidRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    useEffect(() => {
        fetchBidRequests();
    }, []);

    const fetchBidRequests = async () => {
        try {
            const token = localStorage.getItem('sellertoken');
            if (!token) {
                toast.error('Please login to view your bid requests');
                return;
            }

            const response = await axios.get(
                'http://localhost:8080/bids/seller/requests',
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                setBidRequests(response.data.requests);
            } else {
                throw new Error('Failed to fetch bid requests');
            }
        } catch (error) {
            console.error('Error fetching bid requests:', error);
            toast.error('Failed to load your bid requests');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (request) => {
        setSelectedRequest(request);
        setShowDetailsModal(true);
    };

    const closeDetailsModal = () => {
        setShowDetailsModal(false);
        setSelectedRequest(null);
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

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Loading your bid requests...</p>
            </div>
        );
    }

    return (
        <div className="container-fluid py-4">
            <h2 className="mb-4">My Bid Requests</h2>
            
            {bidRequests.length === 0 ? (
                <div className="alert alert-info">
                    <p className="mb-0">You haven't submitted any bid requests yet.</p>
                    <button 
                        className="btn btn-primary mt-3"
                        onClick={() => document.querySelector('button[data-id="bids"]').click()}
                    >
                        Create a Bid Request
                    </button>
                </div>
            ) : (
                <div className="card shadow-sm">
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead className="table-light">
                                <tr>
                                    <th>Title</th>
                                    <th>Base Amount</th>
                                    <th>Category</th>
                                    <th>End Date</th>
                                    <th>Created</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bidRequests.map(request => (
                                    <tr key={request._id}>
                                        <td>{request.title}</td>
                                        <td>₹{request.base_amount}</td>
                                        <td>{request.category}</td>
                                        <td>{new Date(request.last_date).toLocaleDateString()}</td>
                                        <td>{new Date(request.created_at).toLocaleDateString()}</td>
                                        <td>{getStatusBadge(request.status)}</td>
                                        <td>
                                            <button
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={() => handleViewDetails(request)}
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {/* Bid Request Details Modal */}
            {showDetailsModal && selectedRequest && (
                <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{selectedRequest.title}</h5>
                                <button type="button" className="btn-close" onClick={closeDetailsModal}></button>
                            </div>
                            <div className="modal-body">
                                <div className="row">
                                    <div className="col-md-6">
                                        {selectedRequest.image && (
                                            <img 
                                                src={`http://localhost:8080/uploads/event_posters/${selectedRequest.image}`}
                                                alt={selectedRequest.title}
                                                className="img-fluid rounded mb-3"
                                                style={{ maxHeight: '300px', objectFit: 'cover', width: '100%' }}
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = "https://via.placeholder.com/300x200?text=No+Image";
                                                }}
                                            />
                                        )}
                                        
                                        <div className="card mb-3">
                                            <div className="card-header">
                                                <h6 className="mb-0">Description</h6>
                                            </div>
                                            <div className="card-body">
                                                <p>{selectedRequest.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="col-md-6">
                                        <div className="card mb-3">
                                            <div className="card-header d-flex justify-content-between align-items-center">
                                                <h6 className="mb-0">Bid Details</h6>
                                                {getStatusBadge(selectedRequest.status)}
                                            </div>
                                            <div className="card-body">
                                                <table className="table">
                                                    <tbody>
                                                        <tr>
                                                            <th>Base Amount</th>
                                                            <td>₹{selectedRequest.base_amount}</td>
                                                        </tr>
                                                        <tr>
                                                            <th>Current Amount</th>
                                                            <td>₹{selectedRequest.current_amount}</td>
                                                        </tr>
                                                        <tr>
                                                            <th>Min Increment</th>
                                                            <td>₹{selectedRequest.min_increment}</td>
                                                        </tr>
                                                        <tr>
                                                            <th>Category</th>
                                                            <td>{selectedRequest.category}</td>
                                                        </tr>
                                                        <tr>
                                                            <th>Condition</th>
                                                            <td>{selectedRequest.condition}</td>
                                                        </tr>
                                                        {selectedRequest.dimensions && (
                                                            <tr>
                                                                <th>Dimensions</th>
                                                                <td>{selectedRequest.dimensions}</td>
                                                            </tr>
                                                        )}
                                                        {selectedRequest.material && (
                                                            <tr>
                                                                <th>Material</th>
                                                                <td>{selectedRequest.material}</td>
                                                            </tr>
                                                        )}
                                                        <tr>
                                                            <th>End Date</th>
                                                            <td>{new Date(selectedRequest.last_date).toLocaleString()}</td>
                                                        </tr>
                                                        <tr>
                                                            <th>Created On</th>
                                                            <td>{new Date(selectedRequest.created_at).toLocaleString()}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                        
                                        {selectedRequest.status === 'approved' && (
                                            <div className="card">
                                                <div className="card-header">
                                                    <h6 className="mb-0">Current Bidders</h6>
                                                </div>
                                                <div className="card-body">
                                                    {selectedRequest.bids && selectedRequest.bids.length > 0 ? (
                                                        <div className="table-responsive">
                                                            <table className="table table-sm">
                                                                <thead>
                                                                    <tr>
                                                                        <th>Bidder</th>
                                                                        <th>Amount</th>
                                                                        <th>Date</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {selectedRequest.bids.slice()
                                                                        .sort((a, b) => b.amount - a.amount)
                                                                        .map((bid, index) => (
                                                                            <tr key={index} className={index === 0 ? 'table-success' : ''}>
                                                                                <td>{bid.user_email}</td>
                                                                                <td>₹{bid.amount}</td>
                                                                                <td>{new Date(bid.timestamp).toLocaleString()}</td>
                                                                            </tr>
                                                                        ))
                                                                    }
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    ) : (
                                                        <p className="text-muted mb-0">No bids placed yet.</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {selectedRequest.status === 'rejected' && (
                                            <div className="alert alert-danger">
                                                <h6 className="alert-heading">Request Rejected</h6>
                                                <p className="mb-0">This bid request was rejected by the administrator. 
                                                You may submit a new request with the necessary corrections.</p>
                                            </div>
                                        )}
                                        
                                        {selectedRequest.status === 'pending' && (
                                            <div className="alert alert-warning">
                                                <h6 className="alert-heading">Under Review</h6>
                                                <p className="mb-0">This bid request is still under review. 
                                                You will be notified when it is approved or rejected.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeDetailsModal}>
                                    Close
                                </button>
                                
                                {selectedRequest.status === 'approved' && (
                                    <a 
                                        href="/bids" 
                                        className="btn btn-primary"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        View in Marketplace
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show"></div>
                </div>
            )}
            
            <style jsx>{`
                .table th, .table td {
                    vertical-align: middle;
                }
            `}</style>
        </div>
    );
};

export default SellerBidRequests;
