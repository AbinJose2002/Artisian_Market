import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const BidManager = () => {
    const [bids, setBids] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        baseAmount: '',
        lastDate: '',
        image: null,
        category: 'Painting',
        condition: 'New',
        minBidIncrement: '',
        dimensions: '',
        material: '',
        artistDetails: ''
    });
    const [customCategory, setCustomCategory] = useState('');

    const [instructorBids, setInstructorBids] = useState([]);
    const [selectedBid, setSelectedBid] = useState(null);
    const [showBidDetails, setShowBidDetails] = useState(false);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [errors, setErrors] = useState({});

    const categories = ['Painting', 'Sculpture', 'Photography', 'Digital Art', 'Others'];
    const conditions = ['New', 'Like New', 'Used - Excellent', 'Used - Good', 'Antique'];

    useEffect(() => {
        fetchInstructorBids();
    }, []);

    const fetchInstructorBids = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('instructortoken');
            
            const response = await axios.get('http://localhost:8080/instructor/bids', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setInstructorBids(response.data.bids);
                console.log("Instructor bids:", response.data.bids);
            } else {
                toast.error('Failed to load your bids');
            }
        } catch (error) {
            console.error('Error fetching instructor bids:', error);
            toast.error('Error loading instructor bids');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'image' && files[0]) {
            setFormData(prev => ({ ...prev, image: files[0] }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
        
        // Reset custom category when category changes away from Others
        if (name === 'category' && value !== 'Others') {
            setCustomCategory('');
        }
    };
    
    const handleCustomCategoryChange = (e) => {
        setCustomCategory(e.target.value);
    };

    const validate = () => {
        const newErrors = {};
        const currentDate = new Date();
        const selectedDate = new Date(formData.lastDate);
        
        if (!formData.title.trim()) newErrors.title = "Title is required";
        if (!formData.description.trim()) newErrors.description = "Description is required";
        if (!formData.baseAmount || formData.baseAmount <= 0) newErrors.baseAmount = "Valid base amount is required";
        if (!formData.minBidIncrement || formData.minBidIncrement <= 0) newErrors.minBidIncrement = "Valid bid increment is required";
        if (!formData.lastDate) newErrors.lastDate = "End date is required";
        if (selectedDate <= currentDate) newErrors.lastDate = "End date must be in the future";
        if (!formData.image) newErrors.image = "Image is required";
        if (formData.category === 'Others' && !customCategory.trim()) newErrors.customCategory = "Custom category is required";
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validate()) return;
        
        try {
            const token = localStorage.getItem('instructortoken');
            if (!token) {
                toast.error('Please login to submit bid request');
                return;
            }

            const formDataToSend = new FormData();
            // Use all formData fields except potentially override category
            Object.keys(formData).forEach(key => {
                // If category is 'Others', use the custom category instead
                if (key === 'category' && formData[key] === 'Others') {
                    formDataToSend.append(key, customCategory.trim());
                } else {
                    formDataToSend.append(key, formData[key]);
                }
            });

            const response = await axios.post(
                'http://localhost:8080/instructor/bids/request',
                formDataToSend,
                { 
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    } 
                }
            );

            if (response.data.success) {
                toast.success('Bid request submitted successfully!');
                // Reset form and fetch updated bids
                setShowForm(false);
                setFormData({
                    title: '',
                    description: '',
                    baseAmount: '',
                    lastDate: '',
                    image: null,
                    category: 'Painting',
                    condition: 'New',
                    minBidIncrement: '',
                    dimensions: '',
                    material: '',
                    artistDetails: ''
                });
                setCustomCategory('');
                fetchInstructorBids();
            } else {
                toast.error(response.data.message || 'Failed to submit bid request');
            }
        } catch (error) {
            console.error('Error submitting bid request:', error);
            toast.error(error.response?.data?.message || 'Error submitting request');
        }
    };

    const viewBidDetails = (bid) => {
        setSelectedBid(bid);
        setShowBidDetails(true);
    };

    const closeDetailsModal = () => {
        setShowBidDetails(false);
        setSelectedBid(null);
    };

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved':
                return <span className="badge bg-success">Approved</span>;
            case 'rejected':
                return <span className="badge bg-danger">Rejected</span>;
            case 'pending':
                return <span className="badge bg-warning">Pending</span>;
            default:
                return <span className="badge bg-secondary">{status || 'Unknown'}</span>;
        }
    };

    const filteredBids = filterStatus === 'all' 
        ? instructorBids 
        : instructorBids.filter(bid => bid.status?.toLowerCase() === filterStatus.toLowerCase());

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Loading bid information...</p>
            </div>
        );
    }

    return (
        <div className="container-fluid py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Art Auction Management</h2>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? 'Cancel' : '+ Create New Auction'}
                </button>
            </div>

            {/* Bid Request Form */}
            {showForm && (
                <div className="card shadow-sm mb-5">
                    <div className="card-header bg-primary text-white">
                        <h5 className="mb-0">Create New Auction</h5>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label">Item Title</label>
                                    <input
                                        type="text"
                                        name="title"
                                        className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                                        value={formData.title}
                                        onChange={handleChange}
                                        required
                                    />
                                    {errors.title && <div className="invalid-feedback">{errors.title}</div>}
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label">Base Amount (₹)</label>
                                    <input
                                        type="number"
                                        name="baseAmount"
                                        className={`form-control ${errors.baseAmount ? 'is-invalid' : ''}`}
                                        value={formData.baseAmount}
                                        onChange={handleChange}
                                        required
                                        min="1"
                                    />
                                    {errors.baseAmount && <div className="invalid-feedback">{errors.baseAmount}</div>}
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label">Category</label>
                                    <select
                                        name="category"
                                        className="form-select"
                                        value={formData.category}
                                        onChange={handleChange}
                                        required
                                    >
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                {/* Add custom category input field when 'Others' is selected */}
                                {formData.category === 'Others' && (
                                    <div className="col-md-6">
                                        <label className="form-label">Specify Category</label>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.customCategory ? 'is-invalid' : ''}`}
                                            value={customCategory}
                                            onChange={handleCustomCategoryChange}
                                            placeholder="Enter custom category"
                                            required
                                        />
                                        {errors.customCategory && <div className="invalid-feedback">{errors.customCategory}</div>}
                                    </div>
                                )}

                                <div className="col-md-6">
                                    <label className="form-label">Condition</label>
                                    <select
                                        name="condition"
                                        className="form-select"
                                        value={formData.condition}
                                        onChange={handleChange}
                                        required
                                    >
                                        {conditions.map(cond => (
                                            <option key={cond} value={cond}>{cond}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">Minimum Bid Increment (₹)</label>
                                    <input
                                        type="number"
                                        name="minBidIncrement"
                                        className={`form-control ${errors.minBidIncrement ? 'is-invalid' : ''}`}
                                        value={formData.minBidIncrement}
                                        onChange={handleChange}
                                        required
                                        min="1"
                                    />
                                    {errors.minBidIncrement && <div className="invalid-feedback">{errors.minBidIncrement}</div>}
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">Dimensions</label>
                                    <input
                                        type="text"
                                        name="dimensions"
                                        className="form-control"
                                        value={formData.dimensions}
                                        onChange={handleChange}
                                        placeholder="e.g., 24x36 inches"
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">Material</label>
                                    <input
                                        type="text"
                                        name="material"
                                        className="form-control"
                                        value={formData.material}
                                        onChange={handleChange}
                                        placeholder="e.g., Oil on Canvas"
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label">End Date for Bidding</label>
                                    <input
                                        type="datetime-local"
                                        name="lastDate"
                                        className={`form-control ${errors.lastDate ? 'is-invalid' : ''}`}
                                        value={formData.lastDate}
                                        onChange={handleChange}
                                        required
                                    />
                                    {errors.lastDate && <div className="invalid-feedback">{errors.lastDate}</div>}
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label">Item Image</label>
                                    <input
                                        type="file"
                                        name="image"
                                        className={`form-control ${errors.image ? 'is-invalid' : ''}`}
                                        onChange={handleChange}
                                        accept="image/*"
                                        required
                                    />
                                    {errors.image && <div className="invalid-feedback">{errors.image}</div>}
                                </div>

                                <div className="col-md-12">
                                    <label className="form-label">Artist Details</label>
                                    <input
                                        type="text"
                                        name="artistDetails"
                                        className="form-control"
                                        value={formData.artistDetails}
                                        onChange={handleChange}
                                        placeholder="Information about the artist"
                                    />
                                </div>

                                <div className="col-12">
                                    <label className="form-label">Item Description</label>
                                    <textarea
                                        name="description"
                                        className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                                        rows="3"
                                        value={formData.description}
                                        onChange={handleChange}
                                        required
                                    ></textarea>
                                    {errors.description && <div className="invalid-feedback">{errors.description}</div>}
                                </div>

                                <div className="col-12 d-flex justify-content-end mt-3">
                                    <button 
                                        type="submit" 
                                        className="btn btn-primary"
                                    >
                                        Submit Auction Request
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Bid List Section */}
            <div className="card shadow-sm">
                <div className="card-header bg-light">
                    <h5 className="mb-0">My Auctions</h5>
                </div>
                <div className="card-body">
                    {/* Filtering tabs */}
                    <ul className="nav nav-tabs mb-4">
                        <li className="nav-item">
                            <button 
                                className={`nav-link ${filterStatus === 'all' ? 'active' : ''}`}
                                onClick={() => setFilterStatus('all')}
                            >
                                All Auctions
                                <span className="badge bg-secondary ms-2">{instructorBids.length}</span>
                            </button>
                        </li>
                        <li className="nav-item">
                            <button 
                                className={`nav-link ${filterStatus === 'approved' ? 'active' : ''}`}
                                onClick={() => setFilterStatus('approved')}
                            >
                                Approved
                                <span className="badge bg-success ms-2">
                                    {instructorBids.filter(bid => bid.status === 'approved').length}
                                </span>
                            </button>
                        </li>
                        <li className="nav-item">
                            <button 
                                className={`nav-link ${filterStatus === 'pending' ? 'active' : ''}`}
                                onClick={() => setFilterStatus('pending')}
                            >
                                Pending
                                <span className="badge bg-warning ms-2">
                                    {instructorBids.filter(bid => bid.status === 'pending').length}
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
                                    {instructorBids.filter(bid => bid.status === 'rejected').length}
                                </span>
                            </button>
                        </li>
                    </ul>

                    {instructorBids.length === 0 ? (
                        <div className="alert alert-info">
                            <p className="mb-0">You haven't created any auctions yet.</p>
                        </div>
                    ) : filteredBids.length === 0 ? (
                        <div className="alert alert-info">
                            <p className="mb-0">No auctions found with the selected filter.</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover">
                                <thead className="table-light">
                                    <tr>
                                        <th>Title</th>
                                        <th>Base Amount</th>
                                        <th>Current Amount</th>
                                        <th>End Date</th>
                                        <th>Status</th>
                                        <th>Bids</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBids.map(bid => (
                                        <tr key={bid._id}>
                                            <td>{bid.title}</td>
                                            <td>₹{bid.base_amount}</td>
                                            <td>₹{bid.current_amount || bid.base_amount}</td>
                                            <td>{new Date(bid.last_date).toLocaleDateString()}</td>
                                            <td>{getStatusBadge(bid.status)}</td>
                                            <td>{bid.bids ? bid.bids.length : 0}</td>
                                            <td>
                                                <button
                                                    className="btn btn-sm btn-outline-primary"
                                                    onClick={() => viewBidDetails(bid)}
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Bid Details Modal */}
            {showBidDetails && selectedBid && (
                <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{selectedBid.title}</h5>
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
                                        
                                        <div className="card mb-3">
                                            <div className="card-header">
                                                <h6 className="mb-0">Description</h6>
                                            </div>
                                            <div className="card-body">
                                                <p>{selectedBid.description}</p>
                                                {selectedBid.artistDetails && (
                                                    <div className="mt-3">
                                                        <h6>Artist Details</h6>
                                                        <p>{selectedBid.artistDetails}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="col-md-6">
                                        <div className="card mb-3">
                                            <div className="card-header d-flex justify-content-between align-items-center">
                                                <h6 className="mb-0">Auction Details</h6>
                                                {getStatusBadge(selectedBid.status)}
                                            </div>
                                            <div className="card-body">
                                                <table className="table">
                                                    <tbody>
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
                                                        <tr>
                                                            <th>End Date</th>
                                                            <td>{new Date(selectedBid.last_date).toLocaleString()}</td>
                                                        </tr>
                                                        <tr>
                                                            <th>Created On</th>
                                                            <td>{new Date(selectedBid.created_at).toLocaleString()}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                        
                                        {/* Bidders list */}
                                        <div className="card">
                                            <div className="card-header">
                                                <h6 className="mb-0">Bidders</h6>
                                            </div>
                                            <div className="card-body">
                                                {selectedBid.bids && selectedBid.bids.length > 0 ? (
                                                    <div className="table-responsive">
                                                        <table className="table table-sm">
                                                            <thead>
                                                                <tr>
                                                                    <th>#</th>
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
                                                                        <tr 
                                                                            key={index} 
                                                                            className={index === 0 ? 'table-success' : ''}
                                                                        >
                                                                            <td>{index + 1}</td>
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
                                                    <p className="text-muted mb-0">No bids have been placed yet.</p>
                                                )}
                                                
                                                {selectedBid.status === 'pending' && (
                                                    <div className="alert alert-warning mt-3">
                                                        <small>
                                                            <i className="bi bi-info-circle me-2"></i>
                                                            This auction is awaiting approval from the administrator.
                                                        </small>
                                                    </div>
                                                )}
                                                
                                                {selectedBid.status === 'rejected' && (
                                                    <div className="alert alert-danger mt-3">
                                                        <small>
                                                            <i className="bi bi-x-circle me-2"></i>
                                                            This auction request was rejected by the administrator.
                                                        </small>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeDetailsModal}>
                                    Close
                                </button>
                                
                                {selectedBid.status === 'approved' && (
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
        </div>
    );
};

export default BidManager;
