import { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faTrash, faChartLine } from '@fortawesome/free-solid-svg-icons';
import "bootstrap/dist/css/bootstrap.min.css";

const AddProduct = () => {
    const [products, setProducts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [productData, setProductData] = useState({
        name: "",
        description: "",
        price: "",
        category: "Painting", // Default category
        image: null,
        quantity: "",
    });
    const [isEditing, setIsEditing] = useState(false);
    const [editingProductId, setEditingProductId] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteProductId, setDeleteProductId] = useState(null);
    const [customCategory, setCustomCategory] = useState("");
    const [allCategories, setAllCategories] = useState([  // New state for all categories
        "Others",
        "Painting",
        "Sculpture",
        "Photography",
        "Digital Art",
        "Calligraphy",
        "Mixed Media",
    ]);
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [productStats, setProductStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(false);

    const sellerToken = localStorage.getItem("sellertoken");

    // Base categories that are always available
    const baseCategories = [
        "Others",
        "Painting",
        "Sculpture",
        "Photography",
        "Digital Art",
        "Calligraphy",
        "Mixed Media",
    ];

    useEffect(() => {
        if (sellerToken) {
            fetchSellerProducts();
            fetchAllCategories(); // New function to fetch all categories
        }
    }, []);

    // New function to fetch all unique categories
    const fetchAllCategories = async () => {
        try {
            const response = await axios.get("http://localhost:8080/product/categories", {
                headers: { 
                    'Authorization': `Bearer ${sellerToken}`,
                    'Content-Type': 'application/json'
                },
            });
            
            if (response.data.success) {
                // Combine base categories with unique categories from backend
                const uniqueCategories = [...baseCategories];
                
                response.data.categories.forEach(category => {
                    if (!baseCategories.includes(category) && category !== "Others") {
                        uniqueCategories.push(category);
                    }
                });
                
                setAllCategories(uniqueCategories);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    const fetchSellerProducts = async () => {
        try {
            if (!sellerToken) {
                console.error("No seller token found");
                return;
            }

            const res = await axios.get("http://localhost:8080/product/seller-list", {
                headers: { 
                    'Authorization': `Bearer ${sellerToken}`,
                    'Content-Type': 'application/json'
                },
            });
            
            if (res.data.success) {
                const productsWithIds = res.data.products.map(product => ({
                    ...product,
                    _id: product._id || product.id
                }));
                setProducts(productsWithIds);
            }
        } catch (error) {
            if (error.response?.status === 401) {
                // Handle unauthorized error (e.g., redirect to login)
                console.error("Unauthorized access. Please login again.");
                localStorage.removeItem("sellertoken");
                // Add navigation to login if needed
            }
            console.error("Error fetching seller products:", error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProductData({ ...productData, [name]: value });
        
        // If category changes to "Others", reset the custom category
        if (name === "category" && value === "Others") {
            setCustomCategory("");
        }
    };

    const handleCustomCategoryChange = (e) => {
        setCustomCategory(e.target.value);
    };

    const handleImageChange = (e) => {
        setProductData({ ...productData, image: e.target.files[0] });
    };

    const handleEdit = (product) => {
        setProductData({
            name: product.name,
            description: product.description,
            price: product.price,
            category: product.category,
            image: product.image,
            quantity: product.quantity,
        });
        setEditingProductId(product._id);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!id) {
            console.error("No product ID provided");
            return;
        }
        
        try {
            await axios.delete(`http://localhost:8080/product/delete/${id}`, {
                headers: { Authorization: `Bearer ${sellerToken}` },
            });
            setShowDeleteConfirm(false);
            fetchSellerProducts();
        } catch (error) {
            console.error("Error deleting product:", error);
            alert("Failed to delete product");
        }
    };

    const handleSubmit = async () => {
        if (!sellerToken) {
            alert("Unauthorized: Please login first.");
            return;
        }

        const formData = new FormData();
        formData.append("name", productData.name);
        formData.append("description", productData.description);
        formData.append("price", productData.price);
        
        let finalCategory = productData.category;
        
        // Use custom category if "Others" is selected
        if (productData.category === "Others" && customCategory.trim()) {
            finalCategory = customCategory.trim();
            
            // Add the new category to our list if it's not already there
            if (!allCategories.includes(finalCategory)) {
                setAllCategories(prev => [...prev, finalCategory]);
            }
        }
        
        formData.append("category", finalCategory);
        formData.append("image", productData.image);
        formData.append("quantity", productData.quantity);

        try {
            if (isEditing) {
                await axios.put(`http://localhost:8080/product/update/${editingProductId}`, 
                    formData,
                    { headers: { Authorization: `Bearer ${sellerToken}` } }
                );
            } else {
                await axios.post("http://localhost:8080/product/add",
                    formData,
                    { headers: { Authorization: `Bearer ${sellerToken}` } }
                );
            }
            setShowModal(false);
            setIsEditing(false);
            setEditingProductId(null);
            setProductData({ name: "", description: "", price: "", category: "Painting", image: null, quantity: "" });
            setCustomCategory("");
            fetchSellerProducts();
            fetchAllCategories(); // Refresh categories after adding a new one
        } catch (error) {
            console.error("Error saving product:", error);
        }
    };

    const fetchProductStats = async (productId) => {
        setLoadingStats(true);
        try {
            console.log(`Fetching stats for product ID: ${productId}`);
            const response = await axios.get(`http://localhost:8080/product/stats/${productId}`, {
                headers: { 'Authorization': `Bearer ${sellerToken}` }
            });
            
            if (response.data.success) {
                console.log("Stats received:", response.data.stats);
                // Ensure all required fields exist with fallback values
                const stats = {
                    totalSales: response.data.stats?.totalSales || 0,
                    totalRevenue: response.data.stats?.totalRevenue || 0,
                    lastOrderDate: response.data.stats?.lastOrderDate || null,
                    averageRating: response.data.stats?.averageRating || 0,
                    monthlyTrend: response.data.stats?.monthlyTrend || []
                };
                
                // Ensure monthlyTrend is always an array
                if (!Array.isArray(stats.monthlyTrend)) {
                    stats.monthlyTrend = [];
                }
                
                // Ensure all months have a sales value
                stats.monthlyTrend = stats.monthlyTrend.map(month => ({
                    month: month.month || 'N/A',
                    sales: typeof month.sales === 'number' ? month.sales : 0
                }));
                
                setProductStats(stats);
            } else {
                // Initialize with default values
                setProductStats({
                    totalSales: 0,
                    totalRevenue: 0,
                    lastOrderDate: null,
                    averageRating: 0,
                    monthlyTrend: generateDefaultMonthlyTrend()
                });
            }
        } catch (error) {
            console.error("Error fetching product statistics:", error);
            // Initialize with default values on error
            setProductStats({
                totalSales: 0,
                totalRevenue: 0,
                lastOrderDate: null,
                averageRating: 0,
                monthlyTrend: generateDefaultMonthlyTrend()
            });
        } finally {
            setLoadingStats(false);
        }
    };

    // Helper function to generate default monthly trend data
    const generateDefaultMonthlyTrend = () => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        return months.map(month => ({
            month: month,
            sales: 0
        }));
    };

    const showProductStats = (product) => {
        setSelectedProduct(product);
        setShowStatsModal(true);
        fetchProductStats(product._id);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="container mt-4">
            {/* Add Product Button */}
            <button
                className="btn add-product-btn mb-3"
                onClick={() => setShowModal(true)}
            >
                + Add Product
            </button>

            {/* Modal for Adding Product */}
            {showModal && (
                <div className="modal fade show d-block animate__animated animate__fadeIn" tabIndex="-1">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Add New Product</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <input
                                    className="form-control mb-2"
                                    type="text"
                                    name="name"
                                    placeholder="Product Name"
                                    onChange={handleChange}
                                />
                                <input
                                    className="form-control mb-2"
                                    type="text"
                                    name="description"
                                    placeholder="Description"
                                    onChange={handleChange}
                                />
                                <input
                                    className="form-control mb-2"
                                    type="number"
                                    name="price"
                                    placeholder="Price"
                                    onChange={handleChange}
                                />

                                {/* Category Select Dropdown - Now uses allCategories */}
                                <select
                                    className="form-select mb-2"
                                    name="category"
                                    value={productData.category}
                                    onChange={handleChange}
                                >
                                    {allCategories.map((category, index) => (
                                        <option key={index} value={category}>
                                            {category}
                                        </option>
                                    ))}
                                </select>

                                {/* Custom Category Input - shows only when Others is selected */}
                                {productData.category === "Others" && (
                                    <input
                                        className="form-control mb-2"
                                        type="text"
                                        placeholder="Enter custom category"
                                        value={customCategory}
                                        onChange={handleCustomCategoryChange}
                                    />
                                )}

                                <input
                                    className="form-control mb-2"
                                    type="file"
                                    name="image"
                                    onChange={handleImageChange}
                                />

                                <div className="mb-3">
                                    <label className="form-label">Quantity in Stock</label>
                                    <input
                                        type="number"
                                        name="quantity"
                                        className="form-control"
                                        value={productData.quantity}
                                        onChange={handleChange}
                                        required
                                        min="0"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button className="btn btn-success" onClick={handleSubmit}>Submit</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="modal fade show d-block" tabIndex="-1">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Confirm Delete</h5>
                                <button type="button" className="btn-close" onClick={() => setShowDeleteConfirm(false)}></button>
                            </div>
                            <div className="modal-body">
                                Are you sure you want to delete this product?
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                                <button className="btn btn-danger" onClick={() => handleDelete(deleteProductId)}>Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Product List for Seller */}
            <h3>Your Products</h3>
            <div className="row">
                {products.length === 0 ? (
                    <p>No products found.</p>
                ) : (
                    products.map((product, index) => (
                        <div key={index} className="col-md-3">
                            <div className="card mb-4 shadow-sm product-card">
                                {product.image && (
                                    <img
                                        style={{ height: "200px", width: "100%", display: "block" }}
                                        className="card-img-top"
                                        src={product.image}
                                        alt={product.name}
                                    />
                                )}
                                <div className="card-body">
                                    <h5 className="card-title">{product.name}</h5>
                                    <p className="card-text">{product.description}</p>
                                    <p className="text-primary fw-bold">₹{product.price}</p>
                                    <p className="text-muted">Category: {product.category}</p>
                                    <p className="text-muted">Quantity: {product.quantity}</p>
                                    <div className="d-flex justify-content-between mt-2">
                                        <button 
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => handleEdit(product)}
                                        >
                                            <FontAwesomeIcon icon={faPenToSquare} /> Edit
                                        </button>
                                        <button 
                                            className="btn btn-sm btn-outline-info"
                                            onClick={() => showProductStats(product)}
                                        >
                                            <FontAwesomeIcon icon={faChartLine} /> Stats
                                        </button>
                                        <button 
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => {
                                                setDeleteProductId(product._id);
                                                setShowDeleteConfirm(true);
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faTrash} /> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Stats Modal */}
            {showStatsModal && selectedProduct && (
                <div className="modal fade show d-block" tabIndex="-1">
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    Sales Statistics: {selectedProduct?.name || 'Product'}
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={() => setShowStatsModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                {loadingStats ? (
                                    <div className="text-center py-4">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <p className="mt-2">Loading statistics...</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="row stats-summary">
                                            <div className="col-md-3 text-center mb-3">
                                                <div className="stats-card">
                                                    <h3>{productStats?.totalSales || 0}</h3>
                                                    <p>Units Sold</p>
                                                </div>
                                            </div>
                                            <div className="col-md-3 text-center mb-3">
                                                <div className="stats-card">
                                                    <h3>₹{productStats?.totalRevenue || 0}</h3>
                                                    <p>Total Revenue</p>
                                                </div>
                                            </div>
                                            <div className="col-md-3 text-center mb-3">
                                                <div className="stats-card">
                                                    <h3>{formatDate(productStats?.lastOrderDate)}</h3>
                                                    <p>Last Sale</p>
                                                </div>
                                            </div>
                                            <div className="col-md-3 text-center mb-3">
                                                <div className="stats-card">
                                                    <h3>{productStats?.averageRating?.toFixed(1) || '0.0'}/5</h3>
                                                    <p>Average Rating</p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <h6 className="mt-4 mb-3">Monthly Sales Trend</h6>
                                        
                                        {productStats?.monthlyTrend && productStats.monthlyTrend.length > 0 ? (
                                            <div className="monthly-trend-chart">
                                                {/* Simple bar chart visualization */}
                                                <div className="chart-container">
                                                    {productStats.monthlyTrend.map((month, index) => {
                                                        // Prevent division by zero
                                                        const maxSales = Math.max(1, ...productStats.monthlyTrend.map(m => m.sales || 0));
                                                        const heightPercentage = Math.min(100, ((month.sales || 0) / maxSales) * 100);
                                                        
                                                        return (
                                                            <div key={index} className="chart-bar-container">
                                                                <div 
                                                                    className="chart-bar" 
                                                                    style={{ 
                                                                        height: `${heightPercentage}%`,
                                                                        backgroundColor: '#3a1d6e'
                                                                    }}
                                                                >
                                                                    <span className="chart-value">{month.sales || 0}</span>
                                                                </div>
                                                                <span className="chart-label">{month.month || ''}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="alert alert-info">
                                                No monthly sales data available yet.
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button 
                                    className="btn btn-secondary" 
                                    onClick={() => setShowStatsModal(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .add-product-btn {
                    background: #3a1d6e;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    transition: all 0.3s ease;
                }
                .add-product-btn:hover {
                    background: #4b2d89;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(58, 29, 110, 0.2);
                }
                .modal {
                    background: rgba(26, 28, 42, 0.8);
                }
                .modal-content {
                    background: #f8f9fc;
                    transform: scale(0.7);
                    opacity: 0;
                    animation: modalOpen 0.3s forwards;
                }
                @keyframes modalOpen {
                    to {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
                .product-card {
                    background: white;
                    border: none;
                    transition: all 0.3s ease;
                }
                .product-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 20px rgba(58, 29, 110, 0.15) !important;
                }
                .card-title {
                    color: #1a1c2a;
                }
                .card-text {
                    color: #4a4f6c;
                }
                .text-primary {
                    color: #3a1d6e !important;
                }
                .btn-success {
                    background: #2d5a27;
                    border: none;
                }
                .btn-success:hover {
                    background: #367032;
                }
                .btn-secondary {
                    background: #4a4f6c;
                    border: none;
                }
                .btn-secondary:hover {
                    background: #5c6284;
                }
                .card img {
                    transition: all 0.3s ease;
                }
                .card:hover img {
                    transform: scale(1.05);
                }
                .btn-outline-primary {
                    color: #3a1d6e;
                    border-color: #3a1d6e;
                }
                .btn-outline-primary:hover {
                    background-color: #3a1d6e;
                    color: white;
                }
                .btn-outline-danger {
                    color: #dc3545;
                    border-color: #dc3545;
                }
                .btn-outline-danger:hover {
                    background-color: #dc3545;
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
                .stats-summary {
                    margin-bottom: 20px;
                }
                .stats-card {
                    padding: 15px;
                    background-color: #f8f9fc;
                    border-radius: 8px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
                }
                .stats-card h3 {
                    color: #3a1d6e;
                    font-size: 1.5rem;
                    margin-bottom: 5px;
                }
                .stats-card p {
                    color: #6c757d;
                    margin-bottom: 0;
                }
                .chart-container {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    height: 200px;
                    padding: 0 10px;
                    margin-top: 20px;
                }
                .chart-bar-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 100%;
                }
                .chart-bar {
                    width: 30px;
                    min-height: 5px;
                    border-radius: 3px 3px 0 0;
                    position: relative;
                    transition: height 0.5s ease;
                }
                .chart-value {
                    position: absolute;
                    top: -20px;
                    left: 0;
                    right: 0;
                    text-align: center;
                    font-size: 0.75rem;
                    font-weight: bold;
                }
                .chart-label {
                    margin-top: 5px;
                    font-size: 0.8rem;
                    color: #666;
                }
            `}</style>
        </div>
    );
};

export default AddProduct;
