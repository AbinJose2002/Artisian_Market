import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart, faHeart, faCheck } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';

const CraftDetail = () => {
    const { id } = useParams();
    const [material, setMaterial] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const userToken = localStorage.getItem('usertoken') || 
                      localStorage.getItem('sellertoken') || 
                      localStorage.getItem('instructortoken');

    useEffect(() => {
        const fetchMaterialDetails = async () => {
            try {
                const response = await axios.get(`http://localhost:8080/material/${id}`);
                if (response.data.success) {
                    setMaterial(response.data.material);
                }
            } catch (error) {
                console.error("Error fetching craft material details:", error);
                toast.error("Failed to load craft material details");
            } finally {
                setLoading(false);
            }
        };

        fetchMaterialDetails();
    }, [id]);

    const handleAddToCart = async () => {
        console.log('hi')
        if (!userToken) {
            toast.warning("Please login to add items to cart!!");
            return;
        }

        try {
            const response = await axios.post(
                'http://localhost:8080/material/cart/add',
                { material_id: id, quantity },
                { headers: { Authorization: `Bearer ${userToken}` } }
            );

            if (response.data.success) {
                toast.success("Added to cart successfully!");
            }
        } catch (error) {
            toast.error("Failed to add to cart");
            console.error("Error adding to cart:", error);
        }
    };

    const handleAddToWishlist = async () => {
        if (!userToken) {
            toast.warning("Please login to add items to wishlist");
            return;
        }

        try {
            const response = await axios.post(
                'http://localhost:8080/material/wishlist/add',
                { material_id: id },
                { headers: { Authorization: `Bearer ${userToken}` } }
            );

            if (response.data.success) {
                toast.success("Added to wishlist!");
            }
        } catch (error) {
            toast.error("Failed to add to wishlist");
            console.error("Error adding to wishlist:", error);
        }
    };

    if (loading) {
        return (
            <div className="container my-5 text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading craft material details...</p>
            </div>
        );
    }

    if (!material) {
        return (
            <div className="container my-5 text-center">
                <h2>Craft Material Not Found</h2>
                <p>The craft material you're looking for does not exist or has been removed.</p>
            </div>
        );
    }

    return (
        <div className="container my-5">
            <div className="row">
                <div className="col-md-6">
                    {material.image ? (
                        <img 
                            src={material.image} 
                            alt={material.name} 
                            className="img-fluid rounded material-detail-image"
                        />
                    ) : (
                        <div className="placeholder-image-large">No Image Available</div>
                    )}
                </div>
                <div className="col-md-6">
                    <h2 className="mb-3">{material.name}</h2>
                    <p className="text-muted mb-3">Category: {material.category}</p>
                    <h4 className="text-primary mb-4">₹{material.price}</h4>
                    
                    <div className="mb-4">
                        <h5>Description</h5>
                        <p>{material.description}</p>
                    </div>
                    
                    <div className="mb-4">
                        <div className="d-flex align-items-center">
                            <span className={`stock-badge ${material.quantity > 0 ? 'in-stock' : 'out-of-stock'}`}>
                                {material.quantity > 0 ? 'In Stock' : 'Out of Stock'}
                            </span>
                            {material.quantity > 0 && (
                                <span className="ms-2 text-muted">({material.quantity} available)</span>
                            )}
                        </div>
                    </div>
                    
                    {material.quantity > 0 && (
                        <div className="mb-4">
                            <label htmlFor="quantity" className="form-label">Quantity</label>
                            <div className="input-group" style={{ width: '150px' }}>
                                <button 
                                    className="btn btn-outline-secondary" 
                                    type="button"
                                    onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                                >-</button>
                                <input 
                                    type="text" 
                                    className="form-control text-center" 
                                    id="quantity" 
                                    value={quantity}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        if (!isNaN(val) && val > 0 && val <= material.quantity) {
                                            setQuantity(val);
                                        }
                                    }}
                                />
                                <button 
                                    className="btn btn-outline-secondary" 
                                    type="button"
                                    onClick={() => quantity < material.quantity && setQuantity(quantity + 1)}
                                >+</button>
                            </div>
                        </div>
                    )}
                    
                    <div className="d-flex mb-4">
                        <button 
                            className="btn btn-primary me-2" 
                            onClick={handleAddToCart}
                            disabled={material.quantity <= 0}
                        >
                            <FontAwesomeIcon icon={faShoppingCart} className="me-2" />
                            Add to Cart
                        </button>
                        <button 
                            className="btn btn-outline-danger" 
                            onClick={handleAddToWishlist}
                        >
                            <FontAwesomeIcon icon={faHeart} className="me-2" />
                            Add to Wishlist
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .material-detail-image {
                    max-height: 500px;
                    object-fit: contain;
                    width: 100%;
                }
                .placeholder-image-large {
                    height: 400px;
                    background-color: #f0f0f0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #999;
                    border-radius: 5px;
                }
                .stock-badge {
                    display: inline-block;
                    padding: 4px 10px;
                    border-radius: 20px;
                    font-size: 0.85rem;
                    font-weight: 500;
                }
                .in-stock {
                    background-color: #d4edda;
                    color: #155724;
                }
                .out-of-stock {
                    background-color: #f8d7da;
                    color: #721c24;
                }
            `}</style>
        </div>
    );
};

export default CraftDetail;
