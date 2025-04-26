import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar, Doughnut } from 'react-chartjs-2';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faBoxOpen, faChartLine, faShoppingCart, faTag, faExclamationTriangle,
    faCheckCircle, faClockRotateLeft, faStar, faBoxes, faPalette, faFileInvoice, faDownload
} from '@fortawesome/free-solid-svg-icons';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const SellerDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dashboardData, setDashboardData] = useState({
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        totalMaterials: 0,
        recentOrders: [],
        productInventory: [],
        materialInventory: [],
        monthlySales: [],
        categoryDistribution: {},
        lowStockItems: [],
        productRatings: {},
        pendingOrdersCount: 0,
        completedOrdersCount: 0
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

            console.log("Fetching dashboard data with token:", token.substring(0, 10) + "...");
            
            try {
                const response = await axios.get('http://localhost:8080/seller/dashboard', {
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 15000 // Extended timeout for comprehensive data
                });

                console.log("Dashboard API response:", response.data);

                if (response.data.success) {
                    // Use default empty values if the expected data isn't available
                    const data = response.data.data || {};
                    
                    // Check if product data exists - log details for debugging
                    console.log("Product data check:", {
                        totalProducts: data.totalProducts,
                        productInventoryLength: data.productInventory ? data.productInventory.length : 'undefined',
                        totalMaterials: data.totalMaterials,
                        materialInventoryLength: data.materialInventory ? data.materialInventory.length : 'undefined'
                    });
                    
                    // Set dashboard data with proper type checks
                    setDashboardData({
                        totalProducts: typeof data.totalProducts === 'number' ? data.totalProducts : 
                                      (data.productInventory ? data.productInventory.length : 0),
                        totalOrders: data.totalOrders || 0,
                        totalRevenue: data.totalRevenue || 0,
                        totalMaterials: data.totalMaterials || 0,
                        recentOrders: Array.isArray(data.recentOrders) ? data.recentOrders : [],
                        productInventory: Array.isArray(data.productInventory) ? data.productInventory : [],
                        materialInventory: Array.isArray(data.materialInventory) ? data.materialInventory : [],
                        monthlySales: Array.isArray(data.monthlySales) ? data.monthlySales : [],
                        categoryDistribution: data.categoryDistribution || {},
                        lowStockItems: Array.isArray(data.lowStockItems) ? data.lowStockItems : [],
                        productRatings: data.productRatings || {},
                        pendingOrdersCount: data.pendingOrdersCount || 0,
                        completedOrdersCount: data.completedOrdersCount || 0
                    });
                    
                    if (response.data.message) {
                        toast.warning(response.data.message);
                    }
                } else {
                    throw new Error(response.data.message || 'Failed to fetch dashboard data');
                }
            } catch (apiError) {
                console.error('API Error:', apiError);
                
                // Try to fetch products directly as a fallback
                try {
                    console.log("Falling back to direct product fetch");
                    const productsResponse = await axios.get("http://localhost:8080/product/seller-list", {
                        headers: { 'Authorization': `Bearer ${token}` },
                    });
                    
                    if (productsResponse.data.success) {
                        const products = productsResponse.data.products || [];
                        console.log(`Fetched ${products.length} products directly`);
                        
                        // Create category distribution from products
                        const categoryDist = {};
                        products.forEach(product => {
                            const category = product.category || 'Uncategorized';
                            categoryDist[category] = (categoryDist[category] || 0) + 1;
                        });
                        
                        setDashboardData({
                            ...dashboardData,
                            totalProducts: products.length,
                            productInventory: products,
                            categoryDistribution: categoryDist
                        });
                        
                        toast.info("Could not load all dashboard data. Showing partial information.");
                    }
                } catch (productsError) {
                    console.error('Products fallback error:', productsError);
                    throw apiError; // Re-throw the original error
                }
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setError('Failed to load dashboard data. Please refresh the page or try again later.');
        } finally {
            setLoading(false);
        }
    };

    const downloadInvoice = (orderId) => {
        try {
            const token = localStorage.getItem('sellertoken');
            
            // Create a downloadable link
            const downloadLink = document.createElement('a');
            downloadLink.href = `http://localhost:8080/order/invoice/${orderId}`;
            
            // Use fetch to get the PDF with authentication
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
                downloadLink.download = `invoice_${orderId.substring(0, 8)}.pdf`;
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

    // Prepare chart data
    const categoryData = {
        labels: Object.keys(dashboardData.categoryDistribution),
        datasets: [{
            data: Object.values(dashboardData.categoryDistribution),
            backgroundColor: [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
                '#FF9F40', '#8D99AE', '#58508D', '#BC5090', '#FF6B6B'
            ],
            hoverOffset: 4
        }]
    };

    const orderStatusData = {
        labels: ['Completed', 'Pending'],
        datasets: [{
            data: [dashboardData.completedOrdersCount, dashboardData.pendingOrdersCount],
            backgroundColor: ['#4BC0C0', '#FFCE56'],
            hoverOffset: 4
        }]
    };

    const salesData = {
        labels: dashboardData.monthlySales.map(item => item.month),
        datasets: [{
            label: 'Monthly Revenue (₹)',
            data: dashboardData.monthlySales.map(item => item.revenue),
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
        }]
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

    const allInventoryItems = [...dashboardData.productInventory, ...dashboardData.materialInventory];

    return (
        <div className="container-fluid py-4">
            <h2 className="mb-4">Seller Dashboard</h2>
            
            {/* Key Metrics Overview */}
            <div className="row g-4 mb-5">
                
                
                <div className="col-md-6">
                    <div className="card h-100 bg-success text-white">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="mb-0">Total Orders</h6>
                                    <h2 className="mb-0">{dashboardData.totalOrders}</h2>
                                </div>
                                <div className="fs-1"><FontAwesomeIcon icon={faShoppingCart} /></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="col-md-6">
                    <div className="card h-100 bg-warning text-white">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="mb-0">Total Revenue</h6>
                                    <h2 className="mb-0">₹{dashboardData.totalRevenue}</h2>
                                </div>
                                <div className="fs-1"><FontAwesomeIcon icon={faChartLine} /></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="row g-4">
                {/* Monthly Revenue Chart */}
                <div className="col-md-8 mb-4">
                    <div className="card h-100">
                        <div className="card-header bg-white">
                            <h5 className="mb-0">Monthly Revenue</h5>
                        </div>
                        <div className="card-body">
                            <Bar 
                                data={salesData} 
                                options={{
                                    responsive: true,
                                    plugins: {
                                        legend: { position: 'top' },
                                        title: { display: false }
                                    },
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            title: {
                                                display: true,
                                                text: 'Revenue (₹)'
                                            }
                                        }
                                    }
                                }} 
                            />
                        </div>
                    </div>
                </div>
                
                {/* Low Stock Items */}
                <div className="col-md-4 mb-4">
                    <div className="card h-100">
                        <div className="card-header bg-white d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">Low Stock Items</h5>
                            <span className="badge bg-danger">{dashboardData.lowStockItems.length}</span>
                        </div>
                        <div className="card-body p-0">
                            {dashboardData.lowStockItems.length > 0 ? (
                                <div className="list-group list-group-flush">
                                    {dashboardData.lowStockItems.map((item, index) => (
                                        <div key={index} className="list-group-item">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <span className="me-2">
                                                        {item.type === 'product' 
                                                            ? <FontAwesomeIcon icon={faPalette} className="text-primary" /> 
                                                            : <FontAwesomeIcon icon={faBoxes} className="text-info" />}
                                                    </span>
                                                    {item.name}
                                                </div>
                                                <span className={`badge ${item.quantity === 0 ? 'bg-danger' : 'bg-warning'}`}>
                                                    {item.quantity} left
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4 text-muted">
                                    <FontAwesomeIcon icon={faCheckCircle} className="fs-1 text-success mb-3" />
                                    <p>All items have sufficient stock</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="row g-4">
                {/* Recent Orders */}
                <div className="col-md-8 mb-4">
                    <div className="card h-100">
                        <div className="card-header bg-white">
                            <h5 className="mb-0">Recent Orders</h5>
                        </div>
                        <div className="card-body p-0">
                            {dashboardData.recentOrders.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-hover mb-0">
                                        <thead>
                                            <tr>
                                                <th>Order ID</th>
                                                <th>Customer</th>
                                                <th>Date</th>
                                                <th>Amount</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {dashboardData.recentOrders.map((order, index) => (
                                                <tr key={index}>
                                                    <td>{order.order_id.substring(0, 8)}</td>
                                                    <td>{order.customer_email}</td>
                                                    <td>{new Date(order.date).toLocaleDateString()}</td>
                                                    <td>₹{order.amount}</td>
                                                    <td>
                                                        <span className={`badge ${
                                                            order.status === 'completed' || order.status === 'delivered' ? 'bg-success' : 
                                                            order.status === 'shipped' ? 'bg-primary' :
                                                            order.status === 'processing' || order.status === 'confirmed' ? 'bg-warning' :
                                                            'bg-secondary'
                                                        }`}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button 
                                                            className="btn btn-sm btn-outline-secondary"
                                                            title="Download Invoice"
                                                            onClick={() => downloadInvoice(order.order_id)}
                                                        >
                                                            <FontAwesomeIcon icon={faDownload} /> Invoice
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-4 text-muted">
                                    <FontAwesomeIcon icon={faClockRotateLeft} className="fs-1 mb-3" />
                                    <p>No orders received yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Data Distribution */}
                <div className="col-md-4">
                    <div className="row g-4">
                        {/* Product Categories Chart */}
                        <div className="col-12 mb-4">
                            <div className="card h-100">
                                <div className="card-header bg-white">
                                    <h5 className="mb-0">Product Categories</h5>
                                </div>
                                <div className="card-body">
                                    {Object.keys(dashboardData.categoryDistribution).length > 0 ? (
                                        <Pie data={categoryData} options={{
                                            responsive: true,
                                            plugins: {
                                                legend: { position: 'bottom', display: true }
                                            }
                                        }} />
                                    ) : (
                                        <div className="text-center py-3 text-muted">
                                            <p>No category data available</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {/* Order Status Distribution */}
                        {dashboardData.totalOrders > 0 && (
                            <div className="col-12 mb-4">
                                <div className="card h-100">
                                    <div className="card-header bg-white">
                                        <h5 className="mb-0">Order Status</h5>
                                    </div>
                                    <div className="card-body">
                                        <Doughnut data={orderStatusData} options={{
                                            responsive: true,
                                            plugins: {
                                                legend: { position: 'bottom' }
                                            },
                                            cutout: '70%'
                                        }} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Inventory Status */}
            {allInventoryItems.length > 0 && (
                <div className="row mt-4">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-header bg-white d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">Inventory Status</h5>
                                {/* Removed the Manage Products and Manage Materials buttons */}
                            </div>
                            <div className="card-body">
                                <div className="table-responsive">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Item</th>
                                                <th>Type</th>
                                                <th>Category</th>
                                                <th>Price</th>
                                                <th>Quantity</th>
                                                <th>Status</th>
                                                {Object.keys(dashboardData.productRatings).length > 0 && (
                                                    <th>Rating</th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {allInventoryItems.slice(0, 8).map((item) => (
                                                <tr key={item._id}>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            {item.image ? (
                                                                <img 
                                                                    src={item.image}
                                                                    alt={item.name}
                                                                    className="me-2"
                                                                    style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                                                    onError={(e) => {
                                                                        e.target.onerror = null;
                                                                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40' fill='none'%3E%3Crect width='40' height='40' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='8' text-anchor='middle' dominant-baseline='middle' fill='%23aaa'%3ENo Image%3C/text%3E%3C/svg%3E";
                                                                    }}
                                                                />
                                                            ) : (
                                                                <div 
                                                                    style={{
                                                                        width: '40px',
                                                                        height: '40px',
                                                                        background: '#f0f0f0',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        marginRight: '8px',
                                                                        fontSize: '10px',
                                                                        color: '#aaa'
                                                                    }}
                                                                >
                                                                    No Img
                                                                </div>
                                                            )}
                                                            {item.name}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${item.type === 'product' ? 'bg-primary' : 'bg-info'}`}>
                                                            {item.type === 'product' ? 'Product' : 'Material'}
                                                        </span>
                                                    </td>
                                                    <td>{item.category || 'Uncategorized'}</td>
                                                    <td>₹{item.price || '0'}</td>
                                                    <td>{item.quantity || '0'}</td>
                                                    <td>
                                                        <span className={`badge ${
                                                            (item.quantity > 10) ? 'bg-success' : 
                                                            (item.quantity > 5) ? 'bg-warning' :
                                                            'bg-danger'
                                                        }`}>
                                                            {(item.quantity > 10) ? 'In Stock' : 
                                                             (item.quantity > 0) ? 'Low Stock' : 
                                                             'Out of Stock'}
                                                        </span>
                                                    </td>
                                                    {Object.keys(dashboardData.productRatings).length > 0 && (
                                                        <td>
                                                            {item.type === 'product' && dashboardData.productRatings[item._id] ? (
                                                                <div className="d-flex align-items-center">
                                                                    <span className="text-warning me-1">
                                                                        <FontAwesomeIcon icon={faStar} />
                                                                    </span>
                                                                    {dashboardData.productRatings[item._id].avg_rating.toFixed(1)}
                                                                    <small className="text-muted ms-1">
                                                                        ({dashboardData.productRatings[item._id].review_count})
                                                                    </small>
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted">N/A</span>
                                                            )}
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    
                                    {allInventoryItems.length > 8 && (
                                        <div className="text-center mt-3">
                                            <button className="btn btn-link">View All Items</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <style jsx>{`
                .icon-container {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .card {
                    border: none;
                    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                .card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.1);
                }
                .card-header {
                    border-bottom: none;
                    font-weight: 600;
                }
                .table th {
                    font-weight: 600;
                    border-top: none;
                }
                .badge {
                    font-weight: 500;
                    padding: 0.35em 0.65em;
                }
                .text-primary {
                    color: #3a1d6e !important;
                }
                .bg-primary {
                    background-color: #3a1d6e !important;
                }
                .bg-info {
                    background-color: #17a2b8 !important;
                }
                .btn-outline-primary {
                    color: #3a1d6e;
                    border-color: #3a1d6e;
                }
                .btn-outline-primary:hover {
                    background-color: #3a1d6e;
                    color: white;
                }
                .btn-outline-info {
                    color: #17a2b8;
                    border-color: #17a2b8;
                }
                .btn-outline-info:hover {
                    background-color: #17a2b8;
                    color: white;
                }
            `}</style>
        </div>
    );
};

// Fix the default export - ensure proper syntax
export default SellerDashboard;
