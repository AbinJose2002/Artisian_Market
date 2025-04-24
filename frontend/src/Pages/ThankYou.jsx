import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';

const ThankYou = () => {
    const navigate = useNavigate();
    const [countdown, setCountdown] = useState(3);

    useEffect(() => {
        // Set a timer to redirect after 3 seconds
        const redirectTimer = setTimeout(() => {
            navigate('/');
        }, 3000);

        // Set up countdown
        const countdownInterval = setInterval(() => {
            setCountdown(prev => prev - 1);
        }, 1000);

        // Clean up timers
        return () => {
            clearTimeout(redirectTimer);
            clearInterval(countdownInterval);
        };
    }, [navigate]);

    return (
        <div className="container text-center py-5">
            <div className="thank-you-container bg-white p-5 rounded shadow-lg">
                <FontAwesomeIcon 
                    icon={faCheckCircle} 
                    className="text-success mb-4" 
                    style={{ fontSize: '5rem' }} 
                />
                <h1 className="mb-3">Thank You for Your Purchase!</h1>
                <p className="lead mb-4">Your order has been successfully processed.</p>
                <p className="mb-4">You will receive a confirmation email shortly.</p>
                <p className="text-muted">Redirecting to home page in {countdown} seconds...</p>
            </div>

            <style jsx>{`
                .thank-you-container {
                    max-width: 600px;
                    margin: 2rem auto;
                    animation: fadeIn 0.5s ease-in;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .text-success {
                    color: #28a745 !important;
                }
            `}</style>
        </div>
    );
};

export default ThankYou;
