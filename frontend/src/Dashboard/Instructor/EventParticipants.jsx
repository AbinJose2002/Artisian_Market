import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faEye, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

const EventParticipants = ({ eventId }) => {
    const [participants, setParticipants] = useState([]);
    const [eventDetails, setEventDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Complaint state
    const [showComplaintModal, setShowComplaintModal] = useState(false);
    const [selectedParticipant, setSelectedParticipant] = useState(null);
    const [complaintText, setComplaintText] = useState('');
    const [submittingComplaint, setSubmittingComplaint] = useState(false);

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

    const handleComplaintClick = (participant) => {
        setSelectedParticipant(participant);
        setComplaintText('');
        setShowComplaintModal(true);
    };

    const handleSubmitComplaint = async () => {
        if (!complaintText.trim()) {
            toast.error('Please provide complaint details');
            return;
        }

        setSubmittingComplaint(true);
        try {
            const token = localStorage.getItem('instructortoken');
            
            // Get instructor info for the complaint
            const instructorInfo = await axios.get(
                'http://localhost:8080/instructor/profile',
                { headers: { Authorization: `Bearer ${token}` } }
            ).catch(() => ({ data: { profile: {} } }));
            
            const instructorEmail = instructorInfo?.data?.profile?.email || localStorage.getItem('instructor_email') || '';
            // Get instructor's full name from profile
            const instructorName = 
                `${instructorInfo?.data?.profile?.first_name || ''} ${instructorInfo?.data?.profile?.last_name || ''}`.trim() || 
                'Unnamed Instructor';
            
            const complaintData = {
                complainant_type: 'instructor',
                complainant_email: instructorEmail,
                complainant_name: instructorName,
                type: 'user', // Changed from against_type to type
                against_id: selectedParticipant.id || '',
                against_email: selectedParticipant.email,
                entityName: selectedParticipant.name || 'Anonymous Participant', // Changed from against_name to entityName
                subject: `Complaint about participant in event: ${eventDetails?.name || 'Event'}`,
                description: complaintText,
                event_id: eventId,
                event_name: eventDetails?.name || 'Unknown Event'
            };

            console.log("Submitting complaint:", complaintData);

            const response = await axios.post(
                'http://localhost:8080/complaints/create',
                complaintData,
                { 
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    } 
                }
            );

            if (response.data.success) {
                toast.success('Complaint submitted successfully');
                setShowComplaintModal(false);
                setComplaintText('');
            } else {
                toast.error(response.data.message || 'Failed to submit complaint');
            }
        } catch (err) {
            console.error('Error submitting complaint:', err);
            toast.error('Failed to submit complaint. Please try again later.');
        } finally {
            setSubmittingComplaint(false);
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
                                                <FontAwesomeIcon icon={faEnvelope} />
                                            </button>
                                            <button 
                                                className="btn btn-outline-success"
                                                title="View Details"
                                                onClick={() => toast.info(`Details feature coming soon for ${participant.name}`)}
                                            >
                                                <FontAwesomeIcon icon={faEye} />
                                            </button>
                                            <button 
                                                className="btn btn-outline-danger"
                                                title="Report to Admin"
                                                onClick={() => handleComplaintClick(participant)}
                                            >
                                                <FontAwesomeIcon icon={faExclamationTriangle} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Complaint Modal */}
            {showComplaintModal && selectedParticipant && (
                <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Report Participant to Admin</h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={() => setShowComplaintModal(false)}
                                    disabled={submittingComplaint}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <p><strong>Participant:</strong> {selectedParticipant.name} ({selectedParticipant.email})</p>
                                    <p><strong>Event:</strong> {eventDetails?.name}</p>
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="complaintText" className="form-label">Complaint Details</label>
                                    <textarea 
                                        id="complaintText"
                                        className="form-control" 
                                        rows="4"
                                        value={complaintText}
                                        onChange={(e) => setComplaintText(e.target.value)}
                                        placeholder="Describe the issue with this participant..."
                                        required
                                    ></textarea>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary" 
                                    onClick={() => setShowComplaintModal(false)}
                                    disabled={submittingComplaint}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-danger"
                                    onClick={handleSubmitComplaint}
                                    disabled={submittingComplaint || !complaintText.trim()}
                                >
                                    {submittingComplaint ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Submitting...
                                        </>
                                    ) : 'Submit Complaint'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                .modal {
                    background-color: rgba(0, 0, 0, 0.5);
                }
                .modal-backdrop {
                    display: none;
                }
            `}</style>
        </div>
    );
};

export default EventParticipants;
