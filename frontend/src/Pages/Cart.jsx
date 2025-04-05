import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { toast } from 'react-toastify';

const stripePromise = loadStripe('pk_test_51Pf271RrUp4W2KP556GuzSY5xDEQOiH0FdTiNpHsBByUhWgscyRiBbXqpK0dr0S0ShP71FFOKl4oddnXGhBDqRly00ekAPON9R');

const Cart = () => {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchCartItems();
    }, []);

    const fetchCartItems = async () => {
        try {
            const token = localStorage.getItem('usertoken');
            const response = await axios.get('http://localhost:8080/product/cart', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCartItems(response.data.items);
        } catch (error) {
            console.error('Error fetching cart:', error);
        } finally {
            setLoading(false);
        }
    };

    const removeFromCart = async (productId) => {
        try {
            const token = localStorage.getItem('usertoken');
            await axios.delete(`http://localhost:8080/product/cart/remove/${productId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchCartItems();
        } catch (error) {
            console.error('Error removing item:', error);
        }
    };

    const verifyStock = async (items) => {
        try {
            const token = localStorage.getItem('usertoken');
            for (let item of items) {
                const response = await axios.post(
                    'http://localhost:8080/product/verify/stock',
                    { product_id: item._id },
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
            // Verify stock before checkout
            const stockAvailable = await verifyStock(cartItems);
            if (!stockAvailable) {
                return;
            }

            const token = localStorage.getItem('usertoken');
            const response = await axios.post(
                'http://localhost:8080/payment/create-cart-session',
                { items: cartItems },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const stripe = await stripePromise;
            await stripe.redirectToCheckout({
                sessionId: response.data.sessionId
            });
        } catch (error) {
            console.error('Checkout error:', error);
            toast.error('Checkout failed. Please try again.');
        }
    };

    const calculateTotal = () => {
        return cartItems.reduce((sum, item) => sum + Number(item.price), 0);
    };

    if (loading) return <div className="text-center py-5">Loading...</div>;

    return (
        <div className="container py-5">
            <h2 className="mb-4">Shopping Cart</h2>
            {cartItems.length === 0 ? (
                <div className="text-center">
                    <p>Your cart is empty</p>
                    <button 
                        className="btn btn-primary"
                        onClick={() => navigate('/shop')}
                    >
                        Continue Shopping
                    </button>
                </div>
            ) : (
                <>
                    <div className="row">
                        {cartItems.map(item => (
                            <div key={item._id} className="col-12 mb-3">
                                <div className="card">
                                    <div className="card-body d-flex align-items-center">
                                        <img 
                                            src={item.image} 
                                            alt={item.name}
                                            style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                                            className="me-3"
                                        />
                                        <div className="flex-grow-1">
                                            <h5 className="card-title">{item.name}</h5>
                                            <p className="card-text">₹{item.price}</p>
                                        </div>
                                        <button 
                                            className="btn btn-danger"
                                            onClick={() => removeFromCart(item._id)}
                                        >
                                            Remove
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
