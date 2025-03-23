import React, { useState, useEffect } from 'react';
import axios from 'axios';

const OrderDetails = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const token = localStorage.getItem('usertoken');
                const response = await axios.get(
                    'http://localhost:8080/order/user/orders',
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                
                if (response.data.success) {
                    setOrders(response.data.orders);
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
                    {orders.map(order => (
                        <div key={order.order_id} className="col-12">
                            <div className="card">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0">Order #{order.order_id.slice(-6)}</h5>
                                    <span className={`badge bg-${order.status === 'completed' ? 'success' : 'warning'}`}>
                                        {order.status}
                                    </span>
                                </div>
                                <div className="card-body">
                                    <div className="row">
                                        {order.items.map((item, index) => (
                                            <div key={index} className="col-md-6 mb-3">
                                                <div className="d-flex align-items-center">
                                                    <img 
                                                        src={item.image} 
                                                        alt={item.name}
                                                        style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                                        className="me-3"
                                                    />
                                                    <div>
                                                        <h6 className="mb-0">{item.name}</h6>
                                                        <p className="mb-0 text-muted">₹{item.price}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <hr />
                                    <div className="row mt-3">
                                        <div className="col-md-6">
                                            <p className="mb-1"><strong>Order Date:</strong></p>
                                            <p>{order.created_at}</p>
                                        </div>
                                        <div className="col-md-6 text-md-end">
                                            <p className="mb-1"><strong>Total Amount:</strong></p>
                                            <p className="text-primary">₹{order.total_amount}</p>
                                        </div>
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

export default OrderDetails;
