import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            // In a real implementation, you would send this to your backend
            // For now, we'll simulate a successful submission
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Reset form after successful submission
            setFormData({
                name: '',
                email: '',
                subject: '',
                message: ''
            });
            toast.success('Your message has been sent successfully!');
        } catch (error) {
            console.error('Error submitting form:', error);
            toast.error('Failed to send message. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="contact-page">
            <div className="container py-5">
                <div className="row">
                    <div className="col-lg-6 mb-5 mb-lg-0">
                        <h2 className="mb-4">Get in Touch</h2>
                        <p className="lead mb-4">
                            Have questions about our products, events or services? Fill out the form and our team will get back to you shortly.
                        </p>
                        
                        {/* Contact Form */}
                        <form onSubmit={handleSubmit}>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label">Your Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Email Address</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="col-12">
                                    <label className="form-label">Subject</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="col-12">
                                    <label className="form-label">Message</label>
                                    <textarea
                                        className="form-control"
                                        name="message"
                                        rows="5"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                    ></textarea>
                                </div>
                                <div className="col-12">
                                    <button 
                                        type="submit" 
                                        className="btn btn-primary"
                                        disabled={loading}
                                    >
                                        {loading ? 'Sending...' : 'Send Message'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                    
                    <div className="col-lg-6">
                        <div className="contact-info">
                            <div className="mb-5">
                                <h3 className="h4 mb-4">Contact Information</h3>
                                <div className="contact-item d-flex align-items-center mb-3">
                                    <div className="icon-box me-3">
                                        <i className="bi bi-geo-alt-fill"></i>
                                    </div>
                                    <div>
                                        <h5 className="h6 mb-0">Address</h5>
                                        <p className="mb-0">123 Art Street, Creative District<br/>New Delhi, India 110001</p>
                                    </div>
                                </div>
                                <div className="contact-item d-flex align-items-center mb-3">
                                    <div className="icon-box me-3">
                                        <i className="bi bi-telephone-fill"></i>
                                    </div>
                                    <div>
                                        <h5 className="h6 mb-0">Phone</h5>
                                        <p className="mb-0">+91 98765 43210</p>
                                    </div>
                                </div>
                                <div className="contact-item d-flex align-items-center">
                                    <div className="icon-box me-3">
                                        <i className="bi bi-envelope-fill"></i>
                                    </div>
                                    <div>
                                        <h5 className="h6 mb-0">Email</h5>
                                        <p className="mb-0">contact@artisianmarket.com</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-5">
                                <h3 className="h4 mb-4">Hours of Operation</h3>
                                <ul className="list-unstyled">
                                    <li className="mb-2">Monday - Friday: 9:00 AM - 6:00 PM</li>
                                    <li className="mb-2">Saturday: 10:00 AM - 4:00 PM</li>
                                    <li>Sunday: Closed</li>
                                </ul>
                            </div>
                            
                            <div>
                                <h3 className="h4 mb-4">Follow Us</h3>
                                <div className="social-links">
                                    <a href="#" className="social-link">
                                        <i className="bi bi-facebook"></i>
                                    </a>
                                    <a href="#" className="social-link">
                                        <i className="bi bi-twitter"></i>
                                    </a>
                                    <a href="#" className="social-link">
                                        <i className="bi bi-instagram"></i>
                                    </a>
                                    <a href="#" className="social-link">
                                        <i className="bi bi-pinterest"></i>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Map Section */}
                <div className="row mt-5">
                    <div className="col-12">
                        <h3 className="mb-4">Find Us</h3>
                        <div className="map-container">
                            <iframe 
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3502.0684479502756!2d77.22090387448791!3d28.632235290342236!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cfcef4a60b8c7%3A0xd891aa772409c0a7!2sConnaught%20Place%2C%20New%20Delhi%2C%20Delhi%20110001%2C%20India!5e0!3m2!1sen!2s!4v1689152862214!5m2!1sen!2s" 
                                width="100%" 
                                height="450" 
                                style={{ border: 0 }}
                                allowFullScreen=""
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="Artisian Market Location"
                            ></iframe>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .contact-page {
                    background-color: #f9f9f9;
                }
                .icon-box {
                    width: 40px;
                    height: 40px;
                    background: var(--primary-color);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 1.2rem;
                }
                .contact-info {
                    background-color: white;
                    border-radius: 10px;
                    padding: 2rem;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
                    height: 100%;
                }
                .social-links {
                    display: flex;
                    gap: 15px;
                }
                .social-link {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 40px;
                    height: 40px;
                    background-color: #f8f9fa;
                    border-radius: 50%;
                    color: var(--primary-color);
                    font-size: 1.2rem;
                    transition: all 0.3s ease;
                }
                .social-link:hover {
                    background-color: var(--primary-color);
                    color: white;
                    transform: translateY(-3px);
                }
                .map-container {
                    border-radius: 10px;
                    overflow: hidden;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
                }
                .form-control {
                    border-radius: 8px;
                    padding: 0.6rem 1rem;
                    border: 1px solid #dee2e6;
                }
                .form-control:focus {
                    border-color: var(--primary-color);
                    box-shadow: 0 0 0 0.25rem rgba(58, 29, 110, 0.15);
                }
                .btn-primary {
                    border-radius: 8px;
                    padding: 0.6rem 2rem;
                    background-color: var(--primary-color);
                    border-color: var(--primary-color);
                    transition: all 0.3s ease;
                }
                .btn-primary:hover {
                    background-color: var(--primary-hover);
                    border-color: var(--primary-hover);
                    transform: translateY(-2px);
                }
                h2, h3, h4 {
                    color: var(--primary-color);
                }
            `}</style>
        </div>
    );
};

export default Contact;
