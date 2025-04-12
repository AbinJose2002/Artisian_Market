import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import BidRequestForm from './BidRequestForm';
import RequestedBidsView from './RequestedBidsView';
import jsPDF from 'jspdf'; // Import jsPDF for PDF generation

const UserBids = () => {
    const [participatedBids, setParticipatedBids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [activeTab, setActiveTab] = useState('active'); // 'active', 'won', 'lost', 'requests'

    const fetchParticipatedBids = async () => {
        try {
            const token = localStorage.getItem('usertoken');
            if (!token) {
                setError('Please log in to view your bids');
                setLoading(false);
                return;
            }

            console.log('Fetching bids with token:', token ? 'Present' : 'Missing');
            
            const response = await axios.get(
                'http://localhost:8080/bids/participated',
                { 
                    headers: { 
                        'Authorization': `Bearer ${token}`
                    } 
                }
            );

            console.log('API Response:', response.data);

            if (response.data.success && Array.isArray(response.data.bids)) {
                console.log(`Fetched ${response.data.bids.length} bids`);
                const processedBids = response.data.bids.map(bid => ({
                    ...bid,
                    current_amount: Number(bid.current_amount) || 0,
                    my_highest_bid: Number(bid.my_highest_bid) || 0
                }));
                setParticipatedBids(processedBids);
                console.log(setParticipatedBids)
            } else {
                console.warn("No bids found or response format unexpected:", response.data);
            }
        } catch (error) {
            console.error('Error fetching bids:', error);
            console.error('Error details:', error.response?.data);
            setError('Failed to fetch bid history');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchParticipatedBids();
    }, []);

    const wonBids = participatedBids.filter(bid => {
        const lastDate = new Date(bid.last_date);
        const now = new Date();
        return lastDate < now && 
               bid.highest_bidder === bid.my_email && 
               bid.my_highest_bid === bid.current_amount;
    });

    const activeBids = participatedBids.filter(bid => {
        const lastDate = new Date(bid.last_date);
        const now = new Date();
        return lastDate >= now;
    });

    const lostBids = participatedBids.filter(bid => {
        const lastDate = new Date(bid.last_date);
        const now = new Date();
        return lastDate < now && 
               (bid.highest_bidder !== bid.my_email || 
                bid.my_highest_bid !== bid.current_amount);
    });

    const myRequestedBids = participatedBids.filter(bid => bid.requester_email === bid.my_email);

    const handleTabChange = (tabName) => {
        setActiveTab(tabName);
    };

    const downloadBidDetails = (bid) => {
        const doc = new jsPDF();

        // Add header
        doc.setFontSize(20);
        doc.setTextColor(40, 116, 166); // Blue color
        doc.text("Decor Collect", 105, 15, { align: "center" });

        // Add a horizontal line below the header
        doc.setDrawColor(40, 116, 166);
        doc.setLineWidth(0.5);
        doc.line(10, 20, 200, 20);

        // Add letterhead details
        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text("Your Trusted Auction Platform", 105, 25, { align: "center" });

        // Add bid image if available
        if (bid.image) {
            const imageUrl = `http://localhost:8080/uploads/event_posters/${bid.image}`;
            const img = new Image();
            img.src = imageUrl;
            img.onload = () => {
                doc.addImage(img, "JPEG", 10, 30, 50, 50); // Add image at (10, 30) with width 50 and height 50
                finalizePDF();
            };
            img.onerror = () => {
                console.error("Failed to load image:", imageUrl);
                finalizePDF();
            };
        } else {
            finalizePDF();
        }

        const finalizePDF = () => {
            // Add bid details
            doc.setFontSize(18);
            doc.setTextColor(40, 116, 166);  // Blue color for headings
            doc.text("Bid Details", 10, 90);
            
            // Add dividing line
            doc.setDrawColor(40, 116, 166);
            doc.setLineWidth(0.5);
            doc.line(10, 95, 200, 95);
        
            // Basic bid information section
            doc.setFontSize(12);
            doc.setTextColor(0);
            doc.text(`Item Name: ${bid.title}`, 10, 105);
            doc.text(`Winning Amount: ₹${bid.current_amount}`, 10, 115);
            doc.text(`Date Won: ${new Date(bid.last_date).toLocaleDateString()}`, 10, 125);
            
            // Add a decorative box around key information
            doc.setDrawColor(220, 220, 220);
            doc.setFillColor(248, 249, 250);
            doc.roundedRect(10, 135, 190, 40, 3, 3, 'FD');
            
            doc.setFontSize(11);
            doc.setTextColor(0);
            doc.text("Description:", 15, 145);
            
            // Handle long descriptions with text wrapping
            const splitDescription = doc.splitTextToSize(bid.description, 180);
            doc.text(splitDescription, 15, 155);
        
            // Add a separator
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.2);
            doc.line(10, 185, 200, 185);
        
            // Bid owner details section with styled header
            doc.setFillColor(40, 116, 166, 0.1);
            doc.rect(10, 195, 190, 10, 'F');
            
            doc.setFontSize(14);
            doc.setTextColor(40, 116, 166);
            doc.text("Bid Owner Details", 15, 202);
            
            // Owner details with icons (using unicode characters)
            doc.setFontSize(12);
            doc.setTextColor(0);
            doc.text(`Name: ${bid.first_name} ${bid.last_name || ''}`, 15, 215);
            doc.text(`Contact Number: ${bid.mobile}`, 15, 225);
            doc.text(`Email: ${bid.requester_email}`, 15, 235);
        
            // Add a horizontal line before the footer
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.5);
            doc.line(10, 250, 200, 250);
        
            // Add QR code placeholder (or actual QR if you have a library)
            doc.setFillColor(240, 240, 240);
            doc.roundedRect(160, 260, 30, 30, 2, 2, 'F');
            doc.setFontSize(8);
            doc.setTextColor(100);
        
            // Add footer with more styling
            const pageHeight = doc.internal.pageSize.height;
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text("Decor Collect © 2025 | All Rights Reserved", 10, pageHeight - 10);
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 200, pageHeight - 10, { align: "right" });
        
            // Add a watermark
            doc.setFontSize(60);
            doc.setTextColor(230, 230, 230);
            // doc.text("DECOR COLLECT", 105, 150, { align: "center", angle: 45 });
        
            // Save the PDF with a better filename
            const safeTitle = bid.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            doc.save(`BidDetails_${safeTitle}_${new Date().toISOString().slice(0,10)}.pdf`);
        };
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Loading your bid history...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-danger m-4" role="alert">
                <h4 className="alert-heading">Error!</h4>
                <p>{error}</p>
                <hr />
                <button 
                    className="btn btn-outline-danger" 
                    onClick={() => window.location.reload()}
                >
                    Refresh Page
                </button>
            </div>
        );
    }

    return (
        <div className="container-fluid py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>My Bid History</h2>
                <button 
                    className="btn btn-primary"
                    onClick={() => setShowRequestForm(!showRequestForm)}
                >
                    {showRequestForm ? 'Hide Form' : '+ Request New Bid'}
                </button>
            </div>

            {showRequestForm && (
                <div className="mb-5">
                    <BidRequestForm 
                        onRequestSubmitted={() => {
                            setShowRequestForm(false);
                            fetchParticipatedBids();
                            setActiveTab('requests');
                        }} 
                    />
                </div>
            )}

            <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                    <button 
                        className={`nav-link ${activeTab === 'active' ? 'active' : ''}`}
                        onClick={() => handleTabChange('active')}
                    >
                        Active Bids {activeBids.length > 0 && <span className="badge bg-primary ms-2">{activeBids.length}</span>}
                    </button>
                </li>
                <li className="nav-item">
                    <button 
                        className={`nav-link ${activeTab === 'won' ? 'active' : ''}`}
                        onClick={() => handleTabChange('won')}
                    >
                        Won Bids {wonBids.length > 0 && <span className="badge bg-success ms-2">{wonBids.length}</span>}
                    </button>
                </li>
                <li className="nav-item">
                    <button 
                        className={`nav-link ${activeTab === 'lost' ? 'active' : ''}`}
                        onClick={() => handleTabChange('lost')}
                    >
                        Lost Bids {lostBids.length > 0 && <span className="badge bg-secondary ms-2">{lostBids.length}</span>}
                    </button>
                </li>
                <li className="nav-item">
                    <button 
                        className={`nav-link ${activeTab === 'requests' ? 'active' : ''}`}
                        onClick={() => handleTabChange('requests')}
                    >
                        My Requests {myRequestedBids.length > 0 && <span className="badge bg-primary ms-2">{myRequestedBids.length}</span>}
                    </button>
                </li>
            </ul>

            {participatedBids.length === 0 && !showRequestForm && (
                <div className="alert alert-info">
                    <p className="mb-0">You haven't placed any bids yet.</p>
                </div>
            )}

            <div className="tab-content">
                <div className={`tab-pane ${activeTab === 'active' ? 'show active' : ''}`}>
                    {activeTab === 'active' && activeBids.length === 0 ? (
                        <div className="alert alert-info">
                            <p className="mb-0">You don't have any active bids at the moment.</p>
                        </div>
                    ) : activeTab === 'active' && (
                        <div className="row g-4">
                            {activeBids.map(bid => (
                                <div key={bid._id} className="col-md-4">
                                    <div className="card h-100">
                                        {bid.image && (
                                            <img 
                                                src={`http://localhost:8080/uploads/event_posters/${bid.image}`}
                                                className="card-img-top"
                                                alt={bid.title}
                                                style={{ height: '200px', objectFit: 'cover' }}
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = "https://via.placeholder.com/200x200?text=No+Image";
                                                }}
                                            />
                                        )}
                                        
                                        <div className="card-body">
                                            <h5 className="card-title">{bid.title}</h5>
                                            <p className="card-text text-truncate">{bid.description}</p>
                                            <div className="mt-3">
                                                <p className="mb-1">
                                                    <strong>Current Bid:</strong> ₹{bid.current_amount}
                                                </p>
                                                <p className="mb-1">
                                                    <strong>Your Highest Bid:</strong> ₹{bid.my_highest_bid}
                                                </p>
                                                <p className="mb-1">
                                                    <strong>Your Status:</strong>{' '}
                                                    {bid.highest_bidder === bid.my_email ? (
                                                        <span className="text-success fw-bold">Highest Bidder</span>
                                                    ) : (
                                                        <span className="text-danger fw-bold">Outbid</span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="card-footer d-flex justify-content-between align-items-center">
                                            <small className="text-muted">
                                                Ends on {new Date(bid.last_date).toLocaleDateString()}
                                            </small>
                                            <a href="/bids" className="btn btn-sm btn-outline-primary">
                                                Go to Auctions
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={`tab-pane ${activeTab === 'won' ? 'show active' : ''}`}>
                    {activeTab === 'won' && wonBids.length === 0 ? (
                        <div className="alert alert-info">
                            <p className="mb-0">You haven't won any bids yet.</p>
                        </div>
                    ) : activeTab === 'won' && (
                        <div className="row g-4">
                            {wonBids.map(bid => (
                                <div key={bid._id} className="col-md-4">
                                    <div className="card h-100 border-success">
                                        <div className="winner-badge">Winner!</div>
                                        {bid.image && (
                                            <img 
                                                src={`http://localhost:8080/uploads/event_posters/${bid.image}`}
                                                className="card-img-top"
                                                alt={bid.title}
                                                style={{ height: '200px', objectFit: 'cover' }}
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = "https://via.placeholder.com/200x200?text=No+Image";
                                                }}
                                            />
                                        )}
                                        
                                        <div className="card-body">
                                            <h5 className="card-title">{bid.title}</h5>
                                            <p className="card-text text-truncate">{bid.description}</p>
                                            <div className="mt-3">
                                                <p className="mb-1">
                                                    <strong>Final Bid:</strong> ₹{bid.current_amount}
                                                </p>
                                                <p className="mb-0">
                                                    <strong>Won On:</strong> {new Date(bid.last_date).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="card-footer d-flex justify-content-between align-items-center">
                                            <span className="badge bg-success">Auction Won</span>
                                            <button 
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={() => downloadBidDetails(bid)}
                                            >
                                                Download Details
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={`tab-pane ${activeTab === 'lost' ? 'show active' : ''}`}>
                    {activeTab === 'lost' && lostBids.length === 0 ? (
                        <div className="alert alert-info">
                            <p className="mb-0">You don't have any lost bids.</p>
                        </div>
                    ) : activeTab === 'lost' && (
                        <div className="row g-4">
                            {lostBids.map(bid => (
                                <div key={bid._id} className="col-md-4">
                                    <div className="card h-100">
                                        {bid.image && (
                                            <img 
                                                src={`http://localhost:8080/uploads/event_posters/${bid.image}`}
                                                className="card-img-top"
                                                alt={bid.title}
                                                style={{ height: '200px', objectFit: 'cover' }}
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = "https://via.placeholder.com/200x200?text=No+Image";
                                                }}
                                            />
                                        )}
                                        
                                        <div className="card-body">
                                            <h5 className="card-title">{bid.title}</h5>
                                            <p className="card-text text-truncate">{bid.description}</p>
                                            <div className="mt-3">
                                                <p className="mb-1">
                                                    <strong>Final Bid:</strong> ₹{bid.current_amount}
                                                </p>
                                                <p className="mb-1">
                                                    <strong>Your Highest Bid:</strong> ₹{bid.my_highest_bid}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="card-footer">
                                            <span className="badge bg-secondary">Auction Ended</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={`tab-pane ${activeTab === 'requests' ? 'show active' : ''}`}>
                    {activeTab === 'requests' && (
                        <RequestedBidsView bids={myRequestedBids} />
                    )}
                </div>
            </div>

            <style jsx>{`
                .winner-badge {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: #28a745;
                    color: white;
                    padding: 5px 15px;
                    border-radius: 20px;
                    font-weight: bold;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                    z-index: 1;
                }
                
                .card {
                    transition: transform 0.3s ease;
                    position: relative;
                }
                
                .card:hover {
                    transform: translateY(-5px);
                }
                
                .border-success {
                    border-color: #28a745 !important;
                    box-shadow: 0 0 15px rgba(40, 167, 69, 0.2);
                }
                
                .text-truncate {
                    max-width: 100%;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .form-label {
                    font-weight: 500;
                }
                
                .form-control:focus, .form-select:focus {
                    border-color: var(--primary-color);
                    box-shadow: 0 0 0 0.25rem rgba(58, 29, 110, 0.25);
                }
                
                .tab-pane {
                    display: none;
                }
                
                .tab-pane.show.active {
                    display: block;
                }
                
                .nav-tabs .badge {
                    font-size: 0.7rem;
                }
            `}</style>
        </div>
    );
};

export default UserBids;
