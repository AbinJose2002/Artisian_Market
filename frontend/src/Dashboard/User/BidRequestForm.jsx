import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const BidRequestForm = ({ onRequestSubmitted }) => {
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        baseAmount: '',
        minBidIncrement: '',
        category: 'Painting',
        condition: 'New',
        dimensions: '',
        material: '',
        lastDate: '',
        image: null,
        firstName: '',
        lastName: '',
        mobile: ''
    });

    useEffect(() => {
        fetchUserDetails();
    }, []);

    const fetchUserDetails = async () => {
        try {
            const token = localStorage.getItem('usertoken');
            if (!token) {
                toast.error('Please login to proceed.');
                return;
            }

            const response = await axios.get('http://localhost:8080/user/details', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                const { first_name, last_name, mobile } = response.data.user;
                setFormData((prev) => ({
                    ...prev,
                    firstName: first_name,
                    lastName: last_name,
                    mobile
                }));
            } else {
                toast.error('Failed to fetch user details.');
            }
        } catch (error) {
            console.error('Error fetching user details:', error);

            // Handle server errors
            if (error.response?.status === 500) {
                toast.error('Server error: Unable to fetch user details.');
            } else if (error.response?.status === 403) {
                toast.error('Access denied. Please login again.');
            } else {
                toast.error('An error occurred while fetching user details.');
            }
        }
    };

    const categories = ['Painting', 'Sculpture', 'Photography', 'Digital Art', 'Others'];
    const conditions = ['New', 'Like New', 'Used - Excellent', 'Used - Good', 'Antique'];

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'image' && files[0]) {
            setFormData(prev => ({ ...prev, image: files[0] }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
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
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validate()) return;
        
        setLoading(true);
        try {
            const token = localStorage.getItem('usertoken');
            if (!token) {
                toast.error('Please login to submit bid request');
                return;
            }

            const formDataToSend = new FormData();
            Object.keys(formData).forEach(key => {
                formDataToSend.append(key, formData[key]);
            });

            const response = await axios.post(
                'http://localhost:8080/bids/request',
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
                // Reset form
                setFormData({
                    title: '',
                    description: '',
                    baseAmount: '',
                    minBidIncrement: '',
                    category: 'Painting',
                    condition: 'New',
                    dimensions: '',
                    material: '',
                    lastDate: '',
                    image: null,
                    firstName: '',
                    lastName: '',
                    mobile: ''
                });
                // Notify parent component
                if (onRequestSubmitted) {
                    onRequestSubmitted();
                }
            } else {
                throw new Error(response.data.message || 'Failed to submit bid request');
            }
        } catch (error) {
            console.error('Error submitting bid request:', error);
            let errorMessage = 'Failed to submit bid request';
            
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
                <h3 className="mb-0 fs-5">Request New Bid Auction</h3>
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
                            <label className="form-label">Last Date for Bidding</label>
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

                        <div className="col-md-6">
                            <label className="form-label">First Name</label>
                            <input
                                type="text"
                                name="firstName"
                                className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
                                value={formData.firstName}
                                onChange={handleChange}
                                readOnly
                            />
                            {errors.firstName && <div className="invalid-feedback">{errors.firstName}</div>}
                        </div>

                        <div className="col-md-6">
                            <label className="form-label">Last Name</label>
                            <input
                                type="text"
                                name="lastName"
                                className={`form-control ${errors.lastName ? 'is-invalid' : ''}`}
                                value={formData.lastName}
                                onChange={handleChange}
                                readOnly
                            />
                            {errors.lastName && <div className="invalid-feedback">{errors.lastName}</div>}
                        </div>

                        <div className="col-md-6">
                            <label className="form-label">Mobile Number</label>
                            <input
                                type="text"
                                name="mobile"
                                className={`form-control ${errors.mobile ? 'is-invalid' : ''}`}
                                value={formData.mobile}
                                onChange={handleChange}
                                readOnly
                            />
                            {errors.mobile && <div className="invalid-feedback">{errors.mobile}</div>}
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

                        <div className="col-12 d-flex justify-content-end mt-3 gap-2">
                            <button 
                                type="submit" 
                                className="btn btn-primary"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                        Submitting...
                                    </>
                                ) : 'Submit Bid Request'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BidRequestForm;
