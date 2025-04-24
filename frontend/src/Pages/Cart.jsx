import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPalette, faTools } from '@fortawesome/free-solid-svg-icons';
import { loadStripe } from '@stripe/stripe-js';

// Use the correct publishable key from .env file or directly
const stripePromise = loadStripe('pk_test_51Pf271RrUp4W2KP556GuzSY5xDEQOiH0FdTiNpHsBByUhWgscyRiBbXqpK0dr0S0ShP71FFOKl4oddnXGhBDqRly00ekAPON9R');

const Cart = () => {
    const [cartItems, setCartItems] = useState([]);
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
            toast.warning("Please login to view your cart");
            navigate('/login');
            return;
        }
        
        fetchAllCartItems();
    }, [token, navigate]);

    const fetchAllCartItems = async () => {
        setLoading(true);
        try {
            // Get product cart items
            const productResponse = await axios.get('http://localhost:8080/product/cart', {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            // Get material cart items
            const materialResponse = await axios.get('http://localhost:8080/material/cart', {
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
            
            setCartItems(allItems);
            
        } catch (error) {
            console.error('Error fetching cart items:', error);
            toast.error("Failed to load cart items");
            
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

    const removeFromCart = async (itemId, itemType) => {
        try {
            if (itemType === 'product') {
                await axios.delete(`http://localhost:8080/product/cart/remove/${itemId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else if (itemType === 'material') {
                await axios.delete(`http://localhost:8080/material/cart/remove/${itemId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            
            fetchAllCartItems();
            toast.success('Item removed from cart');
        } catch (error) {
            console.error('Error removing item:', error);
            toast.error('Failed to remove item');
        }
    };

    const verifyStock = async (items) => {
        try {
            for (let item of items) {
                let endpoint, payload;
                
                if (item.itemType === 'product') {
                    endpoint = 'http://localhost:8080/product/verify/stock';
                    payload = { product_id: item._id };
                } else {
                    endpoint = 'http://localhost:8080/material/verify/stock';
                    payload = { material_id: item._id };
                }
                    
                const response = await axios.post(
                    endpoint,
                    payload,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                
                if (!response.data.available) {
                    toast.error(`${item.name} is out of stock!`);
                    return false;
                }
            }
            return true;
        } catch (error) {
            console.error('Stock verification error:', error);
            toast.error('Error verifying stock availability');
            return false;
        }
    };

    const handleCheckout = async () => {
        try {
            // Show loading indicator
            toast.info("Processing your request...");
            
            // Verify stock before checkout
            const stockAvailable = await verifyStock(cartItems);
            if (!stockAvailable) {
                return;
            }

            const response = await axios.post(
                'http://localhost:8080/payment/create-cart-session',
                { items: cartItems },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                console.log("Redirecting to Stripe checkout...");
                
                // If URL is provided, use direct redirect instead of stripe.js
                if (response.data.url) {
                    // Direct redirect to Stripe Checkout URL
                    window.location.href = response.data.url;
                } else {
                    // Fallback to old method
                    const stripe = await stripePromise;
                    
                    try {
                        const { error } = await stripe.redirectToCheckout({
                            sessionId: response.data.sessionId
                        });
                        
                        if (error) {
                            console.error("Stripe redirect error:", error.message);
                            toast.error("Payment page couldn't be loaded: " + error.message);
                        }
                    } catch (stripeError) {
                        console.error("Stripe redirect exception:", stripeError);
                        toast.error("Payment system error. Please try again later.");
                    }
                }
            } else {
                toast.error(response.data.message || "Failed to create checkout session");
            }
        } catch (error) {
            console.error('Checkout error:', error.response?.data || error);
            toast.error('Checkout failed: ' + (error.response?.data?.message || "Please try again."));
        }
    };

    const calculateTotal = () => {
        return cartItems.reduce((sum, item) => sum + Number(item.price), 0);
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
            <h2 className="mb-4">Shopping Cart</h2>
            {cartItems.length === 0 ? (
                <div className="text-center">
                    <p>Your cart is empty</p>
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
                <>
                    <div className="row">
                        {cartItems.map(item => (
                            <div key={`${item.itemType}-${item._id}`} className="col-12 mb-3">
                                <div className="card">
                                    <div className="card-body d-flex align-items-center">
                                        <img 
                                            src={item.image} 
                                            alt={item.name}
                                            style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                                            className="me-3"
                                        />
                                        <div className="flex-grow-1">
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
                                        <button 
                                            className="btn btn-danger"
                                            onClick={() => removeFromCart(item._id, item.itemType)}
                                        >
                                            <FontAwesomeIcon icon={faTrash} /> Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="card mt-4">
                        <div className="card-body">
                            <h5>Order Summary</h5>
                            <hr />
                            <div className="d-flex justify-content-between mb-3">
                                <span>Total:</span>
                                <span className="fw-bold">₹{calculateTotal()}</span>
                            </div>
                            <button 
                                className="btn btn-primary w-100"
                                onClick={handleCheckout}
                            >
                                Proceed to Checkout
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Cart;
