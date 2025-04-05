import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const MyReviews = () => {
    const [productReviews, setProductReviews] = useState([]);
    const [eventReviews, setEventReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('products');
    const [error, setError] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('usertoken');
        if (!token) {
            setError('Please log in to view your reviews');
            setLoading(false);
            return;
        }

        Promise.all([
            fetchProductReviews(token),
            fetchEventReviews(token)
        ]).finally(() => setLoading(false));
    }, []);

    const fetchProductReviews = async (token) => {
        try {
            const response = await axios.get(
                'http://localhost:8080/reviews/user/products',
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            if (response.data.success) {
                setProductReviews(response.data.reviews);
            }
        } catch (error) {
            console.error('Failed to fetch product reviews:', error);
            toast.error('Could not load your product reviews');
        }
    };

    const fetchEventReviews = async (token) => {
        try {
            const response = await axios.get(
                'http://localhost:8080/reviews/user/events',
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            if (response.data.success) {
                setEventReviews(response.data.reviews);
            }
        } catch (error) {
            console.error('Failed to fetch event reviews:', error);
            toast.error('Could not load your event reviews');
        }
    };

    if (loading) return <div className="text-center py-5">Loading your reviews...</div>;
    if (error) return <div className="alert alert-warning">{error}</div>;

    return (
        <div className="container py-4">
            <h2 className="mb-4">My Reviews</h2>
            
            {/* Tab navigation */}
            <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                    <button 
                        className={`nav-link ${activeTab === 'products' ? 'active' : ''}`}
                        onClick={() => setActiveTab('products')}
                    >
                        Product Reviews
                    </button>
                </li>
                <li className="nav-item">
                    <button 
                        className={`nav-link ${activeTab === 'events' ? 'active' : ''}`}
                        onClick={() => setActiveTab('events')}
                    >
                        Event Reviews
                    </button>
                </li>
            </ul>
            
            <div className="tab-content">
                {/* Product Reviews Tab */}
                <div className={`tab-pane ${activeTab === 'products' ? 'show active' : ''}`}>
                    {productReviews.length === 0 ? (
                        <div className="alert alert-info">
                            You haven't submitted any product reviews yet.
                        </div>
                    ) : (
                        <div className="row g-4">
                            {productReviews.map(review => (
                                <div key={review.review_id} className="col-md-6">
                                    <div className="card h-100 shadow-sm">
                                        <div className="card-header d-flex justify-content-between align-items-center">
                                            <h5 className="mb-0">{review.product_name}</h5>
                                            <div>
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <span key={i} className={i < review.rating ? "text-warning" : "text-muted"}>★</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="card-body">
                                            <p className="card-text">{review.comment}</p>
                                            {review.product_image && (
                                                <div className="text-center mt-3">
                                                    <img 
                                                        src={`http://localhost:8080/uploads/product_images/${review.product_image}`}
                                                        alt={review.product_name}
                                                        className="img-thumbnail" 
                                                        style={{ height: '100px', objectFit: 'contain' }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div className="card-footer text-muted">
                                            <small>Reviewed on {new Date(review.created_at).toLocaleDateString()}</small>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                {/* Event Reviews Tab */}
                <div className={`tab-pane ${activeTab === 'events' ? 'show active' : ''}`}>
                    {eventReviews.length === 0 ? (
                        <div className="alert alert-info">
                            You haven't submitted any event reviews yet.
                        </div>
                    ) : (
                        <div className="row g-4">
                            {eventReviews.map(review => (
                                <div key={review.review_id} className="col-md-6">
                                    <div className="card h-100 shadow-sm">
                                        <div className="card-header d-flex justify-content-between align-items-center">
                                            <h5 className="mb-0">{review.event_name}</h5>
                                            <div>
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <span key={i} className={i < review.rating ? "text-warning" : "text-muted"}>★</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="card-body">
                                            <p className="card-text">{review.comment}</p>
                                            {review.event_poster && (
                                                <div className="text-center mt-3">
                                                    <img 
                                                        src={`http://localhost:8080/uploads/event_posters/${review.event_poster}`}
                                                        alt={review.event_name}
                                                        className="img-thumbnail" 
                                                        style={{ height: '100px', objectFit: 'contain' }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div className="card-footer text-muted">
                                            <small>Reviewed on {new Date(review.created_at).toLocaleDateString()}</small>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .tab-pane {
                    display: none;
                }
                .tab-pane.show.active {
                    display: block;
                }
                .card {
                    transition: transform 0.3s ease;
                }
                .card:hover {
                    transform: translateY(-5px);
                }
            `}</style>
        </div>
    );
};

export default MyReviews;
