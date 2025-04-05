// src/components/Dashboard.js
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import EventManager from './EventManager';
import EventParticipants from './EventParticipants';
import Earnings from './Earnings';
import Profile from './Profile';
import BidManager from './BidManager';
import MyBids from './MyBids'; // Add this import

function InstructorHome() {
    const [selected, setSelected] = useState('events');
    const [currentEventId, setCurrentEventId] = useState(null);

    const handleEventSelect = (eventId) => {
        setCurrentEventId(eventId);
        // Automatically switch to participants view when an event is selected
        setSelected('participants');
    };

    const renderContent = () => {
        switch(selected) {
            case 'events':
                return <EventManager onSelectEvent={handleEventSelect} />;
            case 'participants':
                return currentEventId ? (
                    <div>
                        <button 
                            className="btn btn-outline-primary mb-3"
                            onClick={() => setSelected('events')}
                        >
                            ← Back to Events
                        </button>
                        <EventParticipants eventId={currentEventId} />
                    </div>
                ) : (
                    <div className="alert alert-info">
                        <p>Please select an event first</p>
                        <button 
                            className="btn btn-primary mt-2"
                            onClick={() => setSelected('events')}
                        >
                            Go to Events
                        </button>
                    </div>
                );
            case 'profile':
                return <Profile />;
            case 'earnings':
                return <Earnings />;
            case 'bids':
                return <BidManager />;
            case 'mybids':
                return <MyBids />;
            default:
                return <EventManager onSelectEvent={handleEventSelect} />;
        }
    };

    return (
        <div style={{ display: 'flex' }}>
            <Sidebar setSelected={setSelected} />
            <div style={{ padding: '20px', flex: 1 }}>
                {renderContent()}
                <Outlet />
            </div>
        </div>
    );
}

export default InstructorHome;