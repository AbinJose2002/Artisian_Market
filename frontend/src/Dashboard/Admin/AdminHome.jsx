import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import Dashboard from './Dashboard';
import UserStats from './UserStats';
import InstructorStats from './InstructorStats';
import SellerStats from './SellerStats';
import BidRequests from './BidRequests';  // Add this import

function AdminHome() {
    const [selected, setSelected] = useState('dashboard');

    const renderContent = () => {
        switch(selected) {
            case 'dashboard':
                return <Dashboard />;
            case 'users':
                return <UserStats />;
            case 'instructors':
                return <InstructorStats />;
            case 'sellers':
                return <SellerStats />;
            case 'bids':
                return <BidRequests />;
            default:
                return <Dashboard />;
        }
    };

    return (
        <div style={{ display: 'flex' }}>
            <AdminSidebar setSelected={setSelected} />
            <div style={{ padding: '20px', flex: 1 }}>
                {renderContent()}
                <Outlet />
            </div>
        </div>
    );
}

export default AdminHome;
