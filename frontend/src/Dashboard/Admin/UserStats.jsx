import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

function UserStats() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

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
        </div>
    );
}

export default UserStats;
