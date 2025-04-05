import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const EventDetails = ({ eventId }) => {
    const [event, setEvent] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (eventId) {
            fetchEventDetails(eventId);
            fetchEventReviews(eventId);
        }
    }, [eventId]);

    const fetchEventDetails = async (id) => {
        try {
            const token = localStorage.getItem('usertoken');
            const response = await axios.get(
                `http://localhost:8080/instructor/events/${id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            if (response.data.success) {
                setEvent(response.data.event);
            }
        } catch (error) {
            console.error('Error fetching event details:', error);
            toast.error('Failed to load event details');
        } finally {
            setLoading(false);
        }
    };

    const fetchEventReviews = async (id) => {
        try {
            const response = await axios.get(
                `http://localhost:8080/reviews/event/${id}`
            );
            
            if (response.data.success) {
                setReviews(response.data.reviews);
            }
        } catch (error) {
            console.error('Error fetching event reviews:', error);
        }
    };

    if (loading) return <div className="text-center">Loading event details...</div>;
    if (!event) return <div className="text-center">Event not found</div>;

    return (
        <div className="container py-4">
            <div className="row">
                <div className="col-md-8">
                    <div className="card mb-4">
                        <div className="card-body">
                            <h3 className="card-title">{event.name}</h3>
                            <p className="card-text">{event.description}</p>
                            
                            <div className="row mt-4">
                                <div className="col-md-6">
                                    <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
                                    <p><strong>Time:</strong> {event.time}</p>
                                    <p><strong>Duration:</strong> {event.duration} days</p>
                                </div>
                                <div className="col-md-6">
                                    <p><strong>Type:</strong> {event.type}</p>
                                    <p><strong>Fee:</strong> ₹{event.fee}</p>
                                    {event.type === 'offline' && (
                                        <p><strong>Place:</strong> {event.place}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Event Reviews Section */}
                    <div className="card">
                        <div className="card-header bg-light">
                            <h4 className="mb-0">Event Reviews</h4>
                        </div>
                        <div className="card-body">
                            {reviews.length > 0 ? (
                                <div>
                                    {reviews.map((review, index) => (
                                        <div key={index} className="mb-4">
                                            <div className="d-flex align-items-center mb-2">
                                                <div className="me-2">
                                                    <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                        {review.user_email.substring(0, 1).toUpperCase()}
                                                    </div>
                                                </div>
                                                <div>
                                                    <h6 className="mb-0">{review.user_email}</h6>
                                                    <small className="text-muted">
                                                        {new Date(review.created_at).toLocaleDateString()}
                                                    </small>
                                                </div>
                                            </div>
                                            <div className="mb-2">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <span key={i} className={i < review.rating ? "text-warning" : "text-muted"}>★</span>
                                                ))}
                                            </div>
                                            <p>{review.comment}</p>
                                            {index < reviews.length - 1 && <hr />}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted">No reviews yet for this event.</p>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="col-md-4">
                    {event.poster && (
                        <div className="card mb-4">
                            <img 
                                src={`http://localhost:8080/uploads/event_posters/${event.poster}`}
                                className="card-img-top"
                                alt={event.name}
                            />
                        </div>
                    )}
                    
                    <div className="card">
                        <div className="card-header bg-primary text-white">
                            <h5 className="mb-0">Registration Status</h5>
                        </div>
                        <div className="card-body">
                            <p>
                                <strong>Status:</strong>{' '}
                                <span className="badge bg-success">Registered</span>
                            </p>
                            <p>
                                <strong>Payment Status:</strong>{' '}
                                <span className="badge bg-success">
                                    {event.registration_details?.payment_status || 'Completed'}
                                </span>
                            </p>
                            <p>
                                <strong>Registration Date:</strong>{' '}
                                {event.registration_details?.payment_date ? 
                                    new Date(event.registration_details.payment_date).toLocaleDateString() : 
                                    'N/A'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetails;
