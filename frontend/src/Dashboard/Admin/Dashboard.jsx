import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('admintoken');
                const response = await axios.get(
                    'http://localhost:8080/admin/dashboard/stats',
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setStats(response.data.stats);
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="text-center">Loading...</div>;

    const chartData = {
        labels: ['Users', 'Instructors', 'Events', 'Products'],
        datasets: [
            {
                label: 'Platform Statistics',
                data: [
                    stats.total_users,
                    stats.total_instructors,
                    stats.total_events,
                    stats.total_products
                ],
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }
        ]
    };

    return (
        <div className="container-fluid">
            <h2 className="mb-4 text-center">Dashboard Overview</h2>
            
            <div className="row g-4 mb-4">
                <div className="col-md-3">
                    <div className="card shadow-sm border-0 bg-primary text-white">
                        <div className="card-body text-center">
                            <h5>Total Users</h5>
                            <h2>{stats.total_users}</h2>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card shadow-sm border-0 bg-success text-white">
                        <div className="card-body text-center">
                            <h5>Total Instructors</h5>
                            <h2>{stats.total_instructors}</h2>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card shadow-sm border-0 bg-info text-white">
                        <div className="card-body text-center">
                            <h5>Total Events</h5>
                            <h2>{stats.total_events}</h2>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card shadow-sm border-0 bg-warning text-white">
                        <div className="card-body text-center">
                            <h5>Total Products</h5>
                            <h2>{stats.total_products}</h2>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card shadow-sm border-0">
                <div className="card-body">
                    <Line data={chartData} options={{
                        responsive: true,
                        plugins: {
                            title: {
                                display: true,
                                text: 'Platform Growth Overview'
                            }
                        }
                    }} />
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
