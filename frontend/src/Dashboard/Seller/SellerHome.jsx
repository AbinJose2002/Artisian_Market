// src/components/Dashboard.js
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import AddProduct from './AddProduct';
import Orders from './Orders';
import SellerProfile from './SellerProfile';
import SellerDashboard from './SellerDashboard';
import SellerBids from './SellerBids';
import SellerBidRequests from './SellerBidRequests';
import MaterialsManager from './MaterialsManager';
import PurchasedItems from './PurchasedItems';

// Fix the export by using a named function declaration and adding default export
function SellerHome() {
    const [selected, setSelected] = useState('dashboard');

    const renderContent = () => {
        switch(selected) {
            case 'dashboard':
                return <SellerDashboard />;
            case 'products':
                return <AddProduct />;
            case 'materials':
                return <MaterialsManager />;
            case 'orders':
                return <Orders />;
            case 'purchased':
                return <PurchasedItems />;
            case 'bids':
                return <SellerBids />;
            case 'bidrequests':
                return <SellerBidRequests />;
            case 'profile':
                return <SellerProfile />;
            default:
                return <SellerDashboard />;
        }
    };

    return (
        <div style={{ display: 'flex' }}>
            <Sidebar setSelected={setSelected} />
            <div style={{ padding: '20px', flex: 1 }}>
                {renderContent()}
                <Outlet />
            </div>
        </div>
    );
}

// Make sure to properly export the component
export default SellerHome;