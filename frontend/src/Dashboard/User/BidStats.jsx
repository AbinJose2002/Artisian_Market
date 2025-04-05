import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const BidStats = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        active_count: 0,
        won_count: 0,
        lost_count: 0,
        pending_count: 0,
        approved_count: 0,
        rejected_count: 0,
        total_active_bids: 0,
        category_stats: []
    });

    useEffect(() => {
        fetchBidStats();
    }, []);

    const fetchBidStats = async () => {
        try {
            const token = localStorage.getItem('usertoken');
            if (!token) {
                setLoading(false);
                return;
            }

            const response = await axios.get('http://localhost:8080/bids/summary', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setStats(response.data.stats);
            }
        } catch (error) {
            console.error('Error fetching bid statistics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bid-stats">
            <h3 className="mb-4">Your Bid Activity</h3>
            
            <div className="row g-4">
                <div className="col-md-4">
                    <div className="card bg-primary text-white h-100">
                        <div className="card-body">
                            <h5 className="card-title">Active Bids</h5>
                            <p className="fs-1 mb-0">{stats.active_count}</p>
                            <p className="mb-0">Bids you're currently participating in</p>
                        </div>
                        <div className="card-footer bg-transparent border-0">
                            <Link 
                                to="#" 
                                onClick={() => document.querySelector('button[data-id="bids"]').click()}
                                className="text-white text-decoration-none"
                            >
                                View Active Bids
                            </Link>
                        </div>
                    </div>
                </div>
                
                <div className="col-md-4">
                    <div className="card bg-success text-white h-100">
                        <div className="card-body">
                            <h5 className="card-title">Won Auctions</h5>
                            <p className="fs-1 mb-0">{stats.won_count}</p>
                            <p className="mb-0">Bids you've successfully won</p>
                        </div>
                        <div className="card-footer bg-transparent border-0">
                            <Link 
                                to="#" 
                                onClick={() => {
                                    document.querySelector('button[data-id="bids"]').click();
                                    // Find and click the "Won Bids" tab
                                    setTimeout(() => {
                                        const wonBidsTab = document.querySelector('.nav-link:contains("Won Bids")');
                                        if (wonBidsTab) wonBidsTab.click();
                                    }, 100);
                                }}
                                className="text-white text-decoration-none"
                            >
                                View Won Auctions
                            </Link>
                        </div>
                    </div>
                </div>
                
                <div className="col-md-4">
                    <div className="card bg-info text-white h-100">
                        <div className="card-body">
                            <h5 className="card-title">Requested Bids</h5>
                            <p className="fs-1 mb-0">{stats.pending_count + stats.approved_count + stats.rejected_count}</p>
                            <p className="mb-0">Bids you've requested</p>
                        </div>
                        <div className="card-footer bg-transparent border-0 d-flex justify-content-between align-items-center">
                            <span className="badge bg-success">{stats.approved_count} Approved</span>
                            <span className="badge bg-warning">{stats.pending_count} Pending</span>
                            <span className="badge bg-danger">{stats.rejected_count} Rejected</span>
                        </div>
                    </div>
                </div>
            </div>
            
            {stats.category_stats && stats.category_stats.length > 0 && (
                <div className="card mt-4">
                    <div className="card-header">
                        <h5 className="mb-0">Popular Categories</h5>
                    </div>
                    <div className="card-body">
                        <div className="row">
                            {stats.category_stats.map((category, index) => (
                                <div key={index} className="col-md-3 mb-3">
                                    <div className="p-3 border rounded text-center">
                                        <h6 className="mb-2">{category.name}</h6>
                                        <span className="badge bg-primary fs-6">{category.count} Items</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            
            <div className="d-flex justify-content-center mt-4">
                <Link to="/bids" className="btn btn-outline-primary">
                    Browse Available Auctions
                </Link>
            </div>
        </div>
    );
};

export default BidStats;
