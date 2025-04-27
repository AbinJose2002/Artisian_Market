import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const UserLogin = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [banInfo, setBanInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const nav = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(""); // Clear previous errors
        setBanInfo(null); // Clear previous ban info
        setLoading(true);

        try {
            const response = await axios.post("http://127.0.0.1:8080/user/login", {
                email,
                password,
            });

            if (response.data.success) {
                localStorage.setItem("usertoken", response.data.token);
                nav('/user-dashboard');
                window.location.reload(); // Reload the page to reflect the login state
            } else {
                setError("Invalid email or password.");
            }
        } catch (err) {
            console.error("Login error:", err);
            
            // Check for specific ban error messages
            const errorMessage = err.response?.data?.message || "";
            
            if (errorMessage.includes("temporarily disabled") || 
                errorMessage.includes("banned") || 
                errorMessage.includes("blocked")) {
                
                // Set ban information
                setBanInfo({
                    message: errorMessage,
                    isBanned: true,
                    isTemporary: errorMessage.includes("days") || errorMessage.includes("hours")
                });
            } else {
                // Generic error message
                setError(err.response?.data?.message || "Error connecting to the server.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-4">
                    <div className="card">
                        <div className="card-body">
                            <h3 className="text-center">Login</h3>
                            
                            {/* Show error message */}
                            {error && <div className="alert alert-danger">{error}</div>}
                            
                            {/* Show ban warning */}
                            {banInfo && (
                                <div className="alert alert-warning">
                                    <h5 className="alert-heading">Account Restricted</h5>
                                    <p>{banInfo.message}</p>
                                    {banInfo.isTemporary ? (
                                        <p className="mb-0">
                                            Your account has been temporarily disabled. 
                                            Please try again later or contact support for assistance.
                                        </p>
                                    ) : (
                                        <p className="mb-0">
                                            Your account has been permanently blocked. 
                                            Please contact support for assistance.
                                        </p>
                                    )}
                                </div>
                            )}
                            
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={loading}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Password</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={loading}
                                        required
                                    />
                                </div>
                                <p>
                                    New user? <a href="/user-register" className="mb-2">Click here</a>
                                </p>
                                <button 
                                    type="submit" 
                                    className="btn btn-primary w-100"
                                    disabled={loading}
                                >
                                    {loading ? 'Logging in...' : 'Login'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserLogin;
