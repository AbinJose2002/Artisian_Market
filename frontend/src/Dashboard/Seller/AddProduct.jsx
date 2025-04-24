import { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faTrash } from '@fortawesome/free-solid-svg-icons';
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
            `}</style>
        </div>
    );
};

export default AddProduct;
