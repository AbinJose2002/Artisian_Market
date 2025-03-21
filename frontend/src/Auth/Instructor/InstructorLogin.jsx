import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const InstructorLogin = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(""); // Clear previous errors

        try {
            const response = await axios.post("http://127.0.0.1:8080/instructor/login", {
                email,
                password,
            });

            if (response.data.success) {
                alert("Login successful!");
                localStorage.setItem("instructortoken", response.data.token);
                navigate("/instructor-dashboard");
                
            } else {
                setError("Invalid email or password.");
            }
        } catch (err) {
            setError("Error connecting to the server.");
        }
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-4">
                    <div className="card">
                        <div className="card-body">
                            <h3 className="text-center">Instructor Login</h3>
                            {error && <div className="alert alert-danger">{error}</div>}
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
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
                                        required
                                    />
                                </div>
                                <p>
                                    New user? <a href="/instructor-register" className="mb-2">Click here</a>
                                </p>
                                <button type="submit" className="btn btn-primary w-100">
                                    Login
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InstructorLogin;
