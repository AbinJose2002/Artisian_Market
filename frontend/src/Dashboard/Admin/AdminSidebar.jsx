import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTachometerAlt, faUsers, faChalkboardTeacher, faStore, faGavel, faComments } from '@fortawesome/free-solid-svg-icons';

function AdminSidebar({ setSelected }) {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <FontAwesomeIcon icon={faTachometerAlt} /> },
        { id: 'users', label: 'User Statistics', icon: <FontAwesomeIcon icon={faUsers} /> },
        { id: 'instructors', label: 'Instructor Statistics', icon: <FontAwesomeIcon icon={faChalkboardTeacher} /> },
        { id: 'sellers', label: 'Seller Statistics', icon: <FontAwesomeIcon icon={faStore} /> },
        { id: 'bids', label: 'Bid Requests', icon: <FontAwesomeIcon icon={faGavel} /> },
        { id: 'complaints', label: 'Complaints', icon: <FontAwesomeIcon icon={faComments} /> }
    ];

    return (
        <div style={{ 
            width: '250px', 
            minHeight: '100vh', 
            padding: '20px',
            backgroundColor: 'var(--primary-color)',
            color: 'white',
            boxShadow: '2px 0 5px rgba(0, 0, 0, 0.1)'
        }}>
            <h3 className="mb-4 text-center">Admin Panel</h3>
            <div className="d-flex flex-column gap-3">
                {menuItems.map(item => (
                    <button 
                        key={item.id}
                        className="btn btn-outline-light text-start py-2 px-3"
                        style={{
                            borderRadius: '8px',
                            transition: 'all 0.3s ease',
                            fontSize: '16px'
                        }}
                        onClick={() => setSelected(item.id)}
                        onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                        <span className="me-2">{item.icon}</span>
                        {item.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default AdminSidebar;
