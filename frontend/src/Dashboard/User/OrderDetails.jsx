import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faPalette, faTools } from '@fortawesome/free-solid-svg-icons';

const OrderDetails = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                console.log("Fetching user orders...");
                const token = localStorage.getItem('usertoken');
                const response = await axios.get(
                    'http://localhost:8080/order/user/orders',
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                
                console.log("Orders API response:", response.data);
                
                if (response.data.success) {
                    // Process the orders to ensure they have the required structure
                    const processedOrders = response.data.orders.map(order => {
                        // Ensure all items are properly processed and have a type
                        const processedItems = [];
                        
                        // Process regular items (products)
                        if (order.items && Array.isArray(order.items)) {
                            console.log(`Order ${order._id} has ${order.items.length} product items`);
                            
                            order.items.forEach(item => {
                                processedItems.push({
                                    ...item,
                                    itemType: 'product'
                                });
                            });
                        }
                        
                        // Process material items
                        if (order.material_items && Array.isArray(order.material_items)) {
                            console.log(`Order ${order._id} has ${order.material_items.length} material items`);
                            
                            order.material_items.forEach(item => {
                                processedItems.push({
                                    ...item,
                                    itemType: 'material'
                                });
                            });
                        }
                        
                        return {
                            ...order,
                            processedItems: processedItems,
                        };
                    });
                    
                    console.log("Processed orders:", processedOrders);
                    setOrders(processedOrders);
                }
            } catch (err) {
                console.error('Error fetching orders:', err);
                setError('Failed to load your orders');
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    const downloadInvoice = (orderId) => {
        try {
            const token = localStorage.getItem('usertoken');
            
            // Create anchor element for download
            const downloadLink = document.createElement('a');
            downloadLink.href = `http://localhost:8080/order/invoice/${orderId}`;
            
            // Use fetch with authentication
            fetch(downloadLink.href, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(response => {
                if (response.ok) return response.blob();
                throw new Error('Failed to download invoice');
            })
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                downloadLink.href = url;
                downloadLink.download = `invoice_${orderId.slice(0, 8)}.pdf`;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(downloadLink);
            })
            .catch(error => console.error('Error downloading invoice:', error));
        } catch (error) {
            console.error('Error setting up invoice download:', error);
        }
    };

    // Helper to get item icon based on type
    const getItemTypeIcon = (itemType) => {
        if (itemType === 'product') {
            return <FontAwesomeIcon icon={faPalette} className="text-primary me-2" />;
        } else if (itemType === 'material') {
            return <FontAwesomeIcon icon={faTools} className="text-success me-2" />;
        }
        return null;
    };

    // Format date for better display
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    if (loading) return <div className="text-center py-5">Loading...</div>;
    if (error) return <div className="text-center py-5 text-danger">{error}</div>;

    return (
        <div className="container py-4">
            <h2 className="mb-4">My Orders</h2>
            {orders.length === 0 ? (
                <div className="alert alert-info">
                    You haven't placed any orders yet.
                </div>
            ) : (
                <div className="row g-4">
                    {orders.map(order => {
                        // Use processedItems instead of combining in the render method
                        const allItems = order.processedItems || [];
                        
                        console.log(`Rendering order ${order._id || 'unknown'} with ${allItems.length} items`);
                        
                        // Calculate total if not provided
                        const totalAmount = order.total_amount || 
                            allItems.reduce((sum, item) => sum + parseFloat(item.price || 0), 0);
                            
                        const orderId = order._id || order.order_id;
                        
                        return (
                            <div key={orderId} className="col-12 mb-4">
                                <div className="card shadow-sm">
                                    <div className="card-header d-flex justify-content-between align-items-center bg-light">
                                        <h5 className="mb-0">Order #{orderId?.slice(-6) || 'N/A'}</h5>
                                        <div>
                                            <span className={`badge bg-${order.status === 'completed' ? 'success' : 'warning'} me-2`}>
                                                {order.status || 'Completed'}
                                            </span>
                                            <button 
                                                className="btn btn-sm btn-outline-secondary"
                                                onClick={() => downloadInvoice(orderId)}
                                                title="Download Invoice"
                                            >
                                                <FontAwesomeIcon icon={faDownload} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="card-body">
                                        {/* Show debug info if no items */}
                                        {allItems.length === 0 && (
                                            <div className="alert alert-warning">
                                                <p>This order has no items to display.</p>
                                                <p>Order data: {JSON.stringify({
                                                    id: orderId,
                                                    hasItems: Boolean(order.items && order.items.length),
                                                    hasMaterialItems: Boolean(order.material_items && order.material_items.length)
                                                })}</p>
                                            </div>
                                        )}
                                        
                                        <div className="row">
                                            {allItems.map((item, index) => (
                                                <div key={index} className="col-md-6 mb-3">
                                                    <div className="d-flex align-items-center p-2 border rounded">
                                                        {/* Show placeholder if image is missing */}
                                                        {item.image ? (
                                                            <img 
                                                                src={item.image} 
                                                                alt={item.name}
                                                                style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                                                                className="me-3 rounded"
                                                            />
                                                        ) : (
                                                            <div 
                                                                style={{ width: '60px', height: '60px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                                                                className="me-3 rounded"
                                                            >
                                                                No img
                                                            </div>
                                                        )}
                                                        <div className="flex-grow-1">
                                                            <h6 className="mb-0 d-flex align-items-center">
                                                                {getItemTypeIcon(item.itemType)}
                                                                {item.name || "Unnamed Item"}
                                                            </h6>
                                                            <p className="mb-0 text-muted">₹{item.price || 0}</p>
                                                            <small className="text-muted">
                                                                {item.itemType === 'product' ? 'Art Product' : 'Craft Material'}
                                                            </small>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <hr />
                                        <div className="row mt-3">
                                            <div className="col-md-6">
                                                <p className="mb-1"><strong>Order Date:</strong></p>
                                                <p>{formatDate(order.created_at)}</p>
                                            </div>
                                            <div className="col-md-6 text-md-end">
                                                <p className="mb-1"><strong>Total Amount:</strong></p>
                                                <p className="text-primary fw-bold">₹{totalAmount}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default OrderDetails;
