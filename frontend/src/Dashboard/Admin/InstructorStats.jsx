import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

function InstructorStats() {
    const [instructors, setInstructors] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('admintoken');
            const [instructorsRes, eventsRes] = await Promise.all([
                axios.get('http://localhost:8080/admin/instructors', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get('http://localhost:8080/admin/events', {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            setInstructors(instructorsRes.data.instructors);
            setEvents(eventsRes.data.events);
        } catch (error) {
            toast.error('Failed to fetch instructor data');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-center">Loading...</div>;

    // Calculate stats for chart
    const instructorEventCounts = instructors.map(instructor => ({
        name: `${instructor.first_name} ${instructor.last_name}`,
        eventCount: events.filter(event => event.instructor_id === instructor._id).length
    }));

    const chartData = {
        labels: instructorEventCounts.map(i => i.name),
        datasets: [{
            label: 'Number of Events',
            data: instructorEventCounts.map(i => i.eventCount),
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
        }]
    };

    return (
        <div className="container-fluid">
            <h2 className="mb-4">Instructor Statistics</h2>

            <div className="row mb-4">
                <div className="col-md-4">
                    <div className="card bg-primary text-white">
                        <div className="card-body">
                            <h5>Total Instructors</h5>
                            <h2>{instructors.length}</h2>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card bg-success text-white">
                        <div className="card-body">
                            <h5>Total Events</h5>
                            <h2>{events.length}</h2>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card bg-info text-white">
                        <div className="card-body">
                            <h5>Avg Events per Instructor</h5>
                            <h2>{(events.length / instructors.length || 0).toFixed(1)}</h2>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-md-8 mb-4">
                    <div className="card">
                        <div className="card-body">
                            <h5 className="card-title">Events by Instructor</h5>
                            <Bar data={chartData} options={{
                                responsive: true,
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        ticks: { stepSize: 1 }
                                    }
                                }
                            }} />
                        </div>
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="card">
                        <div className="card-body">
                            <h5 className="card-title">Instructor List</h5>
                            <div className="table-responsive">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Events</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {instructorEventCounts.map((instructor, index) => (
                                            <tr key={index}>
                                                <td>{instructor.name}</td>
                                                <td>{instructor.eventCount}</td>
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

export default InstructorStats;
