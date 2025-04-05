import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { toast } from 'react-toastify';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const SellerDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dashboardData, setDashboardData] = useState({
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        recentOrders: [],
        productInventory: [],
        monthlySales: [],
        categoryDistribution: {},
        topProducts: []
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('sellertoken');
            if (!token) {
                setError('Please log in to view dashboard');
                setLoading(false);
                return;
            }

            console.log("Fetching dashboard data with token");
            const response = await axios.get('http://localhost:8080/seller/dashboard', {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 10000 // Add a timeout to prevent hanging requests
            });

            console.log("Dashboard API response:", response.data);

            if (response.data.success) {
                // Use default empty values if the expected data isn't available
                const data = response.data.data || {};
                setDashboardData({
                    totalProducts: data.totalProducts || 0,
                    totalOrders: data.totalOrders || 0,
                    totalRevenue: data.totalRevenue || 0,
                    recentOrders: Array.isArray(data.recentOrders) ? data.recentOrders : [],
                    productInventory: Array.isArray(data.productInventory) ? data.productInventory : [],
                    monthlySales: Array.isArray(data.monthlySales) ? data.monthlySales : [],
                    categoryDistribution: data.categoryDistribution || {},
                    topProducts: Array.isArray(data.topProducts) ? data.topProducts : []
                });
                
                // Show warning if there was a message - likely partial data
                if (response.data.message) {
                    toast.warning(response.data.message);
                }
            } else {
                throw new Error(response.data.message || 'Failed to fetch dashboard data');
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setError('Failed to load dashboard data. Please refresh the page or try again later.');
        } finally {
            setLoading(false);
        }
    };

    // Prepare chart data from fetched data
    const categoryData = {
        labels: Object.keys(dashboardData.categoryDistribution),
        datasets: [
            {
                data: Object.values(dashboardData.categoryDistribution),
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
                hoverOffset: 4
            }
        ]
    };

    // If we have monthly sales data, use it; otherwise use placeholder data
    const salesData = {
        labels: dashboardData.monthlySales.length > 0 
            ? dashboardData.monthlySales.map(item => item.month) 
            : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
            {
                label: 'Monthly Sales',
                data: dashboardData.monthlySales.length > 0 
                    ? dashboardData.monthlySales.map(item => item.revenue)
                    : [5000, 7000, 6500, 8000, 9500, 12000, 11000, 13000, 12500, 14000, 16000, 18000],
                backgroundColor: 'rgba(75, 192, 192, 0.6)'
            }
        ]
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Loading dashboard data...</p>
            </div>
        );
    }

    if (error) {
        return (
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
    }

    return (
        <div className="container-fluid py-4">
            <h2 className="mb-4">Seller Dashboard</h2>
            
            {/* Stats Overview */}
            <div className="row g-4 mb-5">
                <div className="col-md-4">
                    <div className="card bg-primary text-white">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="mb-0">Total Products</h6>
                                    <h2 className="mb-0">{dashboardData.totalProducts}</h2>
                                </div>
                                <div className="fs-1">🖼️</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="col-md-4">
                    <div className="card bg-success text-white">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="mb-0">Total Orders</h6>
                                    <h2 className="mb-0">{dashboardData.totalOrders}</h2>
                                </div>
                                <div className="fs-1">📦</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="col-md-4">
                    <div className="card bg-warning text-white">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="mb-0">Total Revenue</h6>
                                    <h2 className="mb-0">₹{dashboardData.totalRevenue}</h2>
                                </div>
                                <div className="fs-1">💰</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="row g-4">
                {/* Product Categories Chart */}
                <div className="col-md-5">
                    <div className="card h-100">
                        <div className="card-header">
                            <h5 className="mb-0">Products by Category</h5>
                        </div>
                        <div className="card-body">
                            {Object.keys(dashboardData.categoryDistribution).length > 0 ? (
                                <Pie data={categoryData} options={{
                                    responsive: true,
                                    plugins: {
                                        legend: {
                                            position: 'bottom',
                                        }
                                    }
                                }} />
                            ) : (
                                <div className="text-center py-5 text-muted">
                                    <p>No category data available</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Recent Orders */}
                <div className="col-md-7">
                    <div className="card h-100">
                        <div className="card-header">
                            <h5 className="mb-0">Recent Orders</h5>
                        </div>
                        <div className="card-body">
                            {dashboardData.recentOrders.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>Order ID</th>
                                                <th>Customer</th>
                                                <th>Date</th>
                                                <th>Amount</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {dashboardData.recentOrders.map((order) => (
                                                <tr key={order.order_id}>
                                                    <td>{order.order_id}</td>
                                                    <td>{order.customer_name || order.customer_email}</td>
                                                    <td>{new Date(order.date).toLocaleDateString()}</td>
                                                    <td>₹{order.amount}</td>
                                                    <td>
                                                        <span className={`badge ${
                                                            order.status === 'delivered' ? 'bg-success' : 
                                                            order.status === 'shipped' ? 'bg-primary' :
                                                            order.status === 'processing' ? 'bg-warning' :
                                                            'bg-secondary'
                                                        }`}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-5 text-muted">
                                    <p>No recent orders found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Monthly Sales Chart */}
            <div className="row mt-4">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0">Monthly Sales</h5>
                        </div>
                        <div className="card-body">
                            <Bar 
                                data={salesData} 
                                options={{
                                    responsive: true,
                                    plugins: {
                                        legend: {
                                            position: 'top',
                                        },
                                        title: {
                                            display: true,
                                            text: 'Monthly Revenue'
                                        },
                                    }
                                }} 
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Inventory Status */}
            {dashboardData.productInventory.length > 0 && (
                <div className="row mt-4">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">Inventory Status</h5>
                                <button 
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => document.querySelector('button[data-id="products"]')?.click()}
                                >
                                    Manage Products
                                </button>
                            </div>
                            <div className="card-body">
                                <div className="table-responsive">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Product</th>
                                                <th>Category</th>
                                                <th>Price</th>
                                                <th>Quantity</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {dashboardData.productInventory.map((product) => (
                                                <tr key={product._id}>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            {product.image && (
                                                                <img 
                                                                    src={`http://localhost:8080/uploads/product_images/${product.image}`}
                                                                    alt={product.name}
                                                                    className="me-2"
                                                                    style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                                                    onError={(e) => {
                                                                        e.target.onerror = null;
                                                                        e.target.src = "https://via.placeholder.com/40";
                                                                    }}
                                                                />
                                                            )}
                                                            {product.name}
                                                        </div>
                                                    </td>
                                                    <td>{product.category}</td>
                                                    <td>₹{product.price}</td>
                                                    <td>{product.quantity}</td>
                                                    <td>
                                                        <span className={`badge ${
                                                            product.quantity > 10 ? 'bg-success' : 
                                                            product.quantity > 5 ? 'bg-warning' :
                                                            'bg-danger'
                                                        }`}>
                                                            {product.quantity > 10 ? 'In Stock' : 
                                                             product.quantity > 0 ? 'Low Stock' : 
                                                             'Out of Stock'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SellerDashboard;
