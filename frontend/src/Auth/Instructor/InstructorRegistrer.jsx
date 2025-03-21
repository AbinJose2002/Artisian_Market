import React, { useState } from "react";
import axios from "axios";

const InstructorRegister = () => {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [mobile, setMobile] = useState("");
    const [address, setAddress] = useState("");
    const [gender, setGender] = useState("");
    const [artSpecialization, setArtSpecialization] = useState("");
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [message, setMessage] = useState("");

    const specializations = ["Painting", "Sculpture", "Photography", "Drawing", "Calligraphy", "Digital Art", "Other"];

    const handleFileChange = (e) => {
        setProfilePhoto(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");

        const formData = new FormData();
        formData.append("first_name", firstName);
        formData.append("last_name", lastName);
        formData.append("email", email);
        formData.append("password", password);
        formData.append("mobile", mobile);
        formData.append("address", address);
        formData.append("gender", gender);
        formData.append("art_specialization", artSpecialization);
        if (profilePhoto) {
            formData.append("profile_photo", profilePhoto);
        }

        try {
            const response = await axios.post("http://127.0.0.1:8080/instructor/register", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            if (response.data.success) {
                setMessage("Registration successful! You can now log in.");
                setFirstName("");
                setLastName("");
                setEmail("");
                setPassword("");
                setMobile("");
                setAddress("");
                setGender("");
                setArtSpecialization("");
                setProfilePhoto(null);
            } else {
                setMessage(response.data.message);
            }
        } catch (err) {
            setMessage("Error connecting to the server.");
        }
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="card">
                        <div className="card-body">
                            <h3 className="text-center">Register as an Art Instructor</h3>
                            {message && <div className="alert alert-info">{message}</div>}
                            <form onSubmit={handleSubmit} encType="multipart/form-data">
                                <div className="mb-3">
                                    <label className="form-label">First Name</label>
                                    <input type="text" className="form-control" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Last Name</label>
                                    <input type="text" className="form-control" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Email</label>
                                    <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Password</label>
                                    <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Mobile Number</label>
                                    <input type="tel" className="form-control" value={mobile} onChange={(e) => setMobile(e.target.value)} required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Address</label>
                                    <textarea className="form-control" value={address} onChange={(e) => setAddress(e.target.value)} required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Gender</label>
                                    <select className="form-control" value={gender} onChange={(e) => setGender(e.target.value)} required>
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Art Specialization</label>
                                    <select className="form-control" value={artSpecialization} onChange={(e) => setArtSpecialization(e.target.value)} required>
                                        <option value="">Select Specialization</option>
                                        {specializations.map((specialization, index) => (
                                            <option key={index} value={specialization}>{specialization}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Profile Photo</label>
                                    <input type="file" className="form-control" accept="image/*" onChange={handleFileChange} required />
                                </div>
                                <p>
                                    Already a user? <a href="/instructor-login" className="mb-2">Click here</a>
                                </p>
                                <button type="submit" className="btn btn-success w-100">
                                    Register
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InstructorRegister;
