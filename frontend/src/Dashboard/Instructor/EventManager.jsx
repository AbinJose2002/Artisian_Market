import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const EventManager = () => {
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

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const token = localStorage.getItem("instructortoken");
                const res = await axios.get("http://localhost:8080/instructor/events",{
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    },
                });
                setEvents(res.data.events);
                console.log(res.data.events)
            } catch (err) {
                console.error("Error fetching events:", err);
            }
        };

        fetchEvents();
    }, []);

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
            <div className="row">
                <div className="col-md-6">
                    <h4>Add Event</h4>
                    <form onSubmit={handleSubmit} className="p-4 border rounded bg-light">
                        <div className="mb-3">
                            <label className="form-label">Event Name</label>
                            <input type="text" name="name" className="form-control" value={eventData.name} onChange={handleChange} required />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Description</label>
                            <textarea name="description" className="form-control" value={eventData.description} onChange={handleChange} required></textarea>
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Mode</label>
                            <select name="type" className="form-select" value={eventData.type} onChange={handleChange}>
                                <option value="online">Online</option>
                                <option value="offline">Offline</option>
                            </select>
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Date</label>
                            <input type="date" name="date" className="form-control" value={eventData.date} onChange={handleChange} required />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Time</label>
                            <input type="time" name="time" className="form-control" value={eventData.time} onChange={handleChange} required />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Fee</label>
                            <input type="number" name="fee" className="form-control" value={eventData.fee} onChange={handleChange} required />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Duration in days</label>
                            <input type="number" name="duration" className="form-control" value={eventData.duration} onChange={handleChange} required />
                        </div>
                        {eventData.type === "offline" && (
                            <div className="mb-3">
                                <label className="form-label">Place</label>
                                <input type="text" name="place" className="form-control" value={eventData.place} onChange={handleChange} required />
                            </div>
                        )}
                        <div className="mb-3">
                            <label className="form-label">Event Poster</label>
                            <input id="poster-input" type="file" name="poster" className="form-control" accept="image/*" onChange={handleChange} />
                        </div>
                        <button type="submit" className="btn btn-primary">Add Event</button>
                    </form>
                </div>

                <div className="col-md-6">
                    <h4>Events</h4>
                    <ul className="list-group mb-3">
                        {events.map((event, index) => (
                            <li key={index} className="list-group-item list-group-item-action" onClick={() => setSelectedEvent(event)} style={{ cursor: "pointer" }}>
                                {event.name} ({event.type})
                            </li>
                        ))}
                    </ul>

                    {selectedEvent && (
                        <div className="p-4 border rounded bg-light">
                            <h5>{selectedEvent.name}</h5>
                            <p><strong>Description:</strong> {selectedEvent.description}</p>
                            <p><strong>Mode:</strong> {selectedEvent.type}</p>
                            <p><strong>Date:</strong> {selectedEvent.date}</p>
                            <p><strong>Time:</strong> {selectedEvent.time}</p>
                            <p><strong>Duration:</strong> {selectedEvent.duration} days</p>
                            <p><strong>Fee: Rs. </strong>{selectedEvent.fee}</p>
                            {selectedEvent.type === "offline" && <p><strong>Place:</strong> {selectedEvent.place}</p>}
                            {selectedEvent.poster && (
                                <div>
                                    <p><strong>Poster:</strong></p>
                                    <img src={`http://localhost:8080/uploads/event_posters/${selectedEvent.poster}`} alt="Event Poster" className="img-fluid rounded" style={{ maxHeight: "300px" }} />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EventManager;