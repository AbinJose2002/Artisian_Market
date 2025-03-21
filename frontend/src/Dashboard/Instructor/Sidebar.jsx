// src/components/Sidebar.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight, faFileAlt, faMoneyBill, faFolder, faComments, faUser, faCalendarDays } from '@fortawesome/free-solid-svg-icons';
import './Sidebar.css'; // Import the CSS file

const Sidebar = ({ setSelected }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    return (
        <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <button onClick={toggleSidebar} className="toggle-button">
                <FontAwesomeIcon icon={isCollapsed ? faArrowRight : faArrowLeft} />
            </button>
            <h3 style={{ display: isCollapsed ? 'none' : 'block' }}>Dashboard</h3>
            <ul>
                <li onClick={() => setSelected('case')}>
                    <FontAwesomeIcon icon={faCalendarDays} style={{ marginRight: '10px', display: isCollapsed ? 'none' : 'block' }} />
                    <Link style={{ display: isCollapsed ? 'none' : 'block' }}>Event Details</Link>
                </li>
                <li onClick={() => setSelected('order')}>
                    <FontAwesomeIcon icon={faMoneyBill} style={{ marginRight: '10px', display: isCollapsed ? 'none' : 'block' }} />
                    <Link style={{ display: isCollapsed ? 'none' : 'block' }}>Track Order</Link>
                </li>
                {/*<li onClick={() => setSelected('document')}>
                    <FontAwesomeIcon icon={faFolder} style={{ marginRight: '10px', display: isCollapsed ? 'none' : 'block' }} />
                    <Link style={{ display: isCollapsed ? 'none' : 'block' }}>Document</Link>
                </li>
                <li onClick={() => setSelected('consult')}>
                    <FontAwesomeIcon icon={faComments} style={{ marginRight: '10px', display: isCollapsed ? 'none' : 'block' }} />
                    <Link style={{ display: isCollapsed ? 'none' : 'block' }}>Consult</Link>
                </li>
                <li onClick={() => setSelected('profile')}>
                    <FontAwesomeIcon icon={faUser } style={{ marginRight: '10px', display: isCollapsed ? 'none' : 'block' }} />
                    <Link style={{ display: isCollapsed ? 'none' : 'block' }}>Profile</Link>
                </li> */}
            </ul>
        </div>
    );
};

export default Sidebar;