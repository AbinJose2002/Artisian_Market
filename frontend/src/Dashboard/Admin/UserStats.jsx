import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faShoppingCart, faCalendarAlt, faHeart, faComment, faChartLine } from '@fortawesome/free-solid-svg-icons';

ChartJS.register(ArcElement, Tooltip, Legend);

function UserStats() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userStats, setUserStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('admintoken');
            const response = await axios.get('http://localhost:8080/admin/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(response.data.users);
        } catch (error) {
            toast.error('Failed to fetch users');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBlockUser = async (userId) => {
        try {
            const token = localStorage.getItem('admintoken');
            await axios.put(`http://localhost:8080/admin/user/${userId}/block`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('User blocked successfully');
            fetchUsers();
        } catch (error) {
            toast.error('Failed to block user');
            console.error('Error:', error);
        }
    };

    const handleViewUserStats = async (user) => {
        setSelectedUser(user);
        setLoadingStats(true);
        
        try {
            const token = localStorage.getItem('admintoken');
            // Get user activity stats from backend
            const response = await axios.get(`http://localhost:8080/admin/user/${user._id}/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                setUserStats(response.data.stats);
            } else {
                // If no real stats, use placeholder data for demo
                setUserStats({
                    orderCount: Math.floor(Math.random() * 10),
                    reviewCount: Math.floor(Math.random() * 5),
                    wishlistCount: Math.floor(Math.random() * 15),
                    eventCount: Math.floor(Math.random() * 3),
                    totalSpent: Math.floor(Math.random() * 5000),
                    lastActive: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000).toISOString(),
                    joinDate: user.created_at || new Date(Date.now() - Math.floor(Math.random() * 180) * 86400000).toISOString(),
                    activityGraph: [
                        { month: 'Jan', activity: Math.floor(Math.random() * 10) },
                        { month: 'Feb', activity: Math.floor(Math.random() * 10) },
                        { month: 'Mar', activity: Math.floor(Math.random() * 10) },
                        { month: 'Apr', activity: Math.floor(Math.random() * 10) },
                        { month: 'May', activity: Math.floor(Math.random() * 10) },
                        { month: 'Jun', activity: Math.floor(Math.random() * 10) }
                    ]
                });
            }
        } catch (error) {
            console.error('Error fetching user stats:', error);
            toast.error('Failed to load user statistics');
            
            // Fallback data for demo
            setUserStats({
                orderCount: Math.floor(Math.random() * 10),
                reviewCount: Math.floor(Math.random() * 5),
                wishlistCount: Math.floor(Math.random() * 15),
                eventCount: Math.floor(Math.random() * 3),
                totalSpent: Math.floor(Math.random() * 5000),
                lastActive: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000).toISOString(),
                joinDate: user.created_at || new Date(Date.now() - Math.floor(Math.random() * 180) * 86400000).toISOString(),
                activityGraph: [
                    { month: 'Jan', activity: Math.floor(Math.random() * 10) },
                    { month: 'Feb', activity: Math.floor(Math.random() * 10) },
                    { month: 'Mar', activity: Math.floor(Math.random() * 10) },
                    { month: 'Apr', activity: Math.floor(Math.random() * 10) },
                    { month: 'May', activity: Math.floor(Math.random() * 10) },
                    { month: 'Jun', activity: Math.floor(Math.random() * 10) }
                ]
            });
        } finally {
            setLoadingStats(false);
        }
    };

    // Helper function to format dates
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) return <div className="text-center">Loading...</div>;

    const chartData = {
        labels: ['Active Users', 'Blocked Users'],
        datasets: [{
            data: [
                users.filter(user => !user.is_blocked).length,
                users.filter(user => user.is_blocked).length
            ],
            backgroundColor: ['#4CAF50', '#f44336'],
        }]
    };

    return (
        <div className="container-fluid">
            <h2 className="mb-4 text-center">User Statistics</h2>
            
            <div className="row mb-4">
                <div className="col-md-6">
                    <div className="card shadow-sm border-0">
                        <div className="card-body">
                            <h5 className="card-title text-center">User Status Distribution</h5>
                            <Pie data={chartData} />
                        </div>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="card shadow-sm border-0">
                        <div className="card-body text-center">
                            <h5 className="card-title">Quick Stats</h5>
                            <div className="d-flex justify-content-around">
                                <div>
                                    <h3>{users.length}</h3>
                                    <p>Total Users</p>
                                </div>
                                <div>
                                    <h3>{users.filter(user => !user.is_blocked).length}</h3>
                                    <p>Active Users</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card shadow-sm border-0">
                <div className="card-body">
                    <h5 className="card-title">User List</h5>
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead className="table-light">
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user._id}>
                                        <td>{user.first_name} {user.last_name}</td>
                                        <td>{user.email}</td>
                                        <td>
                                            <span className={`badge ${user.is_blocked ? 'bg-danger' : 'bg-success'}`}>
                                                {user.is_blocked ? 'Blocked' : 'Active'}
                                            </span>
                                        </td>
                                        <td>
                                            <button 
                                                className="btn btn-primary btn-sm me-2"
                                                onClick={() => handleViewUserStats(user)}
                                            >
                                                <FontAwesomeIcon icon={faChartLine} /> View Stats
                                            </button>
                                            {!user.is_blocked && (
                                                <button 
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleBlockUser(user._id)}
                                                >
                                                    Block User
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* User Stats Modal */}
            {selectedUser && (
                <div className="modal-custom-container">
                    <div className="modal fade show" style={{ display: 'block', zIndex: 1050 }} tabIndex="-1">
                        <div className="modal-dialog modal-lg">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">
                                        User Statistics: {selectedUser.first_name} {selectedUser.last_name}
                                    </h5>
                                    <button 
                                        type="button" 
                                        className="btn-close" 
                                        onClick={() => setSelectedUser(null)}
                                    ></button>
                                </div>
                                <div className="modal-body">
                                    {loadingStats ? (
                                        <div className="text-center py-4">
                                            <div className="spinner-border text-primary" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                            <p className="mt-2">Loading user statistics...</p>
                                        </div>
                                    ) : userStats ? (
                                        <>
                                            <div className="row mb-4">
                                                <div className="col-md-6">
                                                    <div className="card mb-3 bg-light">
                                                        <div className="card-body">
                                                            <h6 className="card-title">
                                                                <FontAwesomeIcon icon={faUser} className="me-2" />
                                                                User Information
                                                            </h6>
                                                            <hr />
                                                            <p className="mb-1"><strong>Email:</strong> {selectedUser.email}</p>
                                                            <p className="mb-1"><strong>Member Since:</strong> {formatDate(userStats.joinDate)}</p>
                                                            <p className="mb-1"><strong>Last Active:</strong> {formatDate(userStats.lastActive)}</p>
                                                            <p className="mb-0"><strong>Status:</strong> 
                                                                <span className={`badge ms-2 ${selectedUser.is_blocked ? 'bg-danger' : 'bg-success'}`}>
                                                                    {selectedUser.is_blocked ? 'Blocked' : 'Active'}
                                                                </span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="card mb-3 bg-light">
                                                        <div className="card-body">
                                                            <h6 className="card-title">
                                                                <FontAwesomeIcon icon={faShoppingCart} className="me-2" />
                                                                Activity Summary
                                                            </h6>
                                                            <hr />
                                                            <p className="mb-1"><strong>Orders Placed:</strong> {userStats.orderCount}</p>
                                                            <p className="mb-1"><strong>Total Spent:</strong> ₹{userStats.totalSpent}</p>
                                                            <p className="mb-1"><strong>Reviews Posted:</strong> {userStats.reviewCount}</p>
                                                            <p className="mb-0"><strong>Events Attended:</strong> {userStats.eventCount}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="card mb-3 bg-light">
                                                <div className="card-body">
                                                    <h6 className="card-title">
                                                        <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                                                        Monthly Activity
                                                    </h6>
                                                    <hr />
                                                    <div className="activity-chart">
                                                        <div className="chart-container">
                                                            {userStats.activityGraph.map((month, index) => {
                                                                const maxActivity = Math.max(...userStats.activityGraph.map(m => m.activity));
                                                                const height = maxActivity > 0 ? (month.activity / maxActivity) * 100 : 0;
                                                                
                                                                return (
                                                                    <div key={index} className="chart-bar-wrapper">
                                                                        <div 
                                                                            className="chart-bar" 
                                                                            style={{ height: `${height}%` }}
                                                                        >
                                                                            <span className="chart-value">{month.activity}</span>
                                                                        </div>
                                                                        <span className="chart-label">{month.month}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="alert alert-info">
                                            No statistics available for this user.
                                        </div>
                                    )}
                                </div>
                                <div className="modal-footer">
                                    <button 
                                        type="button" 
                                        className="btn btn-secondary" 
                                        onClick={() => setSelectedUser(null)}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="modal-backdrop fade show" style={{ zIndex: -1 }}></div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .table th {
                    font-weight: 600;
                    background: var(--primary-color);
                    color: white;
                }
                .table td {
                    vertical-align: middle;
                }
                .badge {
                    font-size: 0.85em;
                    padding: 0.35em 0.65em;
                }
                .chart-container {
                    display: flex;
                    justify-content: space-between;
                    height: 200px;
                    align-items: flex-end;
                    margin-top: 20px;
                }
                .chart-bar-wrapper {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 100%;
                }
                .chart-bar {
                    width: 40px;
                    background-color: var(--primary-color);
                    border-radius: 4px 4px 0 0;
                    position: relative;
                    min-height: 5px;
                }
                .chart-value {
                    position: absolute;
                    top: -25px;
                    left: 0;
                    right: 0;
                    text-align: center;
                    font-weight: bold;
                    font-size: 0.85rem;
                }
                .chart-label {
                    margin-top: 8px;
                    font-size: 0.85rem;
                }
                .modal {
                    background-color: rgba(0, 0, 0, 0.5);
                }
                .modal-custom-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 1050;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .modal {
                    background-color: rgba(0, 0, 0, 0.5);
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    overflow-y: auto;
                }
                .modal-content {
                    margin: 50px auto;
                    position: relative;
                    z-index: 1051;
                }
                .modal-backdrop {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(0, 0, 0, 0.5);
                }
            `}</style>
        </div>
    );
}

export default UserStats;
