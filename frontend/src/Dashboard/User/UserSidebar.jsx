import React from 'react';

function UserSidebar({ setSelected }) {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'orders', label: 'My Orders', icon: '🛍️' },
        { id: 'events', label: 'My Events', icon: '🎭' },
        { id: 'bids', label: 'My Bids', icon: '🔨' }, // Add this new item
        { id: 'reviews', label: 'Write Reviews', icon: '✏️' },
        { id: 'myreviews', label: 'My Reviews', icon: '⭐' },
        { id: 'profile', label: 'Profile', icon: '👤' }
    ];

    return (
        <div style={{ 
            width: '250px', 
            minHeight: '100vh', 
            padding: '20px',
            backgroundColor: 'var(--primary-color)',
            color: 'white'
        }}>
            <h3 className="mb-4">User Dashboard</h3>
            <div className="d-flex flex-column gap-2">
                {menuItems.map(item => (
                    <button 
                        key={item.id}
                        data-id={item.id}
                        className="btn btn-outline-light text-start"
                        onClick={() => setSelected(item.id)}
                    >
                        <span className="me-2">{item.icon}</span>
                        {item.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default UserSidebar;
