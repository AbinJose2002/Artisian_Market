import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_51Pf271RrUp4W2KP556GuzSY5xDEQOiH0FdTiNpHsBByUhWgscyRiBbXqpK0dr0S0ShP71FFOKl4oddnXGhBDqRly00ekAPON9R');

const Events = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPaymentType, setSelectedPaymentType] = useState(null);
    const [registering, setRegistering] = useState(false);

    const getToken = () => {
        return (
            localStorage.getItem('usertoken') || 
            localStorage.getItem('instructortoken') || 
            localStorage.getItem('sellertoken')
        );
    };

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await axios.get("http://localhost:8080/instructor/events/list");
                
                // Filter out past events
                const today = new Date();
                today.setHours(0, 0, 0, 0); // Reset time to start of day
                
                const upcomingEvents = res.data.events.filter(event => {
                    const eventDate = new Date(event.date);
                    return eventDate >= today;
                }).sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by date

                setEvents(upcomingEvents);
            } catch (err) {
                console.error("Error fetching events:", err);
                setError("Failed to load events");
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    const handleRegister = async (event) => {
        const token = getToken();
        if (!token) {
            navigate('/user-login', { 
                state: { from: `/events`, message: 'Please login to register for events' } 
            });
            return;
        }

        setRegistering(true);
        try {
            if (selectedPaymentType === 'online') {
                const response = await axios.post('http://localhost:8080/payment/create-session', {
                    eventId: event._id,
                    amount: event.fee
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!response.data.success) {
                    throw new Error(response.data.error || 'Payment session creation failed');
                }

                const stripe = await stripePromise;
                const result = await stripe.redirectToCheckout({
                    sessionId: response.data.sessionId
                });

                if (result.error) {
                    throw new Error(result.error.message);
                }
            } else {
                // Handle offline registration
                await axios.post('http://localhost:8080/instructor/events/register', {
                    eventId: event._id,
                    paymentType: 'offline'
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('Registration successful! Please pay at the venue.');
            }
        } catch (error) {
            console.error('Registration failed:', error);
            alert(error.message || 'Registration failed. Please try again.');
        } finally {
            setRegistering(false);
            setSelectedPaymentType(null);
        }
    };

    if (loading) return <div className="text-center py-5">Loading...</div>;
    if (error) return <div className="text-center py-5 text-danger">{error}</div>;

    return (
        <div className="container py-5">
            <h1 className="mb-4">All Events</h1>
            <div className="row g-4">
                {events.map(event => (
                    <div key={event._id} className="col-md-3 mb-4">
                        <div className="card h-100">
                            {event.poster && (
                                <img 
                                    src={event.poster_url}
                                    className="card-img-top"
                                    alt={event.name}
                                    style={{ height: '200px', objectFit: 'cover' }}
                                />
                            )}
                            <div className="card-body">
                                <h5 className="card-title">{event.name}</h5>
                                <p className="card-text text-truncate">{event.description}</p>
                                <div className="mt-auto">
                                    <p className="mb-0">
                                        <strong>Date:</strong> {event.date}
                                    </p>
                                    <p>
                                        <strong>Fee:</strong> ₹{event.fee}
                                    </p>
                                    <span className="badge bg-primary">{event.type}</span>
                                </div>
                            </div>
                            <div className="card-footer">
                                <button 
                                    className="btn btn-primary w-100 mb-2"
                                    data-bs-toggle="modal"
                                    data-bs-target={`#registerModal${event._id}`}
                                >
                                    Register Now
                                </button>

                                {/* Registration Modal */}
                                <div className="modal fade" id={`registerModal${event._id}`}>
                                    <div className="modal-dialog">
                                        <div className="modal-content">
                                            <div className="modal-header">
                                                <h5 className="modal-title">Register for {event.name}</h5>
                                                <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                                            </div>
                                            <div className="modal-body">
                                                <h6>Registration Fee: ₹{event.fee}</h6>
                                                <div className="mt-3">
                                                    <div className="form-check mb-2">
                                                        <input
                                                            type="radio"
                                                            className="form-check-input"
                                                            name={`payment${event._id}`}
                                                            onChange={() => setSelectedPaymentType('online')}
                                                        />
                                                        <label className="form-check-label">Pay Online Now</label>
                                                    </div>
                                                    <div className="form-check">
                                                        <input
                                                            type="radio"
                                                            className="form-check-input"
                                                            name={`payment${event._id}`}
                                                            onChange={() => setSelectedPaymentType('offline')}
                                                        />
                                                        <label className="form-check-label">Pay at Venue</label>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="modal-footer">
                                                <button 
                                                    className="btn btn-primary"
                                                    onClick={() => handleRegister(event)}
                                                    disabled={!selectedPaymentType || registering}
                                                >
                                                    {registering ? 'Processing...' : 'Confirm Registration'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Events;
