import { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faTrash } from '@fortawesome/free-solid-svg-icons';
import "bootstrap/dist/css/bootstrap.min.css";

const MaterialsManager = () => {
    const [materials, setMaterials] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [materialData, setMaterialData] = useState({
        name: "",
        description: "",
        price: "",
        category: "Fabric", // Default category
        image: null,
        quantity: "",
    });
    const [isEditing, setIsEditing] = useState(false);
    const [editingMaterialId, setEditingMaterialId] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteMaterialId, setDeleteMaterialId] = useState(null);
    const [customCategory, setCustomCategory] = useState("");
    const [allCategories, setAllCategories] = useState([
        "Others",
        "Fabric",
        "Paper",
        "Wood",
        "Metal",
        "Clay",
        "Beads",
        "Yarn",
    ]);

    const sellerToken = localStorage.getItem("sellertoken");

    // Base categories that are always available
    const baseCategories = [
        "Others",
        "Fabric",
        "Paper",
        "Wood",
        "Metal",
        "Clay",
        "Beads",
        "Yarn",
    ];

    useEffect(() => {
        if (sellerToken) {
            fetchSellerMaterials();
            fetchAllCategories();
        }
    }, []);

    const fetchAllCategories = async () => {
        try {
            const response = await axios.get("http://localhost:8080/material/categories", {
                headers: { 
                    'Authorization': `Bearer ${sellerToken}`,
                    'Content-Type': 'application/json'
                },
            });
            
            if (response.data.success) {
                const uniqueCategories = [...baseCategories];
                
                response.data.categories.forEach(category => {
                    if (!baseCategories.includes(category) && category !== "Others") {
                        uniqueCategories.push(category);
                    }
                });
                
                setAllCategories(uniqueCategories);
            }
        } catch (error) {
            console.log("Categories may not exist yet, using default categories");
            // Just continue using the default categories - this will happen on first run
        }
    };

    const fetchSellerMaterials = async () => {
        try {
            if (!sellerToken) {
                console.error("No seller token found");
                return;
            }

            const res = await axios.get("http://localhost:8080/material/seller-list", {
                headers: { 
                    'Authorization': `Bearer ${sellerToken}`,
                    'Content-Type': 'application/json'
                },
            });
            
            if (res.data.success) {
                const materialsWithIds = res.data.materials.map(material => ({
                    ...material,
                    _id: material._id || material.id
                }));
                setMaterials(materialsWithIds);
            }
        } catch (error) {
            if (error.response?.status === 401) {
                console.error("Unauthorized access. Please login again.");
                localStorage.removeItem("sellertoken");
            }
            console.error("Error fetching seller materials:", error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setMaterialData({ ...materialData, [name]: value });
        
        if (name === "category" && value === "Others") {
            setCustomCategory("");
        }
    };

    const handleCustomCategoryChange = (e) => {
        setCustomCategory(e.target.value);
    };

    const handleImageChange = (e) => {
        setMaterialData({ ...materialData, image: e.target.files[0] });
    };

    const handleEdit = (material) => {
        setMaterialData({
            name: material.name,
            description: material.description,
            price: material.price,
            category: material.category,
            image: material.image,
            quantity: material.quantity,
        });
        setEditingMaterialId(material._id);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!id) {
            console.error("No material ID provided");
            return;
        }
        
        try {
            await axios.delete(`http://localhost:8080/material/delete/${id}`, {
                headers: { Authorization: `Bearer ${sellerToken}` },
            });
            setShowDeleteConfirm(false);
            fetchSellerMaterials();
        } catch (error) {
            console.error("Error deleting material:", error);
            alert("Failed to delete material");
        }
    };

    const handleSubmit = async () => {
        if (!sellerToken) {
            alert("Unauthorized: Please login first.");
            return;
        }

        const formData = new FormData();
        formData.append("name", materialData.name);
        formData.append("description", materialData.description);
        formData.append("price", materialData.price);
        
        let finalCategory = materialData.category;
        
        if (materialData.category === "Others" && customCategory.trim()) {
            finalCategory = customCategory.trim();
            
            if (!allCategories.includes(finalCategory)) {
                setAllCategories(prev => [...prev, finalCategory]);
            }
        }
        
        formData.append("category", finalCategory);
        formData.append("image", materialData.image);
        formData.append("quantity", materialData.quantity);

        try {
            if (isEditing) {
                await axios.put(`http://localhost:8080/material/update/${editingMaterialId}`, 
                    formData,
                    { headers: { Authorization: `Bearer ${sellerToken}` } }
                );
            } else {
                await axios.post("http://localhost:8080/material/add",
                    formData,
                    { headers: { Authorization: `Bearer ${sellerToken}` } }
                );
            }
            setShowModal(false);
            setIsEditing(false);
            setEditingMaterialId(null);
            setMaterialData({ name: "", description: "", price: "", category: "Fabric", image: null, quantity: "" });
            setCustomCategory("");
            fetchSellerMaterials();
            fetchAllCategories();
        } catch (error) {
            console.error("Error saving material:", error);
        }
    };

    return (
        <div className="container mt-4">
            {/* Add Material Button */}
            <button
                className="btn add-material-btn mb-3"
                onClick={() => setShowModal(true)}
            >
                + Add Craft Material
            </button>

            {/* Modal for Adding/Editing Material */}
            {showModal && (
                <div className="modal fade show d-block animate__animated animate__fadeIn" tabIndex="-1">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{isEditing ? "Edit" : "Add New"} Craft Material</h5>
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
                                    placeholder="Material Name"
                                    value={materialData.name}
                                    onChange={handleChange}
                                />
                                <input
                                    className="form-control mb-2"
                                    type="text"
                                    name="description"
                                    placeholder="Description"
                                    value={materialData.description}
                                    onChange={handleChange}
                                />
                                <input
                                    className="form-control mb-2"
                                    type="number"
                                    name="price"
                                    placeholder="Price"
                                    value={materialData.price}
                                    onChange={handleChange}
                                />

                                {/* Category Select Dropdown */}
                                <select
                                    className="form-select mb-2"
                                    name="category"
                                    value={materialData.category}
                                    onChange={handleChange}
                                >
                                    {allCategories.map((category, index) => (
                                        <option key={index} value={category}>
                                            {category}
                                        </option>
                                    ))}
                                </select>

                                {/* Custom Category Input */}
                                {materialData.category === "Others" && (
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
                                        value={materialData.quantity}
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
                                Are you sure you want to delete this craft material?
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                                <button className="btn btn-danger" onClick={() => handleDelete(deleteMaterialId)}>Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Materials List */}
            <h3>Your Craft Materials</h3>
            <div className="row">
                {materials.length === 0 ? (
                    <p>No craft materials found.</p>
                ) : (
                    materials.map((material, index) => (
                        <div key={index} className="col-md-3">
                            <div className="card mb-4 shadow-sm material-card">
                                {material.image && (
                                    <img
                                        style={{ height: "200px", width: "100%", display: "block" }}
                                        className="card-img-top"
                                        src={material.image}
                                        alt={material.name}
                                    />
                                )}
                                <div className="card-body">
                                    <h5 className="card-title">{material.name}</h5>
                                    <p className="card-text">{material.description}</p>
                                    <p className="text-primary fw-bold">₹{material.price}</p>
                                    <p className="text-muted">Category: {material.category}</p>
                                    <p className="text-muted">Quantity: {material.quantity}</p>
                                    <div className="d-flex justify-content-between mt-2">
                                        <button 
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => handleEdit(material)}
                                        >
                                            <FontAwesomeIcon icon={faPenToSquare} /> Edit
                                        </button>
                                        <button 
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => {
                                                setDeleteMaterialId(material._id);
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
                .add-material-btn {
                    background: #3a1d6e;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    transition: all 0.3s ease;
                }
                .add-material-btn:hover {
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
                .material-card {
                    background: white;
                    border: none;
                    transition: all 0.3s ease;
                }
                .material-card:hover {
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

export default MaterialsManager;
