import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('loading');
    const [paymentType, setPaymentType] = useState('event');
    
    useEffect(() => {
        const sessionId = searchParams.get('session_id');
        const type = searchParams.get('type') || 'event';
        setPaymentType(type);

        if (sessionId) {
            const verifyPayment = async () => {
                try {
                    const token = localStorage.getItem('usertoken');
                    const response = await axios.post(
                        'http://localhost:8080/payment/verify',
                        { sessionId, type },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    setStatus('success');
                } catch (error) {
                    setStatus('error');
                    console.error('Verification error:', error);
                }
            };
            verifyPayment();
        }
    }, [searchParams]);

    return (
        <div className="container py-5 text-center">
            <div className="card p-5 mx-auto" style={{ maxWidth: '500px' }}>
                {status === 'loading' && <div>Verifying payment...</div>}
                {status === 'success' && (
                    <>
                        <h2 className="text-success mb-4">Payment Successful!</h2>
                        <p>{paymentType === 'cart' ? 'Your order has been placed.' : 'Your event registration is confirmed.'}</p>
                        <Link 
                            to={paymentType === 'cart' ? "/user-dashboard" : "/events"} 
                            className="btn btn-primary mt-3"
                        >
                            {paymentType === 'cart' ? 'View Orders' : 'Back to Events'}
                        </Link>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <h2 className="text-danger mb-4">Payment Verification Failed</h2>
                        <p>There was an issue confirming your payment.</p>
                        <Link 
                            to={paymentType === 'cart' ? "/cart" : "/events"} 
                            className="btn btn-primary mt-3"
                        >
                            Try Again
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
};

export default PaymentSuccess;
