import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import AddProduct from './AddProduct';
import MaterialsManager from './MaterialsManager'; // Import the new component
// ...import other components...

const Dashboard = () => {
    const [selected, setSelected] = useState('dashboard');
    const navigate = useNavigate();
    
    useEffect(() => {
        const token = localStorage.getItem('sellertoken');
        if (!token) {
            navigate('/seller-login');
        }
    }, [navigate]);

    const renderComponent = () => {
        switch (selected) {
            case 'dashboard':
                return <DashboardMain />;
            case 'products':
                return <AddProduct />;
            case 'materials': // New case for materials
                return <MaterialsManager />;
            case 'orders':
                return <Orders />;
            case 'bids':
                return <BidListing />;
            case 'bidrequests':
                return <BidRequests />;
            case 'profile':
                return <Profile />;
            default:
                return <DashboardMain />;
        }
    };

    return (
        <div style={{ display: 'flex' }}>
            <Sidebar setSelected={setSelected} />
            <div style={{ flex: 1, padding: '20px' }}>
                {renderComponent()}
            </div>
        </div>
    );
};

export default Dashboard;
