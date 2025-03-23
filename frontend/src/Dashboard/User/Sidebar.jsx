// src/components/Sidebar.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight, faFileAlt, faMoneyBill, faFolder, faComments, faUser, faHeart, faCartShopping  } from '@fortawesome/free-solid-svg-icons';
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
                <li onClick={() => setSelected('event')}>
                    <FontAwesomeIcon icon={faHeart} style={{ marginRight: '10px', display: isCollapsed ? 'none' : 'block' }} />
                    <Link  style={{ display: isCollapsed ? 'none' : 'block' }}>Event</Link>
                </li>
                <li onClick={() => setSelected('order')}>
                    <FontAwesomeIcon icon={faCartShopping} style={{ marginRight: '10px', display: isCollapsed ? 'none' : 'block' }} />
                    <Link style={{ display: isCollapsed ? 'none' : 'block' }}>Orders</Link>
                </li>
                <li onClick={() => setSelected('profile')}>
                    <FontAwesomeIcon icon={faUser} style={{ marginRight: '10px', display: isCollapsed ? 'none' : 'block' }} />
                    <Link style={{ display: isCollapsed ? 'none' : 'block' }}>Profile</Link>
                </li>
                {/* <li onClick={() => setSelected('consult')}> */}
                    {/* <FontAwesomeIcon icon={faComments} style={{ marginRight: '10px', display: isCollapsed ? 'none' : 'block' }} /> */}
                    {/* <Link style={{ display: isCollapsed ? 'none' : 'block' }}>Consult</Link>
                </li> */}
                {/* <li onClick={() => setSelected('profile')}> */}
                    {/* <FontAwesomeIcon icon={faUser } style={{ marginRight: '10px', display: isCollapsed ? 'none' : 'block' }} /> */}
                    {/* <Link style={{ display: isCollapsed ? 'none' : 'block' }}>Profile</Link>
                </li> */}
            </ul>
        </div>
    );
};

export default Sidebar;