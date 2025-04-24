// src/components/Dashboard.js
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import UserSidebar from './UserSidebar';
import UserDashboard from './UserDashboard';
import OrderDetails from './OrderDetails';
import Reviews from './Reviews';
import MyReviews from './MyReviews';
import Events from './Events';
import UserBids from './UserBids'; // Add this import
import Profile from './Profile';

function Home() {
    const [selected, setSelected] = useState('dashboard');

    const renderContent = () => {
        switch(selected) {
            case 'dashboard':
                return <UserDashboard />;
            case 'orders':
                return <OrderDetails />;
            case 'events':
                return <Events />;
            case 'bids': // Add this case
                return <UserBids />;
            case 'reviews':
                return <Reviews />;
            case 'profile':
                return <Profile />;
            case 'myreviews':
                return <MyReviews />;
            default:
                return <UserDashboard />;
        }
    };

    return (
        <div style={{ display: 'flex' }}>
            <UserSidebar setSelected={setSelected} />
            <div style={{ padding: '20px', flex: 1 }}>
                {renderContent()}
                <Outlet />
            </div>
        </div>
    );
}

export default Home;