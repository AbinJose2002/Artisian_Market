import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

function SellerStats() {
    const [sellers, setSellers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('admintoken');
            const [sellersRes, productsRes] = await Promise.all([
                axios.get('http://localhost:8080/admin/sellers', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get('http://localhost:8080/admin/products', {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            setSellers(sellersRes.data.sellers);
            setProducts(productsRes.data.products);
        } catch (error) {
            toast.error('Failed to fetch seller data');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-center">Loading...</div>;

    // Calculate category distribution
    const categories = products.reduce((acc, product) => {
        acc[product.category] = (acc[product.category] || 0) + 1;
        return acc;
    }, {});

    const chartData = {
        labels: Object.keys(categories),
        datasets: [{
            data: Object.values(categories),
            backgroundColor: [
                '#FF6384',
                '#36A2EB',
                '#FFCE56',
                '#4BC0C0',
                '#9966FF'
            ]
        }]
    };

    return (
        <div className="container-fluid">
            <h2 className="mb-4">Seller Statistics</h2>

            <div className="row mb-4">
                <div className="col-md-4">
                    <div className="card bg-primary text-white">
                        <div className="card-body">
                            <h5>Total Sellers</h5>
                            <h2>{sellers.length}</h2>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card bg-success text-white">
                        <div className="card-body">
                            <h5>Total Products</h5>
                            <h2>{products.length}</h2>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card bg-info text-white">
                        <div className="card-body">
                            <h5>Product Categories</h5>
                            <h2>{Object.keys(categories).length}</h2>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-md-6">
                    <div className="card">
                        <div className="card-body">
                            <h5 className="card-title">Product Categories Distribution</h5>
                            <Doughnut data={chartData} />
                        </div>
                    </div>
                </div>

                <div className="col-md-6">
                    <div className="card">
                        <div className="card-body">
                            <h5 className="card-title">Category Breakdown</h5>
                            <div className="table-responsive">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Category</th>
                                            <th>Products</th>
                                            <th>Percentage</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(categories).map(([category, count]) => (
                                            <tr key={category}>
                                                <td>{category}</td>
                                                <td>{count}</td>
                                                <td>
                                                    {((count / products.length) * 100).toFixed(1)}%
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SellerStats;
