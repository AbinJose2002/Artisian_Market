// src/components/Dashboard.js
import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Home = () => {
    const [selected, setSelected] = useState('case'); // Default selected link
    
    
    return (
        <>
            {/* <Navbar /> */}
            <div style={{ display: 'flex' }}>
                <Sidebar setSelected={setSelected} />
                <div style={{ padding: '20px', flex: 1 }}>
                    {/* <h2>Selected: {selected}</h2> Display the selected link */}
                    {(() => {
    switch (selected) {
        // case 'case':
        //     return <Case />;  // Added return
        // case 'profile':
        //     return <Profile />;
        // case 'payment':
        //     return <Payment />;
        // case 'document':
        //     return <Document />;
        // case 'consult':
        //     return <Consultation />;
        // default:
        //     return <Case />;
    }
})()}
                    <Outlet />
                </div>
            </div>
        </>
    );
};

export default Home;