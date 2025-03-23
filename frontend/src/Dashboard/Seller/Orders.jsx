import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Orders;
