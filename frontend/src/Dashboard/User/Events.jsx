import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const UserEvents = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                            <div className="card h-100">
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
                                    <p className="card-text">{event.description}</p>
                                    <div className="mt-3">
                                        <p className="mb-1">
                                            <strong>Date:</strong> {event.date}
                                        </p>
                                        <p className="mb-1">
                                            <strong>Time:</strong> {event.time}
                                        </p>
                                        <p className="mb-1">
                                            <strong>Type:</strong> {event.type}
                                        </p>
                                        <p className="mb-1">
                                            <strong>Status:</strong>{' '}
                                            <span className={`badge bg-${
                                                event.registration_details.payment_status === 'completed' 
                                                    ? 'success' 
                                                    : 'warning'
                                            }`}>
                                                {event.registration_details.payment_status}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UserEvents;
