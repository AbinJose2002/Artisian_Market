import React, { useEffect, useState } from "react";
import axios from "axios"; // Import axios
import { Link } from 'react-router-dom';
import HomeBanner from "./HomeBanner";
import ArtItems from "./ArtItems";

export default function Body() {
    const [artData, setArtData] = useState([]);
    const [events, setEvents] = useState([]);
    const [error, setError] = useState(null);

    const getEventImageUrl = (event) => {
        if (!event) return null;
        return event.poster_url || null;
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [artRes, eventsRes] = await Promise.all([
                    axios.get("http://localhost:8080/product/list"),
                    axios.get("http://localhost:8080/instructor/events/list")
                ]);
                
                setArtData(artRes.data.products);
                if (eventsRes.data.success) {
                    console.log("Events data:", eventsRes.data.events);
                    setEvents(eventsRes.data.events);
                } else {
                    console.error("Events fetch failed:", eventsRes.data.message);
                    setError(eventsRes.data.message);
                }
            } catch (error) {
                console.error("Error fetching data:", error.response?.data || error.message);
                setError(error.response?.data?.message || "Failed to load data");
            }
        };

        fetchData();
    }, []);

    return (
        <div>
            <HomeBanner />
            <ArtItems items={artData} />
            {error && <p className="text-danger text-center">{error}</p>}
            {events.length > 0 && (
                <section className="container py-5">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h2 className="mb-0">Upcoming Events</h2>
                        <Link to="/events" className="btn btn-outline-primary">
                            Explore More Events
                        </Link>
                    </div>
                    <div className="row">
                        {events.slice(0, 4).map(event => (
                            <div key={event._id} className="col-md-3 mb-4">
                                <div className="card h-100">
                                    {event.poster && (
                                        <img 
                                            src={getEventImageUrl(event)}
                                            className="card-img-top"
                                            alt={event.name}
                                            style={{ height: '200px', objectFit: 'cover' }}
                                            onError={(e) => {
                                                console.error("Error loading image:", e.target.src);
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                    )}
                                    <div className="card-body">
                                        <h5 className="card-title">{event.name}</h5>
                                        <p className="card-text">{event.description}</p>
                                        <p className="mb-0">
                                            <strong>Date:</strong> {event.date}
                                        </p>
                                        <p>
                                            <strong>Fee:</strong> ₹{event.fee}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
