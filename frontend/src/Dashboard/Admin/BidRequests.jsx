import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const BidRequests = () => {
    const [bids, setBids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBid, setSelectedBid] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        fetchBids();
    }, []);

    const fetchBids = async () => {
        try {
            const token = localStorage.getItem('admintoken');
            if (!token) {
                toast.error('Please log in as admin');
                return;
            }

            const response = await axios.get('http://localhost:8080/admin/bid-requests', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                console.log('Fetched bid requests:', response.data.bids);
                setBids(response.data.bids);
            } else {
                throw new Error(response.data.message || 'Failed to fetch bids');
            }
        } catch (error) {
            console.error('Error fetching bids:', error);
            toast.error('Failed to load bid requests');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (bidId) => {
        try {
            const token = localStorage.getItem('admintoken');
            const response = await axios.put(
                `http://localhost:8080/admin/bid-requests/${bidId}/approve`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                toast.success('Bid request approved!');
                setBids(prevBids => prevBids.map(bid => 
                    bid._id === bidId ? { ...bid, status: 'approved' } : bid
                ));
                if (selectedBid && selectedBid._id === bidId) {
                    setSelectedBid({ ...selectedBid, status: 'approved' });
                }
            } else {
                throw new Error(response.data.message || 'Failed to approve bid');
            }
        } catch (error) {
            console.error('Error approving bid:', error);
            toast.error(error.response?.data?.message || 'Failed to approve bid');
        }
    };

    const handleReject = async (bidId) => {
        try {
            const token = localStorage.getItem('admintoken');
            const response = await axios.put(
                `http://localhost:8080/admin/bid-requests/${bidId}/reject`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                toast.success('Bid request rejected!');
                setBids(prevBids => prevBids.map(bid => 
                    bid._id === bidId ? { ...bid, status: 'rejected' } : bid
                ));
                if (selectedBid && selectedBid._id === bidId) {
                    setSelectedBid({ ...selectedBid, status: 'rejected' });
                }
            } else {
                throw new Error(response.data.message || 'Failed to reject bid');
            }
        } catch (error) {
            console.error('Error rejecting bid:', error);
            toast.error(error.response?.data?.message || 'Failed to reject bid');
        }
    };

    const viewBidDetails = (bid) => {
        setSelectedBid(bid);
        setShowDetailsModal(true);
    };

    const closeDetailsModal = () => {
        setShowDetailsModal(false);
        setSelectedBid(null);
    };

    const getBadgeClass = (status) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return 'bg-warning';
            case 'approved':
                return 'bg-success';
            case 'rejected':
                return 'bg-danger';
            default:
                return 'bg-secondary';
        }
    };

    const filteredBids = filterStatus === 'all' 
        ? bids 
        : bids.filter(bid => bid.status.toLowerCase() === filterStatus.toLowerCase());

    const getBidderType = (bid) => {
        if (bid.requester_email) return 'User';
        if (bid.seller_email) return 'Seller';
        if (bid.instructor_id) return 'Instructor';
        return 'Unknown';
    };

    const getRequesterEmail = (bid) => {
        return bid.requester_email || bid.seller_email || 'Unknown';
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Loading bid requests...</p>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            <h2 className="mb-4">Bid Requests</h2>

            <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                    <button 
                        className={`nav-link ${filterStatus === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('all')}
                    >
                        All Requests
                        <span className="badge bg-secondary ms-2">{bids.length}</span>
                    </button>
                </li>
                <li className="nav-item">
                    <button 
                        className={`nav-link ${filterStatus === 'pending' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('pending')}
                    >
                        Pending
                        <span className="badge bg-warning ms-2">
                            {bids.filter(bid => bid.status === 'pending').length}
                        </span>
                    </button>
                </li>
                <li className="nav-item">
                    <button 
                        className={`nav-link ${filterStatus === 'approved' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('approved')}
                    >
                        Approved
                        <span className="badge bg-success ms-2">
                            {bids.filter(bid => bid.status === 'approved').length}
                        </span>
                    </button>
                </li>
                <li className="nav-item">
                    <button 
                        className={`nav-link ${filterStatus === 'rejected' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('rejected')}
                    >
                        Rejected
                        <span className="badge bg-danger ms-2">
                            {bids.filter(bid => bid.status === 'rejected').length}
                        </span>
                    </button>
                </li>
            </ul>

            <div className="card shadow-sm">
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead className="table-light">
                                <tr>
                                    <th>Title</th>
                                    <th>Base Amount</th>
                                    <th>Category</th>
                                    <th>Requester Type</th>
                                    <th>Requester</th>
                                    <th>Created Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBids.length > 0 ? (
                                    filteredBids.map(bid => (
                                        <tr key={bid._id}>
                                            <td>{bid.title}</td>
                                            <td>₹{bid.base_amount}</td>
                                            <td>{bid.category}</td>
                                            <td>{getBidderType(bid)}</td>
                                            <td>
                                                {getRequesterEmail(bid)}
                                            </td>
                                            <td>{new Date(bid.created_at).toLocaleDateString()}</td>
                                            <td>
                                                <span className={`badge ${getBadgeClass(bid.status)}`}>
                                                    {bid.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="btn-group btn-group-sm">
                                                    <button 
                                                        className="btn btn-outline-primary"
                                                        onClick={() => viewBidDetails(bid)}
                                                    >
                                                        <i className="bi bi-eye"></i> View
                                                    </button>
                                                    {bid.status === 'pending' && (
                                                        <>
                                                            <button 
                                                                className="btn btn-outline-success"
                                                                onClick={() => handleApprove(bid._id)}
                                                            >
                                                                <i className="bi bi-check"></i> Approve
                                                            </button>
                                                            <button 
                                                                className="btn btn-outline-danger"
                                                                onClick={() => handleReject(bid._id)}
                                                            >
                                                                <i className="bi bi-x"></i> Reject
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="text-center">No bid requests found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {showDetailsModal && selectedBid && (
                <div className="modal fade show d-block" tabIndex="-1">
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Bid Request Details</h5>
                                <button type="button" className="btn-close" onClick={closeDetailsModal}></button>
                            </div>
                            <div className="modal-body">
                                <div className="row">
                                    <div className="col-md-6">
                                        {selectedBid.image && (
                                            <img
                                                src={`http://localhost:8080/uploads/event_posters/${selectedBid.image}`}
                                                alt={selectedBid.title}
                                                className="img-fluid rounded mb-3"
                                                style={{ maxHeight: '300px', objectFit: 'cover', width: '100%' }}
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = "https://via.placeholder.com/300x200?text=No+Image";
                                                }}
                                            />
                                        )}
                                        <table className="table table-bordered">
                                            <tbody>
                                                <tr>
                                                    <th width="40%">Title</th>
                                                    <td>{selectedBid.title}</td>
                                                </tr>
                                                <tr>
                                                    <th>Base Amount</th>
                                                    <td>₹{selectedBid.base_amount}</td>
                                                </tr>
                                                <tr>
                                                    <th>Current Amount</th>
                                                    <td>₹{selectedBid.current_amount || selectedBid.base_amount}</td>
                                                </tr>
                                                <tr>
                                                    <th>Min Increment</th>
                                                    <td>₹{selectedBid.min_increment}</td>
                                                </tr>
                                                <tr>
                                                    <th>Category</th>
                                                    <td>{selectedBid.category}</td>
                                                </tr>
                                                <tr>
                                                    <th>Condition</th>
                                                    <td>{selectedBid.condition}</td>
                                                </tr>
                                                {selectedBid.dimensions && (
                                                    <tr>
                                                        <th>Dimensions</th>
                                                        <td>{selectedBid.dimensions}</td>
                                                    </tr>
                                                )}
                                                {selectedBid.material && (
                                                    <tr>
                                                        <th>Material</th>
                                                        <td>{selectedBid.material}</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="card mb-3">
                                            <div className="card-header">
                                                <h5 className="mb-0">Request Information</h5>
                                            </div>
                                            <div className="card-body">
                                                <p><strong>Requester Type:</strong> {getBidderType(selectedBid)}</p>
                                                <p><strong>Requester:</strong> {getRequesterEmail(selectedBid)}</p>
                                                <p><strong>Created:</strong> {new Date(selectedBid.created_at).toLocaleString()}</p>
                                                <p><strong>End Date:</strong> {new Date(selectedBid.last_date).toLocaleString()}</p>
                                                <p><strong>Status:</strong> <span className={`badge ${getBadgeClass(selectedBid.status)}`}>{selectedBid.status.toUpperCase()}</span></p>
                                            </div>
                                        </div>
                                        <div className="card">
                                            <div className="card-header">
                                                <h5 className="mb-0">Description</h5>
                                            </div>
                                            <div className="card-body">
                                                <p>{selectedBid.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {selectedBid.status === 'approved' && selectedBid.bids && selectedBid.bids.length > 0 && (
                                        <div className="col-12 mt-4">
                                            <h5>Current Bidders</h5>
                                            <table className="table table-striped table-sm">
                                                <thead>
                                                    <tr>
                                                        <th>Bidder</th>
                                                        <th>Amount</th>
                                                        <th>Time</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedBid.bids
                                                        .slice()
                                                        .sort((a, b) => b.amount - a.amount)
                                                        .map((bid, index) => (
                                                            <tr key={index} className={index === 0 ? 'table-success' : ''}>
                                                                <td>{bid.user_email || bid.bidder_email}</td>
                                                                <td>₹{bid.amount}</td>
                                                                <td>{new Date(bid.timestamp).toLocaleString()}</td>
                                                            </tr>
                                                        ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer">
                                {selectedBid.status === 'pending' && (
                                    <>
                                        <button 
                                            type="button" 
                                            className="btn btn-success"
                                            onClick={() => handleApprove(selectedBid._id)}
                                        >
                                            Approve
                                        </button>
                                        <button 
                                            type="button" 
                                            className="btn btn-danger"
                                            onClick={() => handleReject(selectedBid._id)}
                                        >
                                            Reject
                                        </button>
                                    </>
                                )}
                                <button type="button" className="btn btn-secondary" onClick={closeDetailsModal}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showDetailsModal && (
                <div className="modal-backdrop fade show"></div>
            )}

            <style jsx>{`
                .modal {
                    background-color: rgba(0, 0, 0, 0.5);
                }
                .badge {
                    font-size: 0.8rem;
                }
                .btn-group .btn {
                    margin-right: 2px;
                }
            `}</style>
        </div>
    );
};

export default BidRequests;
