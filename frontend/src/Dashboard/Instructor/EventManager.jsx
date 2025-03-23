import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EventParticipants from './EventParticipants';

function EventManager({ onSelectEvent }) {
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [eventData, setEventData] = useState({
        name: "",
        description: "",
        type: "online",
        date: "",
        time: "",
        place: "",
        fee: "",
        duration: "",
        poster: null,
    });

    const getImageUrl = (event) => {
        if (!event?.poster) return null;
        const url = `http://localhost:8080/uploads/event_posters/${encodeURIComponent(event.poster)}`;
        console.log("Image URL:", url);
        return url;
    };

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const token = localStorage.getItem("instructortoken");
                const res = await axios.get("http://localhost:8080/instructor/events", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log("Raw events response:", res.data);
                setEvents(res.data.events);
            } catch (err) {
                console.error("Error fetching events:", err);
            }
        };
        fetchEvents();
    }, []);

    useEffect(() => {
        if (selectedEvent) {
            onSelectEvent(selectedEvent._id);
        }
    }, [selectedEvent, onSelectEvent]);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === "poster" && files.length > 0) {
            setEventData({ ...eventData, poster: files[0] });
        } else {
            setEventData({ ...eventData, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("instructortoken");
            const formData = new FormData();
            formData.append("name", eventData.name);
            formData.append("description", eventData.description);
            formData.append("type", eventData.type);
            formData.append("date", eventData.date);
            formData.append("time", eventData.time);
            formData.append("duration", eventData.duration);
            formData.append("fee", eventData.fee);
            if (eventData.type === "offline") {
                formData.append("place", eventData.place);
            }
            if (eventData.poster) {
                formData.append("poster", eventData.poster);
            }
            // console.log(token)
            const res = await axios.post("http://localhost:8080/instructor/add_event", formData, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });

            toast.success(res.data.message);
            setEvents([...events, res.data.event]);
            setEventData({
                name: "",
                description: "",
                type: "online",
                date: "",
                duration: "",
                time: "",
                place: "",
                fee: "",
                poster: null,
            });
            document.getElementById("poster-input").value = "";
        } catch (err) {
            toast.error("Failed to add event");
            console.error("Error submitting form:", err);
        }
    };

    return (
        <div className="container mt-5">
            <ToastContainer />
            <div className="row g-4">
                <div className="col-md-6">
                    <div className="card shadow-sm">
                        <div className="card-header" style={{ background: '#1a237e', color: 'white' }}>
                            <h4 className="mb-0">Add Event</h4>
                        </div>
                        <form onSubmit={handleSubmit} className="card-body">
                            <div className="row g-3">
                                <div className="col-12">
                                    <label className="form-label fw-bold">Event Name</label>
                                    <input type="text" name="name" className="form-control" value={eventData.name} onChange={handleChange} required />
                                </div>
                                <div className="col-12">
                                    <label className="form-label fw-bold">Description</label>
                                    <textarea name="description" className="form-control" rows="3" value={eventData.description} onChange={handleChange} required></textarea>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-bold">Mode</label>
                                    <select name="type" className="form-select" value={eventData.type} onChange={handleChange}>
                                        <option value="online">Online</option>
                                        <option value="offline">Offline</option>
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-bold">Fee (₹)</label>
                                    <input type="number" name="fee" className="form-control" value={eventData.fee} onChange={handleChange} required />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-bold">Date</label>
                                    <input type="date" name="date" className="form-control" value={eventData.date} onChange={handleChange} required />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-bold">Time</label>
                                    <input type="time" name="time" className="form-control" value={eventData.time} onChange={handleChange} required />
                                </div>
                                <div className="col-12">
                                    <label className="form-label fw-bold">Duration (days)</label>
                                    <input type="number" name="duration" className="form-control" value={eventData.duration} onChange={handleChange} required />
                                </div>
                                {eventData.type === "offline" && (
                                    <div className="col-12">
                                        <label className="form-label fw-bold">Place</label>
                                        <input type="text" name="place" className="form-control" value={eventData.place} onChange={handleChange} required />
                                    </div>
                                )}
                                <div className="col-12">
                                    <label className="form-label fw-bold">Event Poster</label>
                                    <input id="poster-input" type="file" name="poster" className="form-control" accept="image/*" onChange={handleChange} />
                                </div>
                                <div className="col-12">
                                    <button type="submit" className="btn btn-primary w-100">Add Event</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="col-md-6">
                    <div className="card shadow-sm mb-4">
                        <div className="card-header" style={{ background: '#1a237e', color: 'white' }}>
                            <h4 className="mb-0">Events</h4>
                        </div>
                        <div className="card-body p-0">
                            <div className="list-group list-group-flush">
                                {events.map((event) => (
                                    <button
                                        key={event._id}
                                        className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${selectedEvent?._id === event._id ? 'active' : ''}`}
                                        onClick={() => setSelectedEvent(event)}
                                    >
                                        <div className="d-flex align-items-center">
                                            {event.poster && (
                                                <img 
                                                    src={getImageUrl(event)}
                                                    alt="Event thumbnail"
                                                    className="me-3"
                                                    style={{ 
                                                        width: '50px', 
                                                        height: '50px',
                                                        objectFit: 'cover',
                                                        borderRadius: '4px'
                                                    }}
                                                    onError={(e) => {
                                                        console.error("Failed to load image:", e.target.src);
                                                        e.target.onerror = null;
                                                        e.target.style.display = 'none';
                                                    }}
                                                />
                                            )}
                                            <span>{event.name}</span>
                                        </div>
                                        <span className="badge" style={{ background: '#1a237e' }}>
                                            {event.type}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {selectedEvent && (
                        <div className="card shadow-sm">
                            <div className="card-header" style={{ background: '#1a237e', color: 'white' }}>
                                <h4 className="mb-0">Event Details</h4>
                            </div>
                            <div className="card-body">
                                {selectedEvent.poster && (
                                    <div className="mb-4">
                                        <img
                                            src={getImageUrl(selectedEvent)}
                                            alt="Event Poster"
                                            className="img-fluid rounded"
                                            style={{ 
                                                maxHeight: "300px", 
                                                width: "100%", 
                                                objectFit: "cover" 
                                            }}
                                            onError={(e) => {
                                                console.error("Error loading image:", e.target.src);
                                                e.target.onerror = null;
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                    </div>
                                )}
                                <h5 className="card-title">{selectedEvent.name}</h5>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <p className="mb-1"><strong>Mode:</strong></p>
                                        <span className="badge bg-secondary">{selectedEvent.type}</span>
                                    </div>
                                    <div className="col-md-6">
                                        <p className="mb-1"><strong>Fee:</strong></p>
                                        <span className="badge bg-success">₹{selectedEvent.fee}</span>
                                    </div>
                                    <div className="col-12">
                                        <p className="mb-1"><strong>Description:</strong></p>
                                        <p className="card-text">{selectedEvent.description}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <p className="mb-1"><strong>Date:</strong></p>
                                        <p className="card-text">{selectedEvent.date}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <p className="mb-1"><strong>Time:</strong></p>
                                        <p className="card-text">{selectedEvent.time}</p>
                                    </div>
                                    <div className="col-12">
                                        <p className="mb-1"><strong>Duration:</strong></p>
                                        <p className="card-text">{selectedEvent.duration} days</p>
                                    </div>
                                    {selectedEvent.type === "offline" && (
                                        <div className="col-12">
                                            <p className="mb-1"><strong>Place:</strong></p>
                                            <p className="card-text">{selectedEvent.place}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="card-body border-top">
                                    <EventParticipants eventId={selectedEvent._id} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default EventManager;