import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const SellerProfile = () => {
    const [profile, setProfile] = useState({
        first_name: '',
        last_name: '',
        email: '',
        mobile: '',
        address: '',
        shop_name: '',
        bio: '',
        profile_photo: null
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('sellertoken');
            if (!token) {
                toast.error('Please login to view profile');
                return;
            }

            const response = await axios.get('http://localhost:8080/seller/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setProfile(response.data.profile);
                if (response.data.profile.profile_photo) {
                    setPreviewImage(`http://localhost:8080/uploads/profile_photos/${response.data.profile.profile_photo}`);
                }
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            toast.error('Failed to load profile data');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'profile_photo' && files[0]) {
            setProfile({ ...profile, profile_photo: files[0] });
            setPreviewImage(URL.createObjectURL(files[0]));
        } else {
            setProfile({ ...profile, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const token = localStorage.getItem('sellertoken');
            const formData = new FormData();
            
            for (const key in profile) {
                formData.append(key, profile[key]);
            }

            const response = await axios.put(
                'http://localhost:8080/seller/profile',
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            if (response.data.success) {
                toast.success('Profile updated successfully');
            } else {
                throw new Error(response.data.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Loading profile...</p>
            </div>
        );
    }

    return (
        <div className="container py-4">
            <h2 className="mb-4">Your Profile</h2>
            <form onSubmit={handleSubmit}>
                <div className="row">
                    <div className="col-md-4 mb-4 text-center">
                        <div className="profile-photo-container">
                            <img
                                src={previewImage || 'https://via.placeholder.com/200?text=Profile+Photo'}
                                alt="Profile"
                                className="img-thumbnail rounded-circle profile-photo"
                            />
                            <div className="mt-3">
                                <label className="btn btn-outline-primary">
                                    Change Photo
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
                    </div>
                    
                    <div className="col-md-8">
                        <div className="card shadow-sm">
                            <div className="card-body">
                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <label className="form-label">First Name</label>
                                        <input
                                            type="text"
                                            name="first_name"
                                            className="form-control"
                                            value={profile.first_name || ''}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Last Name</label>
                                        <input
                                            type="text"
                                            name="last_name"
                                            className="form-control"
                                            value={profile.last_name || ''}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>
                                
                                <div className="mb-3">
                                    <label className="form-label">Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        className="form-control"
                                        value={profile.email || ''}
                                        disabled
                                    />
                                    <small className="text-muted">Email cannot be changed</small>
                                </div>
                                
                                <div className="mb-3">
                                    <label className="form-label">Shop Name</label>
                                    <input
                                        type="text"
                                        name="shop_name"
                                        className="form-control"
                                        value={profile.shop_name || ''}
                                        onChange={handleChange}
                                    />
                                </div>
                                
                                <div className="mb-3">
                                    <label className="form-label">Mobile Number</label>
                                    <input
                                        type="tel"
                                        name="mobile"
                                        className="form-control"
                                        value={profile.mobile || ''}
                                        onChange={handleChange}
                                    />
                                </div>
                                
                                <div className="mb-3">
                                    <label className="form-label">Address</label>
                                    <textarea
                                        name="address"
                                        className="form-control"
                                        rows="3"
                                        value={profile.address || ''}
                                        onChange={handleChange}
                                    ></textarea>
                                </div>
                                
                                <div className="mb-3">
                                    <label className="form-label">Bio</label>
                                    <textarea
                                        name="bio"
                                        className="form-control"
                                        rows="4"
                                        value={profile.bio || ''}
                                        onChange={handleChange}
                                        placeholder="Tell customers about yourself and your products..."
                                    ></textarea>
                                </div>
                                
                                <div className="text-end">
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={saving}
                                    >
                                        {saving ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                Saving...
                                            </>
                                        ) : 'Save Changes'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>

            <style jsx>{`
                .profile-photo-container {
                    padding: 20px;
                }
                .profile-photo {
                    width: 200px;
                    height: 200px;
                    object-fit: cover;
                    border: 5px solid #f8f9fa;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                }
            `}</style>
        </div>
    );
};

export default SellerProfile;
