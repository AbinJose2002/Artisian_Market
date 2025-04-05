// src/components/Sidebar.js
import React from 'react';

function Sidebar({ setSelected }) {
    return (
        <div style={{ 
            width: '250px', 
            minHeight: '100vh', 
            padding: '20px',
            backgroundColor: 'var(--primary-color)',
            color: 'white'
        }}>
            <h3 style={{ marginBottom: '20px' }}>Seller Dashboard</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button 
                    data-id="dashboard"
                    className="btn btn-outline-light text-start" 
                    onClick={() => setSelected('dashboard')}
                >
                    <span className="me-2">📊</span>
                    Dashboard
                </button>
                <button 
                    data-id="products"
                    className="btn btn-outline-light text-start" 
                    onClick={() => setSelected('products')}
                >
                    <span className="me-2">🛍️</span>
                    Products
                </button>
                <button 
                    data-id="orders"
                    className="btn btn-outline-light text-start" 
                    onClick={() => setSelected('orders')}
                >
                    <span className="me-2">📦</span>
                    Orders
                </button>
                <button 
                    data-id="bids"
                    className="btn btn-outline-light text-start" 
                    onClick={() => setSelected('bids')}
                >
                    <span className="me-2">🔨</span>
                    Auction Marketplace
                </button>
                <button 
                    data-id="bidrequests"
                    className="btn btn-outline-light text-start" 
                    onClick={() => setSelected('bidrequests')}
                >
                    <span className="me-2">📝</span>
                    My Bid Requests
                </button>
                <button 
                    data-id="profile"
                    className="btn btn-outline-light text-start" 
                    onClick={() => setSelected('profile')}
                >
                    <span className="me-2">👤</span>
                    Profile
                </button>
                <button 
                    className="btn btn-danger mt-4" 
                    onClick={() => {
                        localStorage.removeItem('sellertoken');
                        window.location.href = "/seller-login";
                    }}
                >
                    <span className="me-2">🚪</span>
                    Logout
                </button>
            </div>
        </div>
    );
}

// Add this default export statement to fix the issue
export default Sidebar;