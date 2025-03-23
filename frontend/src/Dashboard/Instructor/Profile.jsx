import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const Profile = () => {
    const [profile, setProfile] = useState({
        first_name: '',
        last_name: '',
        email: '',
        mobile: '',
        address: '',
        gender: '',
        art_specialization: '',
        profile_photo: null
    });
    const [loading, setLoading] = useState(true);
    const [previewImage, setPreviewImage] = useState(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('instructortoken');
            const response = await axios.get('http://localhost:8080/instructor/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setProfile(response.data.profile);
                if (response.data.profile.profile_photo) {
                    setPreviewImage(`http://localhost:8080/uploads/profile_photos/${response.data.profile.profile_photo}`);
                }
            }
        } catch (error) {
            toast.error('Failed to load profile');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'profile_photo' && files[0]) {
            setProfile(prev => ({ ...prev, [name]: files[0] }));
            setPreviewImage(URL.createObjectURL(files[0]));
        } else {
            setProfile(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('instructortoken');
            const formData = new FormData();
            Object.keys(profile).forEach(key => {
                if (profile[key]) formData.append(key, profile[key]);
            });

            const response = await axios.put(
                'http://localhost:8080/instructor/profile/update',
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            if (response.data.success) {
                toast.success('Profile updated successfully');
            }
        } catch (error) {
            toast.error('Failed to update profile');
            console.error('Error:', error);
        }
    };

    if (loading) return <div className="text-center py-5">Loading...</div>;

    return (
        <div className="container py-4">
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="card shadow-sm">
                        <div className="card-header bg-primary text-white">
                            <h4 className="mb-0">Profile Settings</h4>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleSubmit}>
                                <div className="text-center mb-4">
                                    <div className="position-relative d-inline-block">
                                        <img
                                            src={previewImage || 'https://via.placeholder.com/150'}
                                            alt="Profile"
                                            className="rounded-circle mb-3"
                                            style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                                        />
                                        <label className="btn btn-sm btn-primary position-absolute bottom-0 end-0">
                                            <i className="fas fa-camera"></i>
                                            <input
                                                type="file"
                                                name="profile_photo"
                                                className="d-none"
                                                onChange={handleChange}
                                                accept="image/*"
                                            />
                                        </label>
                                    </div>
                                </div>

                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label">First Name</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="first_name"
                                            value={profile.first_name}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Last Name</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="last_name"
                                            value={profile.last_name}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Email</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            value={profile.email}
                                            disabled
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Mobile</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="mobile"
                                            value={profile.mobile}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label">Address</label>
                                        <textarea
                                            className="form-control"
                                            name="address"
                                            value={profile.address}
                                            onChange={handleChange}
                                            rows="3"
                                        ></textarea>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Gender</label>
                                        <select
                                            className="form-select"
                                            name="gender"
                                            value={profile.gender}
                                            onChange={handleChange}
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Art Specialization</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="art_specialization"
                                            value={profile.art_specialization}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="text-end mt-4">
                                    <button type="submit" className="btn btn-primary">
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
