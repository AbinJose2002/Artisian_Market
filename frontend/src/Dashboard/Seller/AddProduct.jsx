import { useState, useEffect } from "react";
import axios from "axios";
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
    });

    const sellerToken = localStorage.getItem("sellertoken"); // Get seller token from local storage

    const artCategories = [
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
        }
    }, []);

    const fetchSellerProducts = async () => {
        try {
            const res = await axios.get("http://localhost:8080/product/seller-list", {
                headers: { Authorization: `Bearer ${sellerToken}` },
            });
            setProducts(res.data.products);
        } catch (error) {
            console.error("Error fetching seller products:", error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProductData({ ...productData, [name]: value });
    };

    const handleImageChange = (e) => {
        setProductData({ ...productData, image: e.target.files[0] });
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
        formData.append("category", productData.category);
        formData.append("image", productData.image);

        try {
            await axios.post("http://localhost:8080/product/add", formData, {
                headers: { Authorization: `Bearer ${sellerToken}` },
            });
            setShowModal(false);
            fetchSellerProducts(); // Refresh the product list
        } catch (error) {
            console.error("Error adding product:", error);
        }
    };

    return (
        <div className="container mt-4">
            {/* Add Product Button */}
            <button
                className="btn btn-primary mb-3"
                onClick={() => setShowModal(true)}
            >
                + Add Product
            </button>

            {/* Modal for Adding Product */}
            {showModal && (
                <div className="modal fade show d-block" tabIndex="-1">
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

                                {/* Category Select Dropdown */}
                                <select
                                    className="form-select mb-2"
                                    name="category"
                                    value={productData.category}
                                    onChange={handleChange}
                                >
                                    {artCategories.map((category, index) => (
                                        <option key={index} value={category}>
                                            {category}
                                        </option>
                                    ))}
                                </select>

                                <input
                                    className="form-control mb-2"
                                    type="file"
                                    name="image"
                                    onChange={handleImageChange}
                                />
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button className="btn btn-success" onClick={handleSubmit}>Submit</button>
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
                            <div className="card mb-4 shadow-sm">
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
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AddProduct;
