import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const Reviews = () => {
    const [productOrders, setProductOrders] = useState([]);
    const [registeredEvents, setRegisteredEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('products');
    const [selectedItem, setSelectedItem] = useState(null);
    const [reviewData, setReviewData] = useState({
        rating: 5,
        comment: '',
    });

    useEffect(() => {
        Promise.all([
            fetchOrders(),
            fetchRegisteredEvents()
        ]).finally(() => setLoading(false));
    }, []);

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem('usertoken');
            const response = await axios.get('http://localhost:8080/order/user/orders', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                const orders = response.data.orders.filter(order => !order.reviewed);
                setProductOrders(orders);
            }
        } catch (error) {
            console.error('Failed to fetch orders:', error);
            toast.error('Could not load your orders');
        }
    };

    const fetchRegisteredEvents = async () => {
        try {
            const token = localStorage.getItem('usertoken');
            const response = await axios.get('http://localhost:8080/instructor/events/registered', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                const events = response.data.events.filter(event => !event.reviewed);
                setRegisteredEvents(events);
            }
        } catch (error) {
            console.error('Failed to fetch registered events:', error);
            toast.error('Could not load your registered events');
        }
    };

    const handleRatingChange = (rating) => {
        setReviewData({ ...reviewData, rating });
    };

    const handleCommentChange = (e) => {
        setReviewData({ ...reviewData, comment: e.target.value });
    };

    const handleSubmitReview = async () => {
        if (!selectedItem) return;

        try {
            const token = localStorage.getItem('usertoken');
            if (!token) {
                toast.error('You must be logged in to submit a review');
                return;
            }

            console.log('Submitting review with data:', {
                item: selectedItem,
                reviewData,
                activeTab
            });

            const endpoint = activeTab === 'products' 
                ? `http://localhost:8080/reviews/product/${selectedItem.item_id || selectedItem._id || selectedItem.id}`
                : `http://localhost:8080/reviews/event/${selectedItem._id || selectedItem.id}`;

            console.log('Using endpoint:', endpoint);

            const response = await axios.post(
                endpoint, 
                reviewData,
                {
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('Review submission response:', response.data);

            if (response.data.success) {
                toast.success('Thank you for your review!');
                setSelectedItem(null);
                setReviewData({ rating: 5, comment: '' });

                // Refresh lists
                if (activeTab === 'products') {
                    await fetchOrders();
                } else {
                    await fetchRegisteredEvents();
                }
            } else {
                throw new Error(response.data.message || 'Failed to submit review');
            }
        } catch (error) {
            console.error('Failed to submit review:', error);
            toast.error(error.response?.data?.message || 'Failed to submit review. Please try again.');
        }
    };

    if (loading) return <div className="text-center">Loading your purchase history...</div>;

    return (
        <div className="container py-4">
            <h2 className="mb-4">Write Reviews</h2>
            
            {/* Replace react-bootstrap Tab component with standard Bootstrap tabs */}
            <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                    <button 
                        className={`nav-link ${activeTab === 'products' ? 'active' : ''}`}
                        onClick={() => setActiveTab('products')}
                    >
                        Products
                    </button>
                </li>
                <li className="nav-item">
                    <button 
                        className={`nav-link ${activeTab === 'events' ? 'active' : ''}`}
                        onClick={() => setActiveTab('events')}
                    >
                        Events
                    </button>
                </li>
            </ul>
            
            <div className="tab-content">
                {/* Products Tab */}
                <div className={`tab-pane ${activeTab === 'products' ? 'show active' : ''}`}>
                    {productOrders.length === 0 ? (
                        <div className="alert alert-info">
                            You don't have any products to review at the moment.
                        </div>
                    ) : (
                        <div className="row">
                            <div className="col-md-6">
                                <h4 className="mb-3">Select a Product to Review</h4>
                                <div className="list-group">
                                    {productOrders.flatMap(order => 
                                        order.items.map((item, index) => (
                                            <button 
                                                key={`${order.order_id}-${index}`}
                                                className={`list-group-item list-group-item-action d-flex align-items-center ${selectedItem === item ? 'active' : ''}`}
                                                onClick={() => setSelectedItem(item)}
                                            >
                                                {item.image && (
                                                    <img 
                                                        src={`http://localhost:8080/uploads/product_images/${item.image}`} 
                                                        alt={item.name}
                                                        className="me-3"
                                                        style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                                    />
                                                )}
                                                <div>
                                                    <h6 className="mb-0">{item.name}</h6>
                                                    <small>Purchased on {new Date(order.created_at).toLocaleDateString()}</small>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                            {selectedItem && (
                                <div className="col-md-6">
                                    <div className="review-form p-4 border rounded">
                                        <h4 className="mb-3">Review for {selectedItem.name}</h4>
                                        <div className="mb-3">
                                            <label className="form-label">Rating</label>
                                            <div className="rating-stars">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <span 
                                                        key={star}
                                                        className={`star ${reviewData.rating >= star ? 'active' : ''}`}
                                                        onClick={() => handleRatingChange(star)}
                                                    >
                                                        ★
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Comments</label>
                                            <textarea 
                                                className="form-control" 
                                                rows="4"
                                                value={reviewData.comment}
                                                onChange={handleCommentChange}
                                                placeholder="Share your experience with this product..."
                                            ></textarea>
                                        </div>
                                        <button 
                                            className="btn btn-primary"
                                            onClick={handleSubmitReview}
                                        >
                                            Submit Review
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                
                {/* Events Tab */}
                <div className={`tab-pane ${activeTab === 'events' ? 'show active' : ''}`}>
                    {registeredEvents.length === 0 ? (
                        <div className="alert alert-info">
                            You don't have any events to review at the moment.
                        </div>
                    ) : (
                        <div className="row">
                            <div className="col-md-6">
                                <h4 className="mb-3">Select an Event to Review</h4>
                                <div className="list-group">
                                    {registeredEvents.map(event => (
                                        <button 
                                            key={event._id}
                                            className={`list-group-item list-group-item-action d-flex align-items-center ${selectedItem === event ? 'active' : ''}`}
                                            onClick={() => setSelectedItem(event)}
                                        >
                                            {event.poster && (
                                                <img 
                                                    src={`http://localhost:8080/uploads/event_posters/${event.poster}`} 
                                                    alt={event.name}
                                                    className="me-3"
                                                    style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                                />
                                            )}
                                            <div>
                                                <h6 className="mb-0">{event.name}</h6>
                                                <small>Event Date: {new Date(event.date).toLocaleDateString()}</small>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {selectedItem && (
                                <div className="col-md-6">
                                    <div className="review-form p-4 border rounded">
                                        <h4 className="mb-3">Review for {selectedItem.name}</h4>
                                        <div className="mb-3">
                                            <label className="form-label">Rating</label>
                                            <div className="rating-stars">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <span 
                                                        key={star}
                                                        className={`star ${reviewData.rating >= star ? 'active' : ''}`}
                                                        onClick={() => handleRatingChange(star)}
                                                    >
                                                        ★
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Comments</label>
                                            <textarea 
                                                className="form-control" 
                                                rows="4"
                                                value={reviewData.comment}
                                                onChange={handleCommentChange}
                                                placeholder="Share your experience with this event..."
                                            ></textarea>
                                        </div>
                                        <button 
                                            className="btn btn-primary"
                                            onClick={handleSubmitReview}
                                        >
                                            Submit Review
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .rating-stars {
                    font-size: 2rem;
                    color: #ccc;
                    cursor: pointer;
                }
                .rating-stars .star {
                    margin-right: 5px;
                }
                .rating-stars .star.active {
                    color: #ffc107;
                }
                .review-form {
                    background-color: #f9f9f9;
                }
                .list-group-item.active h6,
                .list-group-item.active small {
                    color: white !important;
                }
                .tab-pane {
                    display: none;
                }
                .tab-pane.show.active {
                    display: block;
                }
            `}</style>
        </div>
    );
};

export default Reviews;
