// src/components/Sidebar.js
import React from 'react';

function Sidebar({ setSelected }) {
    const menuItems = [
        { id: 'events', label: 'Manage Events', icon: '📅' },
        { id: 'participants', label: 'Participants', icon: '👥' },
        { id: 'earnings', label: 'Earnings', icon: '💰' },
        { id: 'bids', label: 'Manage Bids', icon: '🔨' },
        { id: 'mybids', label: 'My Bid History', icon: '📊' },
        { id: 'profile', label: 'Profile', icon: '⚙️' }
    ];

    return (
        <div style={{ 
            width: '250px', 
            minHeight: '100vh', 
            padding: '20px',
            backgroundColor: 'var(--primary-color)',
            color: 'white'
        }}>
            <h3 className="mb-4">Instructor Panel</h3>
            <div className="d-flex flex-column gap-2">
                {menuItems.map(item => (
                    <button 
                        key={item.id}
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

export default Sidebar;