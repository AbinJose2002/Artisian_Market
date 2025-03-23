import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const EventParticipants = ({ eventId }) => {
    const [participants, setParticipants] = useState([]);
    const [eventDetails, setEventDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (eventId) {
            Promise.all([
                fetchParticipants(),
                fetchEventDetails()
            ]);
        }
    }, [eventId]);

    const fetchParticipants = async () => {
        try {
            const token = localStorage.getItem('instructortoken');
            console.log(`Fetching participants for event: ${eventId}`);  // Debug log
            
            const response = await axios.get(
                `http://localhost:8080/instructor/events/${eventId}/participants`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setParticipants(response.data.participants);
            }
        } catch (err) {
            console.error('Error fetching participants:', err);
            setError('Failed to load participants');
            toast.error('Failed to load participants');
        } finally {
            setLoading(false);
        }
    };

    const fetchEventDetails = async () => {
        try {
            const token = localStorage.getItem('instructortoken');
            const response = await axios.get(
                `http://localhost:8080/instructor/events/${eventId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setEventDetails(response.data.event);
            }
        } catch (err) {
            console.error('Error fetching event details:', err);
            toast.error('Failed to load event details');
        }
    };

    // Show nothing if no eventId provided
    if (!eventId) return null;

    if (loading) return <div className="text-center">Loading...</div>;
    if (error) return <div className="text-danger">{error}</div>;

    return (
        <div className="mt-4">
            {/* Event Details Section */}
            {eventDetails && (
                <div className="card mb-4">
                    <div className="card-header bg-primary text-white">
                        <h5 className="mb-0">{eventDetails.name}</h5>
                    </div>
                    <div className="card-body">
                        <div className="row">
                            <div className="col-md-6">
                                <p><strong>Date:</strong> {eventDetails.date}</p>
                                <p><strong>Time:</strong> {eventDetails.time}</p>
                                <p><strong>Duration:</strong> {eventDetails.duration} days</p>
                            </div>
                            <div className="col-md-6">
                                <p><strong>Type:</strong> {eventDetails.type}</p>
                                <p><strong>Fee:</strong> ₹{eventDetails.fee}</p>
                                {eventDetails.type === 'offline' && (
                                    <p><strong>Place:</strong> {eventDetails.place}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Participants Section */}
            <div className="card">
                <div className="card-header bg-light">
                    <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">
                            Participants List
                            <span className="badge bg-primary ms-2">{participants.length}</span>
                        </h5>
                        <div className="btn-group">
                            <button className="btn btn-outline-primary btn-sm">
                                <i className="fas fa-download me-1"></i>
                                Export CSV
                            </button>
                            <button className="btn btn-outline-primary btn-sm">
                                <i className="fas fa-envelope me-1"></i>
                                Email All
                            </button>
                        </div>
                    </div>
                </div>
                <div className="table-responsive">
                    <table className="table table-hover mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Payment Status</th>
                                <th>Registration Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {participants.map((participant, index) => (
                                <tr key={index}>
                                    <td>
                                        <div className="fw-bold">{participant.name}</div>
                                    </td>
                                    <td>
                                        <div className="text-muted">{participant.email}</div>
                                    </td>
                                    <td>
                                        <span className={`badge ${
                                            participant.payment_status === 'completed' 
                                                ? 'bg-success' 
                                                : 'bg-warning'
                                        }`}>
                                            {participant.payment_status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="small text-muted">
                                            {participant.payment_date ? new Date(participant.payment_date).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            }) : 'N/A'}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="btn-group btn-group-sm">
                                            <button 
                                                className="btn btn-outline-primary"
                                                title="Send Email"
                                                onClick={() => toast.info(`Email feature coming soon for ${participant.email}`)}
                                            >
                                                <i className="fas fa-envelope"></i>
                                            </button>
                                            <button 
                                                className="btn btn-outline-success"
                                                title="View Details"
                                                onClick={() => toast.info(`Details feature coming soon for ${participant.name}`)}
                                            >
                                                <i className="fas fa-eye"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <style>{`
                .table th {
                    font-weight: 600;
                    background: var(--primary-color);
                    color: white;
                }
                .table td {
                    vertical-align: middle;
                }
                .btn-group-sm > .btn {
                    padding: .25rem .5rem;
                }
                .badge {
                    font-size: 0.85em;
                    padding: 0.35em 0.65em;
                }
            `}</style>
        </div>
    );
};

export default EventParticipants;
