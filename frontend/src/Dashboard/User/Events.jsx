import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import EventDetails from './EventDetails';

const UserEvents = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);

    useEffect(() => {
        const fetchRegisteredEvents = async () => {
            const token = localStorage.getItem('usertoken');
            if (!token) {
                navigate('/user-login');
                return;
            }

            try {
                const response = await axios.get(
                    'http://localhost:8080/instructor/events/registered',
                    { 
                        headers: { 
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        } 
                    }
                );
                
                if (response.data.success) {
                    setEvents(response.data.events);
                }
            } catch (err) {
                console.error('Error fetching registered events:', err);
                if (err.response?.status === 401) {
                    navigate('/user-login');
                } else {
                    setError('Failed to load your registered events');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchRegisteredEvents();
    }, [navigate]);

    if (loading) return <div className="text-center py-5">Loading...</div>;
    if (error) return <div className="text-center py-5 text-danger">{error}</div>;

    // If an event is selected, show its details
    if (selectedEvent) {
        return (
            <div>
                <button 
                    className="btn btn-outline-primary mb-4"
                    onClick={() => setSelectedEvent(null)}
                >
                    <i className="bi bi-arrow-left me-2"></i>
                    Back to Events
                </button>
                <EventDetails eventId={selectedEvent} />
            </div>
        );
    }

    return (
        <div className="container py-4">
            <h2 className="mb-4">My Registered Events</h2>
            {events.length === 0 ? (
                <div className="alert alert-info">
                    You haven't registered for any events yet.
                </div>
            ) : (
                <div className="row g-4">
                    {events.map(event => (
                        <div key={event._id} className="col-md-4">
                            <div className="card h-100 event-card">
                                {event.poster && (
                                    <img 
                                        src={`http://localhost:8080/uploads/event_posters/${event.poster}`}
                                        className="card-img-top"
                                        alt={event.name}
                                        style={{ height: '200px', objectFit: 'cover' }}
                                    />
                                )}
                                <div className="card-body">
                                    <h5 className="card-title">{event.name}</h5>
                                    <p className="card-text text-truncate">{event.description}</p>
                                    <div className="mt-3">
                                        <p className="mb-1">
                                            <strong>Date:</strong> {new Date(event.date).toLocaleDateString()}
                                        </p>
                                        <p className="mb-1">
                                            <strong>Type:</strong> {event.type}
                                        </p>
                                        <p className="mb-1">
                                            <strong>Status:</strong>{' '}
                                            <span className="badge bg-success">
                                                {event.registration_details?.payment_status || 'Registered'}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                <div className="card-footer bg-white border-0">
                                    <button 
                                        className="btn btn-primary w-100"
                                        onClick={() => setSelectedEvent(event._id)}
                                    >
                                        View Details & Reviews
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style jsx>{`
                .event-card {
                    transition: transform 0.3s ease;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    border: none;
                }
                .event-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 20px rgba(0,0,0,0.15);
                }
                .card-img-top {
                    transition: transform 0.5s ease;
                }
                .event-card:hover .card-img-top {
                    transform: scale(1.05);
                }
            `}</style>
        </div>
    );
};

export default UserEvents;
