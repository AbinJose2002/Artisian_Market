import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheck, faTimes, faEye, faSpinner, faCommentDots, 
  faExclamationTriangle, faInfoCircle, faFileAlt, faFileImage,
  faFilePdf, faFileWord, faFile, faDownload
} from '@fortawesome/free-solid-svg-icons';

const AdminComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [adminResponse, setAdminResponse] = useState('');
  const [responseStatus, setResponseStatus] = useState('in_progress');
  const [processingId, setProcessingId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState(null);
  const [attachmentType, setAttachmentType] = useState('unknown');
  const [showAttachment, setShowAttachment] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, [filter]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admintoken');
      
      try {
        const response = await axios.get('http://localhost:8080/complaints/admin/list', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          setComplaints(response.data.complaints);
        } else {
          // If API fails, use mock data for development
          const mockComplaints = [
            {
              _id: '1',
              user_identity: 'user@example.com',
              type: 'seller',
              entityId: '123',
              entityName: 'Art Shop',
              subject: 'Product not as described',
              description: 'The painting I received was not as shown in the photo.',
              severity: 'medium',
              status: 'pending',
              createdAt: new Date().toISOString(),
              hasAttachment: false
            },
            {
              _id: '2',
              user_identity: 'another@example.com',
              type: 'instructor',
              entityId: '456',
              entityName: 'John Smith',
              subject: 'Class cancelled without notice',
              description: 'The instructor cancelled the class without any prior notice.',
              severity: 'high',
              status: 'in_progress',
              createdAt: new Date(Date.now() - 86400000).toISOString(),
              hasAttachment: true
            }
          ];
          setComplaints(mockComplaints);
          console.log('Using mock complaint data');
        }
      } catch (error) {
        console.error('Error fetching complaints:', error);
        // Use mock data in case of error
        setComplaints([]);
      }
    } catch (error) {
      console.error('Error loading complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (complaint) => {
    setSelectedComplaint(complaint);
    setShowDetailModal(true);
    setAdminResponse(complaint.adminResponse || '');
    setResponseStatus(complaint.status || 'pending');
    
    // Reset attachment state
    setAttachmentUrl(null);
    setAttachmentType('unknown');
    setShowAttachment(false);
    
    // If complaint has attachment, fetch it
    if (complaint.hasAttachment) {
      fetchAttachment(complaint._id);
    }
  };

  const fetchAttachment = async (complaintId) => {
    try {
      // Use the public endpoint that doesn't require authentication
      const response = await axios.get(`http://localhost:8080/complaints/public-attachment/${complaintId}`);
      
      if (response.data.success) {
        console.log("Attachment data:", response.data);
        setAttachmentUrl(response.data.attachmentUrl);
        
        // Determine attachment type based on filename
        const fileName = response.data.filename || '';
        const fileExt = fileName.split('.').pop().toLowerCase();
        
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExt)) {
          setAttachmentType('image');
        } else if (fileExt === 'pdf') {
          setAttachmentType('pdf');
        } else if (['doc', 'docx'].includes(fileExt)) {
          setAttachmentType('word');
        } else {
          setAttachmentType('other');
        }
        
        // Auto-show attachment
        setShowAttachment(true);
      } else {
        toast.error('Failed to fetch attachment');
      }
    } catch (error) {
      console.error('Error fetching attachment:', error);
      toast.error('Failed to load attachment');
    }
  };

  const getAttachmentType = (url) => {
    if (!url) return 'unknown';
    
    const extension = url.split('.').pop().toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
      return 'image';
    } else if (extension === 'pdf') {
      return 'pdf';
    } else if (['doc', 'docx'].includes(extension)) {
      return 'word';
    } else {
      return 'other';
    }
  };

  const getAttachmentIcon = (type) => {
    switch (type) {
      case 'image':
        return <FontAwesomeIcon icon={faFileImage} />;
      case 'pdf':
        return <FontAwesomeIcon icon={faFilePdf} />;
      case 'word':
        return <FontAwesomeIcon icon={faFileWord} />;
      default:
        return <FontAwesomeIcon icon={faFile} />;
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedComplaint) return;

    try {
      setProcessingId(selectedComplaint._id);
      const token = localStorage.getItem('admintoken');
      
      try {
        const response = await axios.put(
          `http://localhost:8080/complaints/admin/update/${selectedComplaint._id}`,
          {
            status: responseStatus,
            adminResponse: adminResponse
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (response.data.success) {
          toast.success('Complaint updated successfully');
          setShowDetailModal(false);
          fetchComplaints();
        } else {
          toast.error(response.data.message || 'Failed to update complaint');
        }
      } catch (error) {
        console.error('API error updating complaint:', error);
        // For development mode
        toast.success('Demo: Complaint would be updated in production');
        setShowDetailModal(false);
        // Update complaint in our local state for demo
        const updatedComplaints = complaints.map(c => 
          c._id === selectedComplaint._id 
            ? {...c, status: responseStatus, adminResponse: adminResponse} 
            : c
        );
        setComplaints(updatedComplaints);
      }
    } catch (error) {
      console.error('Error updating complaint:', error);
      toast.error('Failed to update complaint');
    } finally {
      setProcessingId(null);
    }
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
          <FontAwesomeIcon icon={faExclamationTriangle} className="me-1" /> Critical
        </span>;
      default:
        return <span className="badge bg-secondary">Medium</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="badge bg-warning text-dark">Pending</span>;
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
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getComplaintTypeIcon = (type) => {
    return type === 'seller' ? 
      <span className="badge bg-primary">Seller</span> : 
      <span className="badge bg-info">Instructor</span>;
  };

  // Filter and search functionality
  const filteredComplaints = complaints.filter(complaint => {
    // Filter by status
    if (filter !== 'all' && complaint.status !== filter) {
      return false;
    }

    // Search by subject, description, or entity name
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        (complaint.subject && complaint.subject.toLowerCase().includes(query)) ||
        (complaint.description && complaint.description.toLowerCase().includes(query)) ||
        (complaint.entityName && complaint.entityName.toLowerCase().includes(query))
      );
    }

    return true;
  });

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">Complaints Management</h2>

      {/* Filters and search */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="btn-group" role="group">
            <button 
              className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button 
              className={`btn ${filter === 'pending' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilter('pending')}
            >
              Pending
            </button>
            <button 
              className={`btn ${filter === 'in_progress' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilter('in_progress')}
            >
              In Progress
            </button>
            <button 
              className={`btn ${filter === 'resolved' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilter('resolved')}
            >
              Resolved
            </button>
            <button 
              className={`btn ${filter === 'rejected' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilter('rejected')}
            >
              Rejected
            </button>
          </div>
        </div>
        <div className="col-md-6">
          <input
            type="text"
            className="form-control"
            placeholder="Search complaints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading complaints...</p>
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="alert alert-info">
          <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
          No complaints found.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover table-bordered">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>About</th>
                <th>Subject</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredComplaints.map(complaint => (
                <tr key={complaint._id}>
                  <td>{complaint._id.substring(0, 8)}...</td>
                  <td>{getComplaintTypeIcon(complaint.type)}</td>
                  <td>{complaint.entityName || 'Unknown'}</td>
                  <td>{complaint.subject}</td>
                  <td>{getSeverityBadge(complaint.severity)}</td>
                  <td>{getStatusBadge(complaint.status)}</td>
                  <td>{formatDate(complaint.createdAt)}</td>
                  <td>
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={() => handleViewDetails(complaint)}
                    >
                      <FontAwesomeIcon icon={faEye} className="me-1" /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
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
                    <p><strong>Type:</strong> {getComplaintTypeIcon(selectedComplaint.type)}</p>
                    <p><strong>About:</strong> {selectedComplaint.entityName || 'Unknown'}</p>
                    <p><strong>Submitted By:</strong> {selectedComplaint.user_identity}</p>
                    <p><strong>Created:</strong> {formatDate(selectedComplaint.createdAt)}</p>
                  </div>
                  <div className="col-md-6">
                    <p><strong>Status:</strong> {getStatusBadge(selectedComplaint.status)}</p>
                    <p><strong>Severity:</strong> {getSeverityBadge(selectedComplaint.severity)}</p>
                    <p><strong>Last Updated:</strong> {formatDate(selectedComplaint.updatedAt) || 'Not updated yet'}</p>
                    <p>
                      <strong>Attachment:</strong> {selectedComplaint.hasAttachment ? (
                        <button 
                          className="btn btn-sm btn-outline-primary ms-2"
                          onClick={() => setShowAttachment(!showAttachment)}
                        >
                          {getAttachmentIcon(attachmentType)} {showAttachment ? 'Hide Attachment' : 'View Attachment'}
                        </button>
                      ) : 'None'}
                    </p>
                  </div>
                </div>

                {/* Attachment Viewer */}
                {showAttachment && attachmentUrl && (
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
                              console.error("Image failed to load:", attachmentUrl);
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
                            <div className="mb-3">
                              {getAttachmentIcon(attachmentType)}
                              <span className="fs-5 ms-2">Document Attachment</span>
                            </div>
                            <p className="mb-1">This type of file cannot be previewed directly in the browser.</p>
                            <div className="mt-3">
                              <a 
                                href={`http://localhost:8080/complaints/view-attachment/${selectedComplaint._id}`}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="btn btn-primary"
                                download
                              >
                                <FontAwesomeIcon icon={faDownload} className="me-1" />
                                Download File
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="card mb-4">
                  <div className="card-header">
                    <h6 className="mb-0">{selectedComplaint.subject}</h6>
                  </div>
                  <div className="card-body">
                    <p className="complaint-description">{selectedComplaint.description}</p>
                  </div>
                </div>

                <h6 className="mb-3">Admin Response:</h6>
                <div className="mb-3">
                  <select 
                    className="form-select"
                    value={responseStatus}
                    onChange={(e) => setResponseStatus(e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className="mb-3">
                  <textarea 
                    className="form-control"
                    rows="4"
                    placeholder="Enter your response to the complainant"
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                  ></textarea>
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
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleStatusUpdate}
                  disabled={processingId === selectedComplaint._id}
                >
                  {processingId === selectedComplaint._id ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin className="me-1" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCommentDots} className="me-1" />
                      Update Complaint
                    </>
                  )}
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
        .modal {
          background-color: rgba(0, 0, 0, 0.5);
        }
        .badge {
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

export default AdminComplaints;
