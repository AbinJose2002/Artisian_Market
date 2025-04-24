import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faShoppingCart, faPalette, faTools } from '@fortawesome/free-solid-svg-icons';

const WishList = () => {
    const [wishlistItems, setWishlistItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Get most appropriate token
    const userToken = localStorage.getItem('usertoken');
    const sellerToken = localStorage.getItem('sellertoken');
    const instructorToken = localStorage.getItem('instructortoken');
    
    // Use usertoken as priority, fall back to others if needed
    const token = userToken || sellerToken || instructorToken;

    useEffect(() => {
        if (!token) {
            toast.warning("Please login to view your wishlist");
            navigate('/login');
            return;
        }
        
        fetchAllWishlistItems();
    }, [token, navigate]);

    const fetchAllWishlistItems = async () => {
        setLoading(true);
        try {
            // Get product wishlist items
            const productResponse = await axios.get('http://localhost:8080/product/wishlist', {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            // Get material wishlist items
            const materialResponse = await axios.get('http://localhost:8080/material/wishlist', {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            let allItems = [];
            
            // Add products with type indicator
            if (productResponse.data.success) {
                const productItems = productResponse.data.items.map(item => ({
                    ...item,
                    itemType: 'product'
                }));
                allItems = [...allItems, ...productItems];
            }
            
            // Add materials with type indicator
            if (materialResponse.data.success) {
                const materialItems = materialResponse.data.items.map(item => ({
                    ...item,
                    itemType: 'material'
                }));
                allItems = [...allItems, ...materialItems];
            }
            
            setWishlistItems(allItems);
            
        } catch (error) {
            console.error('Error fetching wishlist items:', error);
            toast.error("Failed to load wishlist items");
            
            // If error is due to invalid token, redirect to login
            if (error.response?.status === 401 || error.response?.status === 422) {
                localStorage.removeItem('usertoken');
                localStorage.removeItem('sellertoken');
                localStorage.removeItem('instructortoken');
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const removeFromWishlist = async (itemId, itemType) => {
        try {
            if (itemType === 'product') {
                await axios.delete(`http://localhost:8080/product/wishlist/remove/${itemId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else if (itemType === 'material') {
                await axios.delete(`http://localhost:8080/material/wishlist/remove/${itemId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            
            toast.success('Item removed from wishlist');
            fetchAllWishlistItems();
        } catch (error) {
            console.error('Error removing item:', error);
            toast.error('Failed to remove item');
        }
    };

    const addToCart = async (itemId, itemType) => {
        try {
            if (itemType === 'product') {
                await axios.post(
                    'http://localhost:8080/product/cart/add',
                    { product_id: itemId },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } else if (itemType === 'material') {
                await axios.post(
                    'http://localhost:8080/material/cart/add',
                    { material_id: itemId },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }
            
            toast.success('Added to cart');
        } catch (error) {
            console.error('Error adding to cart:', error);
            toast.error('Failed to add to cart');
        }
    };

    const getItemLink = (item) => {
        if (item.itemType === 'product') {
            return `/product/${item._id}`;
        } else {
            return `/craft/${item._id}`;
        }
    };

    const getItemIcon = (itemType) => {
        if (itemType === 'product') {
            return <FontAwesomeIcon icon={faPalette} className="text-primary me-2" />;
        } else {
            return <FontAwesomeIcon icon={faTools} className="text-success me-2" />;
        }
    };

    if (loading) return <div className="text-center py-5">Loading...</div>;

    return (
        <div className="container py-5">
            <h2 className="mb-4">My Wishlist</h2>
            {wishlistItems.length === 0 ? (
                <div className="text-center">
                    <p>Your wishlist is empty</p>
                    <div className="mt-3">
                        <button 
                            className="btn btn-primary me-2"
                            onClick={() => navigate('/shop')}
                        >
                            Browse Products
                        </button>
                        <button 
                            className="btn btn-success"
                            onClick={() => navigate('/crafts')}
                        >
                            Browse Craft Materials
                        </button>
                    </div>
                </div>
            ) : (
                <div className="row">
                    {wishlistItems.map(item => (
                        <div key={`${item.itemType}-${item._id}`} className="col-md-3 mb-4">
                            <div className="card h-100">
                                <Link to={getItemLink(item)}>
                                    <img 
                                        src={item.image} 
                                        alt={item.name} 
                                        className="card-img-top"
                                        style={{ height: "200px", objectFit: "cover" }}
                                    />
                                </Link>
                                <div className="card-body">
                                    <h5 className="card-title">
                                        {getItemIcon(item.itemType)}
                                        <Link to={getItemLink(item)} className="text-decoration-none">
                                            {item.name}
                                        </Link>
                                    </h5>
                                    <p className="card-text">₹{item.price}</p>
                                    <p className="card-text text-muted small">
                                        {item.itemType === 'product' ? 'Art Product' : 'Craft Material'}
                                    </p>
                                </div>
                                <div className="card-footer bg-white d-flex justify-content-between">
                                    <button 
                                        className="btn btn-danger btn-sm"
                                        onClick={() => removeFromWishlist(item._id, item.itemType)}
                                    >
                                        <FontAwesomeIcon icon={faTrash} /> Remove
                                    </button>
                                    <button 
                                        className="btn btn-primary btn-sm"
                                        onClick={() => addToCart(item._id, item.itemType)}
                                    >
                                        <FontAwesomeIcon icon={faShoppingCart} /> Add to Cart
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default WishList;
