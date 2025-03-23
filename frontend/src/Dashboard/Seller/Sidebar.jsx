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
            <h3 className="mb-4">Seller Dashboard</h3>
            <div className="d-flex flex-column">
                <button 
                    className="btn btn-outline-light mb-2 text-start"
                    onClick={() => setSelected('products')}
                >
                    Manage Products
                </button>
                <button 
                    className="btn btn-outline-light mb-2 text-start"
                    onClick={() => setSelected('orders')}
                >
                    Manage Orders
                </button>
            </div>
        </div>
    );
}

export default Sidebar;