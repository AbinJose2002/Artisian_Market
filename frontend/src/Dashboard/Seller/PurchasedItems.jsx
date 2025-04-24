import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faDownload, faPalette, faTools } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';

const PurchasedItems = () => {
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    
    const sellerToken = localStorage.getItem('sellertoken');

    useEffect(() => {
        fetchPurchases();
    }, []);

    const fetchPurchases = async () => {
        try {
            setLoading(true);
            console.log("Fetching seller purchases...");
            const response = await axios.get('http://localhost:8080/order/seller-purchases', {
                headers: { 
                    Authorization: `Bearer ${sellerToken}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log("Purchases response:", response.data);
            
            if (response.data.success) {
                // Ensure each order has required fields
                const processedOrders = response.data.orders.map(order => ({
                    ...order,
                    items: order.items || [],
                    total_amount: order.total_amount || 0,
                    created_at: order.created_at || new Date().toISOString(),
                    status: order.status || 'completed'
                }));
                
                setPurchases(processedOrders);
            }
        } catch (error) {
            console.error("Error fetching purchases:", error);
            toast.error("Failed to load purchase history");
        } finally {
            setLoading(false);
        }
    };

    const viewOrderDetails = (order) => {
        setSelectedOrder(order);
        setShowDetailsModal(true);
    };

    const downloadInvoice = (orderId) => {
        try {
            const token = localStorage.getItem('sellertoken');
            
            // Create an anchor element and set it to download the invoice
            const downloadLink = document.createElement('a');
            downloadLink.href = `http://localhost:8080/order/invoice/${orderId}`;
            downloadLink.download = `invoice_${orderId.slice(0, 8)}.pdf`;
            
            // Set the Authorization header using fetch
            fetch(downloadLink.href, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            .then(response => {
                if (response.ok) {
                    return response.blob();
                }
                throw new Error('Failed to download invoice');
            })
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                downloadLink.href = url;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(downloadLink);
                
                toast.success('Invoice downloaded successfully');
            })
            .catch(error => {
                console.error('Error downloading invoice:', error);
                toast.error('Failed to download invoice');
            });
        } catch (error) {
            console.error('Error setting up invoice download:', error);
            toast.error('Failed to download invoice');
        }
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const getItemTypeIcon = (itemType) => {
        if (itemType === 'product') {
            return <FontAwesomeIcon icon={faPalette} className="text-primary me-2" />;
        } else if (itemType === 'material') {
            return <FontAwesomeIcon icon={faTools} className="text-success me-2" />;
        }
        return null;
    };

    if (loading) {
        return (
            <div className="container mt-4">
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Loading your purchase history...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <h2 className="mb-4">My Purchase History</h2>
            
            {purchases.length === 0 ? (
                <div className="alert alert-info text-center">
                    <p className="mb-0">You haven't purchased any items yet.</p>
                </div>
            ) : (
                <>
                    {purchases.filter(order => order.items.length > 0).length === 0 ? (
                        <div className="alert alert-info text-center">
                            <p className="mb-0">You haven't purchased any items yet.</p>
                        </div>
                    ) : (
                        <div className="card">
                            <div className="card-header bg-white">
                                <div className="row fw-bold">
                                    <div className="col-md-2">Order ID</div>
                                    <div className="col-md-2">Date</div>
                                    <div className="col-md-3">Items</div>
                                    <div className="col-md-2">Total Amount</div>
                                    <div className="col-md-1">Status</div>
                                    <div className="col-md-2">Actions</div>
                                </div>
                            </div>
                            <div className="card-body p-0">
                                {purchases.map((order) => (
                                    <div key={order._id} className="row border-bottom p-3 align-items-center">
                                        <div className="col-md-2 text-muted">{order._id.slice(0, 8)}</div>
                                        <div className="col-md-2">{formatDate(order.created_at)}</div>
                                        <div className="col-md-3">
                                            {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                                        </div>
                                        <div className="col-md-2">₹{order.total_amount}</div>
                                        <div className="col-md-1">
                                            <span className="badge bg-success">{order.status}</span>
                                        </div>
                                        <div className="col-md-2">
                                            <button 
                                                className="btn btn-sm btn-outline-primary me-2"
                                                onClick={() => viewOrderDetails(order)}
                                            >
                                                <FontAwesomeIcon icon={faEye} /> View
                                            </button>
                                            <button 
                                                className="btn btn-sm btn-outline-secondary"
                                                onClick={() => downloadInvoice(order._id)}
                                            >
                                                <FontAwesomeIcon icon={faDownload} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Order Details Modal */}
            {showDetailsModal && selectedOrder && (
                <div className="modal fade show d-block" tabIndex="-1">
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Order Details #{selectedOrder._id.slice(0, 8)}</h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={() => setShowDetailsModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="row mb-4">
                                    <div className="col-md-6">
                                        <p><strong>Order Date:</strong> {formatDate(selectedOrder.created_at)}</p>
                                        <p><strong>Status:</strong> <span className="badge bg-success">{selectedOrder.status}</span></p>
                                    </div>
                                    <div className="col-md-6">
                                        <p><strong>Payment ID:</strong> {selectedOrder.payment_id.slice(-8)}</p>
                                        <p><strong>Total Amount:</strong> ₹{selectedOrder.total_amount}</p>
                                    </div>
                                </div>
                                
                                <h6 className="mb-3">Purchased Items</h6>
                                <div className="table-responsive">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Item</th>
                                                <th>Category</th>
                                                <th>Price</th>
                                                <th>Type</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedOrder.items.map((item, index) => (
                                                <tr key={index}>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            {getItemTypeIcon(item.itemType)}
                                                            <span>{item.name}</span>
                                                        </div>
                                                    </td>
                                                    <td>{item.category || 'N/A'}</td>
                                                    <td>₹{item.price}</td>
                                                    <td>{item.itemType === 'product' ? 'Art Product' : 'Craft Material'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    className="btn btn-outline-secondary"
                                    onClick={() => downloadInvoice(selectedOrder._id)}
                                >
                                    <FontAwesomeIcon icon={faDownload} className="me-2" />
                                    Download Invoice
                                </button>
                                <button 
                                    className="btn btn-primary" 
                                    onClick={() => setShowDetailsModal(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .modal {
                    background-color: rgba(0, 0, 0, 0.5);
                }
                
                .badge.bg-success {
                    background-color: #2d5a27 !important;
                }
                
                .btn-outline-primary {
                    color: #3a1d6e;
                    border-color: #3a1d6e;
                }
                
                .btn-outline-primary:hover {
                    background-color: #3a1d6e;
                    color: white;
                }
            `}</style>
        </div>
    );
};

export default PurchasedItems;
