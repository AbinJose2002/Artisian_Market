import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const Earnings = () => {
    const [earnings, setEarnings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEarnings = async () => {
            try {
                const token = localStorage.getItem('instructortoken');
                const response = await axios.get(
                    'http://localhost:8080/instructor/events',
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                // Calculate earnings for each event
                const eventEarnings = response.data.events.map(event => ({
                    ...event,
                    totalEarnings: (event.registered_users || []).length * parseFloat(event.fee)
                }));

                setEarnings(eventEarnings);
            } catch (error) {
                console.error('Error fetching earnings:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchEarnings();
    }, []);

    const chartData = {
        labels: earnings.map(event => event.name),
        datasets: [
            {
                label: 'Event Earnings (₹)',
                data: earnings.map(event => event.totalEarnings),
                backgroundColor: 'rgba(58, 29, 110, 0.8)',
                borderColor: 'rgba(58, 29, 110, 1)',
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Event-wise Earnings',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Amount (₹)'
                }
            }
        }
    };

    if (loading) return <div className="text-center py-5">Loading...</div>;

    const totalEarnings = earnings.reduce((sum, event) => sum + event.totalEarnings, 0);

    return (
        <div className="container py-4">
            <div className="row mb-4">
                <div className="col">
                    <div className="card bg-primary text-white">
                        <div className="card-body">
                            <h5 className="card-title">Total Earnings</h5>
                            <h2 className="card-text">₹{totalEarnings.toLocaleString()}</h2>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card mb-4">
                <div className="card-body">
                    <Bar data={chartData} options={options} />
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h5 className="mb-0">Detailed Earnings</h5>
                </div>
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th>Event Name</th>
                                    <th>Fee</th>
                                    <th>Participants</th>
                                    <th>Total Earnings</th>
                                </tr>
                            </thead>
                            <tbody>
                                {earnings.map(event => (
                                    <tr key={event._id}>
                                        <td>{event.name}</td>
                                        <td>₹{event.fee}</td>
                                        <td>{(event.registered_users || []).length}</td>
                                        <td>₹{event.totalEarnings}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Earnings;
