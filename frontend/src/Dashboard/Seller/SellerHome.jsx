// src/components/Dashboard.js
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Orders from './Orders';
import AddProduct from './AddProduct';

const SellerHome = () => {
    const [selected, setSelected] = useState('products');

    return (
        <div style={{ display: 'flex' }}>
            <Sidebar setSelected={setSelected} />
            <div style={{ padding: '20px', flex: 1 }}>
                {selected === 'orders' && <Orders />}
                {selected === 'products' && <AddProduct />}
                <Outlet />
            </div>
        </div>
    );
};

export default SellerHome;