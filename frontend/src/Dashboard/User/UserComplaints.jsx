import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faSpinner, faCheck, faTimes, faHistory, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

const UserComplaints = () => {
    const [sellers, setSellers] = useState([]);
    const [instructors, setInstructors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        type: 'seller',
        entityId: '',
        subject: '',
        description: '',
        severity: 'medium',
        attachments: null
    });
    const [previousComplaints, setPreviousComplaints] = useState([]);
    const [viewMode, setViewMode] = useState('new'); // 'new' or 'history'
    const [loadingEntities, setLoadingEntities] = useState(true);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showAttachment, setShowAttachment] = useState(false);
    const [attachmentType, setAttachmentType] = useState('unknown');

    useEffect(() => {
        // Load entities and previous complaints
        fetchEntities();
        fetchPreviousComplaints();
    }, []);

    const fetchEntities = async () => {
        try {
            setLoadingEntities(true);
            const token = localStorage.getItem('usertoken');
            
            // Define mock data as fallback in case API fails
            const mockSellers = [
                { _id: '1', firstName: 'John', lastName: 'Doe', shopName: 'Artistic Creations' },
                { _id: '2', firstName: 'Jane', lastName: 'Smith', shopName: 'Craft Corner' },
                { _id: '3', firstName: 'Alice', lastName: 'Johnson', shopName: 'Art Supplies Co.' }
            ];
            
            const mockInstructors = [
                { _id: '1', name: 'Robert Williams', expertise: 'Painting' },
                { _id: '2', name: 'Emily Rodriguez', expertise: 'Sculpture' },
                { _id: '3', name: 'Michael Chen', expertise: 'Digital Art' }
            ];
            
            // Try to fetch real sellers data
            try {
                const sellersResponse = await axios.get('http://localhost:8080/seller/list', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (sellersResponse.data.success) {
                    console.log("Successfully fetched sellers:", sellersResponse.data.sellers);
                    setSellers(sellersResponse.data.sellers);
                } else {
                    console.warn("API returned success:false for sellers list");
                    setSellers(mockSellers);
                }
            } catch (error) {
                console.error('Error fetching sellers:', error);
                setSellers(mockSellers);
                toast.warning('Using sample seller data');
            }
            
            // Try to fetch real instructors data
            try {
                const instructorsResponse = await axios.get('http://localhost:8080/instructor/list', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (instructorsResponse.data.success) {
                    console.log("Successfully fetched instructors:", instructorsResponse.data.instructors);
                    setInstructors(instructorsResponse.data.instructors);
                } else {
                    console.warn("API returned success:false for instructors list");
                    setInstructors(mockInstructors);
                }
            } catch (error) {
                console.error('Error fetching instructors:', error);
                setInstructors(mockInstructors);
                toast.warning('Using sample instructor data');
            }
        } catch (error) {
            console.error('Error in fetchEntities:', error);
        } finally {
            setLoadingEntities(false);
        }
    };

    const fetchPreviousComplaints = async () => {
        try {
            const token = localStorage.getItem('usertoken');
            
            try {
                // Try to fetch real data if backend is ready
                const response = await axios.get('http://localhost:8080/complaints/user', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (response.data.success) {
                    console.log("Fetched complaints data:", response.data.complaints);
                    
                    // Process complaints to ensure entity names are displayed correctly
                    const enhancedComplaints = response.data.complaints.map(complaint => {
                        let entityName = complaint.entityName || "Unknown";
                        
                        // If entityName is "Unknown" but we have entityId, try to find the name
                        if (entityName === "Unknown" && complaint.entityId) {
                            if (complaint.type === 'seller') {
                                const matchingSeller = sellers.find(s => s._id === complaint.entityId);
                                if (matchingSeller) {
                                    entityName = matchingSeller.shopName || 
                                                 `${matchingSeller.firstName} ${matchingSeller.lastName}`.trim();
                                }
                            } else if (complaint.type === 'instructor') {
                                const matchingInstructor = instructors.find(i => i._id === complaint.entityId);
                                if (matchingInstructor) {
                                    entityName = matchingInstructor.name;
                                }
                            }
                        }
                        
                        // Ensure adminResponse exists and is properly handled
                        const adminResponse = complaint.adminResponse || null;
                        
                        return {
                            ...complaint,
                            entityName: entityName,
                            adminResponse: adminResponse
                        };
                    });
                    
                    console.log("Enhanced complaints with proper entity names and responses:", enhancedComplaints);
                    setPreviousComplaints(enhancedComplaints);
                } else {
                    setPreviousComplaints([]);
                }
            } catch (error) {
                console.error('Error fetching previous complaints:', error);
                setPreviousComplaints([]);
            }
        } catch (error) {
            console.error('Error in fetchPreviousComplaints:', error);
            setPreviousComplaints([]);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleFileChange = (e) => {
        setFormData({
            ...formData,
            attachments: e.target.files[0]
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.entityId || !formData.subject || !formData.description) {
            toast.error('Please fill all required fields');
            return;
        }

        setLoading(true);

        try {
            // Get entity name for the selected entity
            let entityName = "Unknown";
            
            if (formData.type === 'seller') {
                const seller = sellers.find(s => s._id === formData.entityId);
                if (seller) {
                    entityName = seller.shopName || `${seller.firstName} ${seller.lastName}`.trim();
                }
            } else if (formData.type === 'instructor') {
                const instructor = instructors.find(i => i._id === formData.entityId);
                if (instructor) {
                    entityName = instructor.name;
                }
            }
            
            console.log(`Selected ${formData.type} ID: ${formData.entityId}, Name: ${entityName}`);
            
            const token = localStorage.getItem('usertoken');
            const data = new FormData();
            
            data.append('type', formData.type);
            data.append('entityId', formData.entityId);
            data.append('entityName', entityName); // Include entity name in submission
            data.append('subject', formData.subject);
            data.append('description', formData.description);
            data.append('severity', formData.severity);
            
            if (formData.attachments) {
                data.append('attachment', formData.attachments);
            }
            
            // For development testing, add test=true param to bypass entity validation if needed
            const queryParam = process.env.NODE_ENV === 'development' ? '?test=true' : '';
            
            try {
                const response = await fetch(`http://localhost:8080/complaints/submit${queryParam}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: data
                });
                
                if (response.ok) {
                    const responseData = await response.json();
                    if (responseData.success) {
                        // Add the new complaint to the list with the correct entity name
                        const newComplaint = {
                            _id: responseData.complaint_id || `temp-${Date.now()}`,
                            type: formData.type,
                            entityId: formData.entityId,
                            entityName: entityName,
                            subject: formData.subject,
                            description: formData.description,
                            severity: formData.severity,
                            status: 'pending',
                            createdAt: new Date().toISOString(),
                            hasAttachment: !!formData.attachments
                        };
                        
                        setPreviousComplaints(prev => [newComplaint, ...prev]);
                        
                        toast.success('Complaint submitted successfully');
                        
                        // Reset form
                        setFormData({
                            type: 'seller',
                            entityId: '',
                            subject: '',
                            description: '',
                            severity: 'medium',
                            attachments: null
                        });
                        
                        // Switch to history view
                        setViewMode('history');
                    } else {
                        toast.error(responseData.message || 'Failed to submit complaint');
                    }
                } else {
                    // For non-ok responses - handle differently based on status
                    const errorText = await response.text();
                    console.error(`Server returned ${response.status}: ${errorText}`);
                    
                    if (response.status === 404) {
                        // 404 means entity not found - give more specific error
                        toast.error(`The selected ${formData.type} was not found in the system. Please try another.`);
                    } else {
                        toast.error(`Error: ${response.status} - ${response.statusText}`);
                    }
                    
                    // In development mode, create a dummy success response for testing
                    if (process.env.NODE_ENV === 'development') {
                        toast.info('Development mode: Creating mock success response');
                        
                        // For testing purposes, save the complaint locally
                        const mockComplaint = {
                            _id: 'mock-' + Math.random().toString(36).substr(2, 9),
                            type: formData.type,
                            entityId: formData.entityId,
                            entityName: entityName,
                            subject: formData.subject,
                            description: formData.description,
                            severity: formData.severity,
                            status: 'pending',
                            createdAt: new Date().toISOString(),
                            hasAttachment: !!formData.attachments
                        };
                        
                        // Update the component state with the new mock complaint
                        setPreviousComplaints(prev => [mockComplaint, ...prev]);
                        
                        handleSuccessfulSubmission();
                    }
                }
            } catch (error) {
                console.error('API Error:', error);
                
                // For development mode, create a dummy success response
                if (process.env.NODE_ENV === 'development') {
                    toast.info('Development mode: Creating mock success response');
                    handleSuccessfulSubmission();
                } else {
                    toast.error('Failed to connect to the server. Please try again later.');
                }
            }
        } catch (error) {
            console.error('Error submitting complaint:', error);
            toast.error('Failed to submit complaint. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    // Helper function to handle successful submission
    const handleSuccessfulSubmission = () => {
        toast.success('Complaint submitted successfully');
        
        // Reset form
        setFormData({
            type: 'seller',
            entityId: '',
            subject: '',
            description: '',
            severity: 'medium',
            attachments: null
        });
        
        // Refresh complaints list
        fetchPreviousComplaints();
        
        // Switch to history view
        setViewMode('history');
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return <span className="badge bg-warning">Pending</span>;
            case 'in_progress':
                return <span className="badge bg-info">In Progress</span>;
            case 'resolved':
                return <span className="badge bg-success">Resolved</span>;
            case 'rejected':
                return <span className="badge bg-danger">Rejected</span>;
            default:
                return <span className="badge bg-secondary">Pending</span>;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getSeverityBadge = (severity) => {
        switch (severity) {
            case 'low':
                return <span className="badge bg-success">Low</span>;
            case 'medium':
                return <span className="badge bg-warning text-dark">Medium</span>;
            case 'high':
                return <span className="badge bg-danger">High</span>;
            case 'critical':
                return <span className="badge bg-danger">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="me-1" />
                    Critical
                </span>;
            default:
                return <span className="badge bg-secondary">Medium</span>;
        }
    };

    const handleViewDetails = (complaint) => {
        setSelectedComplaint(complaint);
        setShowDetailModal(true);
    };

    const handleViewAttachment = (complaintId) => {
        setShowAttachment(true);
        
        // Determine attachment type based on file extension
        // We'll extract this from the complaint ID for now
        // In a real implementation, you might want to fetch the attachment metadata
        
        // For this example, we'll just assume it's an image
        setAttachmentType('image');
    };

    return (
        <div className="container py-4">
            <h2 className="mb-4">Complaints</h2>
            
            {/* Toggle buttons */}
            <div className="d-flex mb-4">
                <button 
                    className={`btn ${viewMode === 'new' ? 'btn-primary' : 'btn-outline-primary'} me-2`}
                    onClick={() => setViewMode('new')}
                >
                    <FontAwesomeIcon icon={faPaperPlane} className="me-2" />
                    Submit New Complaint
                </button>
                <button 
                    className={`btn ${viewMode === 'history' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setViewMode('history')}
                >
                    <FontAwesomeIcon icon={faHistory} className="me-2" />
                    Complaint History
                </button>
            </div>
            
            {viewMode === 'new' ? (
                <div className="card">
                    <div className="card-header bg-light">
                        <h5 className="mb-0">Submit a New Complaint</h5>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label">Complaint About</label>
                                <select 
                                    name="type"
                                    className="form-select"
                                    value={formData.type}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="seller">Seller</option>
                                    <option value="instructor">Instructor</option>
                                </select>
                            </div>
                            
                            <div className="mb-3">
                                <label className="form-label">Select {formData.type === 'seller' ? 'Seller' : 'Instructor'}</label>
                                {loadingEntities ? (
                                    <div className="text-center py-2">
                                        <div className="spinner-border spinner-border-sm" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <span className="ms-2">Loading...</span>
                                    </div>
                                ) : (
                                    <select 
                                        name="entityId"
                                        className="form-select"
                                        value={formData.entityId}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">-- Select {formData.type === 'seller' ? 'Seller' : 'Instructor'} --</option>
                                        {formData.type === 'seller' ? (
                                            sellers.map(seller => (
                                                <option key={seller._id} value={seller._id}>
                                                    {seller.shopName || 'Unknown'} ({seller.firstName} {seller.lastName})
                                                </option>
                                            ))
                                        ) : (
                                            instructors.map(instructor => (
                                                <option key={instructor._id} value={instructor._id}>
                                                    {instructor.name || 'Unknown'} {instructor.expertise ? `- ${instructor.expertise}` : ''}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                )}
                            </div>
                            
                            <div className="mb-3">
                                <label className="form-label">Subject</label>
                                <input 
                                    type="text"
                                    name="subject"
                                    className="form-control"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    placeholder="Enter complaint subject"
                                    required
                                />
                            </div>
                            
                            <div className="mb-3">
                                <label className="form-label">Description</label>
                                <textarea 
                                    name="description"
                                    className="form-control"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="5"
                                    placeholder="Please provide detailed information about your complaint"
                                    required
                                ></textarea>
                            </div>
                            
                            <div className="mb-3">
                                <label className="form-label">Severity</label>
                                <select 
                                    name="severity"
                                    className="form-select"
                                    value={formData.severity}
                                    onChange={handleChange}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                            
                            <div className="mb-3">
                                <label className="form-label">Attachment (Optional)</label>
                                <input 
                                    type="file"
                                    name="attachments"
                                    className="form-control"
                                    onChange={handleFileChange}
                                    accept="image/*,.pdf,.doc,.docx"
                                />
                                <small className="text-muted">
                                    You can upload images, PDFs, or documents as evidence
                                </small>
                            </div>
                            
                            <button 
                                type="submit" 
                                className="btn btn-primary"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <FontAwesomeIcon icon={faPaperPlane} className="me-2" />
                                        Submit Complaint
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="card">
                    <div className="card-header bg-light">
                        <h5 className="mb-0">Complaint History</h5>
                    </div>
                    <div className="card-body">
                        {previousComplaints.length > 0 ? (
                            <div className="table-responsive">
                                <table className="table table-hover">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Date</th>
                                            <th>Subject</th>
                                            <th>About</th>
                                            <th>Status</th>
                                            <th>Admin Response</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previousComplaints.map(complaint => (
                                            <tr key={complaint._id} style={{cursor: 'pointer'}} onClick={() => handleViewDetails(complaint)}>
                                                <td>{formatDate(complaint.createdAt)}</td>
                                                <td>{complaint.subject}</td>
                                                <td>
                                                    {complaint.type === 'seller' ? 'Seller: ' : 'Instructor: '}
                                                    {complaint.entityName || 'Unknown'}
                                                </td>
                                                <td>{getStatusBadge(complaint.status)}</td>
                                                <td>
                                                    {complaint.adminResponse ? (
                                                        <span className="text-success">
                                                            <FontAwesomeIcon icon={faCheck} className="me-1" />
                                                            Responded
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted">
                                                            <FontAwesomeIcon icon={faTimes} className="me-1" />
                                                            No response yet
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    <button 
                                                        className="btn btn-sm btn-outline-primary"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleViewDetails(complaint);
                                                        }}
                                                    >
                                                        View Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <FontAwesomeIcon icon={faCheck} className="text-success fs-1 mb-3" />
                                <p className="lead">You haven't submitted any complaints yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Complaint Detail Modal */}
            {showDetailModal && selectedComplaint && (
                <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Complaint Details</h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={() => setShowDetailModal(false)}
                                    aria-label="Close"
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="row mb-4">
                                    <div className="col-md-6">
                                        <p><strong>Type:</strong> {selectedComplaint.type === 'seller' ? 'Seller' : 'Instructor'}</p>
                                        <p><strong>About:</strong> {selectedComplaint.entityName || 'Unknown'}</p>
                                        <p><strong>Created:</strong> {formatDate(selectedComplaint.createdAt)}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <p><strong>Status:</strong> {getStatusBadge(selectedComplaint.status)}</p>
                                        <p><strong>Severity:</strong> {getSeverityBadge(selectedComplaint.severity)}</p>
                                        <p><strong>Last Updated:</strong> {formatDate(selectedComplaint.updatedAt) || 'Not updated yet'}</p>
                                    </div>
                                </div>

                                <div className="card mb-4">
                                    <div className="card-header bg-light">
                                        <h6 className="mb-0">{selectedComplaint.subject}</h6>
                                    </div>
                                    <div className="card-body">
                                        <p className="complaint-description">{selectedComplaint.description}</p>
                                    </div>
                                </div>

                                {selectedComplaint.hasAttachment && (
                                    <div className="mb-4">
                                        <h6 className="mb-2">Attachment:</h6>
                                        <button 
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => handleViewAttachment(selectedComplaint._id)}
                                        >
                                            View Attachment
                                        </button>
                                    </div>
                                )}

                                {/* Attachment Viewer */}
                                {showAttachment && selectedComplaint && (
                                    <div className="attachment-viewer mb-4">
                                        <div className="card">
                                            <div className="card-header bg-light d-flex justify-content-between align-items-center">
                                                <h6 className="mb-0">Attachment</h6>
                                                <button 
                                                    className="btn btn-sm btn-outline-secondary"
                                                    onClick={() => setShowAttachment(false)}
                                                >
                                                    <FontAwesomeIcon icon={faTimes} />
                                                </button>
                                            </div>
                                            <div className="card-body text-center">
                                                {attachmentType === 'image' ? (
                                                    <img 
                                                        src={`http://localhost:8080/complaints/view-attachment/${selectedComplaint._id}`} 
                                                        alt="Complaint Attachment" 
                                                        className="attachment-image img-fluid" 
                                                        style={{ maxHeight: '400px' }}
                                                        onError={(e) => {
                                                            console.error("Image failed to load");
                                                            e.target.onerror = null;
                                                            e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect fill='%23f8f9fa' width='100' height='100'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='14' dy='.3em' text-anchor='middle' x='50' y='50'%3EImage not available%3C/text%3E%3C/svg%3E";
                                                        }}
                                                    />
                                                ) : attachmentType === 'pdf' ? (
                                                    <div className="pdf-container">
                                                        <iframe
                                                            src={`http://localhost:8080/complaints/view-attachment/${selectedComplaint._id}`}
                                                            width="100%"
                                                            height="500px"
                                                            title="PDF Viewer"
                                                            className="pdf-frame"
                                                        ></iframe>
                                                    </div>
                                                ) : (
                                                    <div className="document-preview p-4">
                                                        <p className="mb-1">This type of file cannot be previewed directly in the browser.</p>
                                                        <div className="mt-3">
                                                            <a 
                                                                href={`http://localhost:8080/complaints/view-attachment/${selectedComplaint._id}`}
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="btn btn-primary"
                                                                download
                                                            >
                                                                Download File
                                                            </a>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="card">
                                    <div className="card-header bg-light">
                                        <h6 className="mb-0">Admin Response</h6>
                                    </div>
                                    <div className="card-body">
                                        {selectedComplaint.adminResponse ? (
                                            <div className="admin-response">
                                                <p className="mb-0">{selectedComplaint.adminResponse}</p>
                                            </div>
                                        ) : (
                                            <div className="text-center py-3">
                                                <p className="text-muted mb-0">No response from admin yet.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary" 
                                    onClick={() => setShowDetailModal(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal backdrop */}
            {showDetailModal && (
                <div className="modal-backdrop fade show"></div>
            )}

            <style jsx>{`
                .complaint-description {
                    white-space: pre-line;
                }
                .admin-response {
                    background-color: #f8f9fa;
                    border-left: 4px solid #3a1d6e;
                    padding: 15px;
                    border-radius: 4px;
                }
                .modal {
                    background-color: rgba(0, 0, 0, 0.5);
                }
            `}</style>
        </div>
    );
};

export default UserComplaints;
