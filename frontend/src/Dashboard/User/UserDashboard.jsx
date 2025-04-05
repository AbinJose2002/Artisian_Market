import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import BidStats from './BidStats'; // Import the new component

const UserDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        orders: 0,
        events: 0,
        wishlist: 0,
        cart: 0
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('usertoken');
        if (!token) {
            navigate('/user-login');
            return;
        }

        const fetchData = async () => {
            try {
                // Use Promise.allSettled instead of Promise.all to handle partial failures
                const results = await Promise.allSettled([
                    // Fetch orders
                    axios.get('http://localhost:8080/order/user/orders', {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    
                    // Fetch registered events
                    axios.get('http://localhost:8080/instructor/events/registered', {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    
                    // Fetch cart items (fallback if profile endpoint fails)
                    axios.get('http://localhost:8080/user/cart', {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    
                    // Fetch wishlist items (fallback if profile endpoint fails)
                    axios.get('http://localhost:8080/user/wishlist', {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);

                console.log('API Results:', results);
                
                // Process orders
                let orders = [];
                if (results[0].status === 'fulfilled') {
                    orders = results[0].value.data.success ? results[0].value.data.orders : [];
                    setRecentOrders(orders.slice(0, 3));
                }
                
                // Process events
                let events = [];
                if (results[1].status === 'fulfilled') {
                    events = results[1].value.data.success ? results[1].value.data.events : [];
                    
                    // Set upcoming events (future events only)
                    const now = new Date();
                    const upcoming = events
                        .filter(event => {
                            try {
                                return new Date(event.date) > now;
                            } catch (e) {
                                return false; // Handle invalid dates
                            }
                        })
                        .sort((a, b) => new Date(a.date) - new Date(b.date))
                        .slice(0, 3);
                    
                    setUpcomingEvents(upcoming);
                }
                
                // Process cart items
                let cartItems = [];
                if (results[2].status === 'fulfilled' && results[2].value.data.success) {
                    cartItems = results[2].value.data.items || [];
                }
                
                // Process wishlist items
                let wishlistItems = [];
                if (results[3].status === 'fulfilled' && results[3].value.data.success) {
                    wishlistItems = results[3].value.data.items || [];
                }
                
                // Update stats
                setStats({
                    orders: orders.length,
                    events: events.length,
                    cart: cartItems.length,
                    wishlist: wishlistItems.length
                });
                
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                setError('Failed to load dashboard data. Please refresh the page or try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

    if (loading) return (
        <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading your dashboard...</p>
        </div>
    );

    if (error) return (
        <div className="alert alert-danger m-4" role="alert">
            <h4 className="alert-heading">Error!</h4>
            <p>{error}</p>
            <hr />
            <button 
                className="btn btn-outline-danger" 
                onClick={() => window.location.reload()}
            >
                Refresh Page
            </button>
        </div>
    );

    return (
        <div className="container-fluid">
            <h2 className="mb-4">Welcome to your Dashboard</h2>
            
            {/* Stats Overview */}
            <div className="row g-4 mb-5">
                <div className="col-md-3">
                    <div className="card bg-primary text-white">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="mb-0">Orders</h6>
                                    <h2 className="mb-0">{stats.orders}</h2>
                                </div>
                                <div className="fs-1">🛍️</div>
                            </div>
                        </div>
                        <div className="card-footer bg-transparent border-0 text-center">
                            <Link to="#" onClick={() => document.querySelector('button[data-id="orders"]').click()} className="text-white">View Details</Link>
                        </div>
                    </div>
                </div>
                
                <div className="col-md-3">
                    <div className="card bg-success text-white">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="mb-0">Events</h6>
                                    <h2 className="mb-0">{stats.events}</h2>
                                </div>
                                <div className="fs-1">🎭</div>
                            </div>
                        </div>
                        <div className="card-footer bg-transparent border-0 text-center">
                            <Link to="#" onClick={() => document.querySelector('button[data-id="events"]').click()} className="text-white">View Details</Link>
                        </div>
                    </div>
                </div>
                
                <div className="col-md-3">
                    <div className="card bg-info text-white">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="mb-0">Wishlist</h6>
                                    <h2 className="mb-0">{stats.wishlist}</h2>
                                </div>
                                <div className="fs-1">❤️</div>
                            </div>
                        </div>
                        <div className="card-footer bg-transparent border-0 text-center">
                            <Link to="/wishlist" className="text-white">View Details</Link>
                        </div>
                    </div>
                </div>
                
                <div className="col-md-3">
                    <div className="card bg-warning text-white">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="mb-0">Cart Items</h6>
                                    <h2 className="mb-0">{stats.cart}</h2>
                                </div>
                                <div className="fs-1">🛒</div>
                            </div>
                        </div>
                        <div className="card-footer bg-transparent border-0 text-center">
                            <Link to="/cart" className="text-white">View Cart</Link>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="row g-4">
                {/* Recent Orders */}
                <div className="col-md-6">
                    <div className="card h-100">
                        <div className="card-header bg-light">
                            <h5 className="mb-0">Recent Orders</h5>
                        </div>
                        <div className="card-body">
                            {recentOrders.length > 0 ? (
                                <div className="list-group">
                                    {recentOrders.map(order => (
                                        <div key={order.order_id} className="list-group-item list-group-item-action">
                                            <div className="d-flex w-100 justify-content-between">
                                                <h6 className="mb-1">Order #{order.order_id.slice(-6)}</h6>
                                                <small className="text-muted">
                                                    {new Date(order.created_at).toLocaleDateString()}
                                                </small>
                                            </div>
                                            <p className="mb-1">
                                                {order.items.length} item(s) - ₹{order.total_amount}
                                            </p>
                                            <small className={`badge ${order.status === 'delivered' ? 'bg-success' : 'bg-primary'}`}>
                                                {order.status}
                                            </small>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted">No orders found.</p>
                            )}
                        </div>
                        <div className="card-footer">
                            <Link to="#" onClick={() => document.querySelector('button[data-id="orders"]').click()} className="btn btn-sm btn-outline-primary">View All Orders</Link>
                        </div>
                    </div>
                </div>
                
                {/* Upcoming Events */}
                <div className="col-md-6">
                    <div className="card h-100">
                        <div className="card-header bg-light">
                            <h5 className="mb-0">Upcoming Events</h5>
                        </div>
                        <div className="card-body">
                            {upcomingEvents.length > 0 ? (
                                <div className="list-group">
                                    {upcomingEvents.map(event => (
                                        <div key={event._id} className="list-group-item list-group-item-action">
                                            <div className="d-flex w-100 justify-content-between">
                                                <h6 className="mb-1">{event.name}</h6>
                                                <small className="text-muted">
                                                    {new Date(event.date).toLocaleDateString()}
                                                </small>
                                            </div>
                                            <p className="mb-1">{event.type} - {event.place || 'Online'}</p>
                                            <small className="badge bg-info">
                                                {event.registration_details.payment_status}
                                            </small>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted">No upcoming events found.</p>
                            )}
                        </div>
                        <div className="card-footer">
                            <Link to="#" onClick={() => document.querySelector('button[data-id="events"]').click()} className="btn btn-sm btn-outline-primary">View All Events</Link>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Add Bid Stats Section */}
            <div className="mt-5">
                <BidStats />
            </div>
        </div>
    );
};

export default UserDashboard;
