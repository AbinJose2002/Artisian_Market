import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faTimes, faPaperPlane } from '@fortawesome/free-solid-svg-icons';

function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showComplaintModal, setShowComplaintModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [complaintData, setComplaintData] = useState({
        subject: '',
        description: '',
        severity: 'medium',
        attachments: null
    });
    const [submittingComplaint, setSubmittingComplaint] = useState(false);

    const ORDER_STATUSES = ['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'];

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem('sellertoken');
            const response = await axios.get('http://localhost:8080/order/seller/orders', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setOrders(response.data.orders);
            }
        } catch (err) {
            setError('Failed to load orders');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const token = localStorage.getItem('sellertoken');
            const response = await axios.put(
                `http://localhost:8080/order/seller/update-status/${orderId}`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setOrders(orders.map(order => 
                    order.order_id === orderId 
                        ? { ...order, status: newStatus }
                        : order
                ));
                toast.success('Order status updated successfully');
            }
        } catch (error) {
            toast.error('Failed to update order status');
            console.error('Error:', error);
        }
    };

    const openComplaintModal = (order) => {
        setSelectedOrder(order);
        setComplaintData({
            subject: `Complaint regarding Order #${order.order_id.slice(-6)}`,
            description: '',
            severity: 'medium',
            attachments: null
        });
        setShowComplaintModal(true);
    };

    const handleComplaintChange = (e) => {
        const { name, value } = e.target;
        setComplaintData({
            ...complaintData,
            [name]: value
        });
    };

    const handleFileChange = (e) => {
        setComplaintData({
            ...complaintData,
            attachments: e.target.files[0]
        });
    };

    const submitComplaint = async () => {
        if (!complaintData.subject || !complaintData.description) {
            toast.error('Please fill all required fields');
            return;
        }

        setSubmittingComplaint(true);

        try {
            const token = localStorage.getItem('sellertoken');
            const formData = new FormData();
            
            formData.append('type', 'user');
            formData.append('entityId', selectedOrder.customer_email);
            formData.append('entityName', selectedOrder.customer_email); // Use customer email as name
            formData.append('subject', complaintData.subject);
            formData.append('description', complaintData.description);
            formData.append('severity', complaintData.severity);
            
            if (complaintData.attachments) {
                formData.append('attachment', complaintData.attachments);
            }
            
            const response = await fetch('http://localhost:8080/complaints/submit', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    toast.success('Complaint submitted successfully');
                    setShowComplaintModal(false);
                } else {
                    toast.error(data.message || 'Failed to submit complaint');
                }
            } else {
                toast.error(`Error: ${response.status} - ${response.statusText}`);
            }
        } catch (error) {
            console.error('Error submitting complaint:', error);
            toast.error('Failed to submit complaint. Please try again later.');
        } finally {
            setSubmittingComplaint(false);
        }
    };

    if (loading) return <div className="text-center py-5">Loading...</div>;
    if (error) return <div className="text-center py-5 text-danger">{error}</div>;

    return (
        <div className="container py-4">
            <h2 className="mb-4">Order Management</h2>
            {orders.length === 0 ? (
                <div className="alert alert-info">No orders found</div>
            ) : (
                <div className="row">
                    {orders.map(order => (
                        <div key={order.order_id} className="col-12 mb-4">
                            <div className="card card-custom">
                                <div className="card-header" style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <h5 className="mb-0">Order #{order.order_id.slice(-6)}</h5>
                                        <div className="d-flex align-items-center">
                                            <select 
                                                className="form-select me-2"
                                                value={order.status}
                                                onChange={(e) => updateOrderStatus(order.order_id, e.target.value)}
                                            >
                                                {ORDER_STATUSES.map(status => (
                                                    <option key={status} value={status}>
                                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                                    </option>
                                                ))}
                                            </select>
                                            <span className={`badge bg-${
                                                order.status === 'delivered' ? 'success' :
                                                order.status === 'cancelled' ? 'danger' :
                                                'primary'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="card-body">
                                    <div className="row mb-3">
                                        <div className="col-md-6">
                                            <p><strong>Customer:</strong> {order.customer_email}</p>
                                            <p><strong>Order Date:</strong> {order.created_at}</p>
                                        </div>
                                        <div className="col-md-6">
                                            <p><strong>Total Amount:</strong> ₹{order.total_amount}</p>
                                            <p><strong>Items:</strong> {order.items.length}</p>
                                        </div>
                                    </div>
                                    <div className="table-responsive">
                                        <table className="table table-bordered">
                                            <thead>
                                                <tr>
                                                    <th>Item</th>
                                                    <th>Price</th>
                                                    <th>Quantity</th>
                                                    <th>Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {order.items.map((item, index) => (
                                                    <tr key={index}>
                                                        <td>
                                                            <div className="d-flex align-items-center">
                                                                <img 
                                                                    src={item.image} 
                                                                    alt={item.name}
                                                                    style={{
                                                                        width: '50px',
                                                                        height: '50px',
                                                                        objectFit: 'cover',
                                                                        marginRight: '10px'
                                                                    }}
                                                                />
                                                                {item.name}
                                                            </div>
                                                        </td>
                                                        <td>₹{item.price}</td>
                                                        <td>{item.quantity}</td>
                                                        <td>₹{item.price * item.quantity}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    
                                    {/* Add the Report Customer button */}
                                    <div className="mt-3 text-end">
                                        <button 
                                            className="btn btn-outline-danger"
                                            onClick={() => openComplaintModal(order)}
                                        >
                                            <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                                            Report Customer
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Complaint Modal */}
            {showComplaintModal && selectedOrder && (
                <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Report Customer: {selectedOrder.customer_email}</h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={() => setShowComplaintModal(false)}
                                    aria-label="Close"
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="alert alert-info">
                                    <p className="mb-0">Submit a report about issues with this customer or order. This will be reviewed by our admin team.</p>
                                </div>
                                
                                <div className="mb-3">
                                    <label className="form-label">Subject</label>
                                    <input 
                                        type="text"
                                        name="subject"
                                        className="form-control"
                                        value={complaintData.subject}
                                        onChange={handleComplaintChange}
                                        placeholder="Brief subject for your complaint"
                                        required
                                    />
                                </div>
                                
                                <div className="mb-3">
                                    <label className="form-label">Description</label>
                                    <textarea 
                                        name="description"
                                        className="form-control"
                                        value={complaintData.description}
                                        onChange={handleComplaintChange}
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
                                        value={complaintData.severity}
                                        onChange={handleComplaintChange}
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
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary" 
                                    onClick={() => setShowComplaintModal(false)}
                                >
                                    <FontAwesomeIcon icon={faTimes} className="me-1" />
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-primary"
                                    onClick={submitComplaint}
                                    disabled={submittingComplaint}
                                >
                                    {submittingComplaint ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <FontAwesomeIcon icon={faPaperPlane} className="me-1" />
                                            Submit Report
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Backdrop */}
            {showComplaintModal && (
                <div className="modal-backdrop fade show"></div>
            )}
        </div>
    );
}

export default Orders;
