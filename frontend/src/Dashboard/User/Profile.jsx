import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCamera, FaSave } from 'react-icons/fa';

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [userData, setUserData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    mobile: '',
    address: '',
    profile_photo: null
  });
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('usertoken');
      
      if (!token) {
        toast.error('Please login to view your profile');
        return;
      }

      const response = await axios.get('http://localhost:8080/user/details', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setUserData(response.data.user);
        if (response.data.user.profile_photo) {
          setPreviewImage(`http://localhost:8080/uploads/profile_photos/${response.data.user.profile_photo}`);
        }
      } else {
        toast.error('Failed to fetch profile data');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('An error occurred while fetching your profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUserData(prev => ({
        ...prev,
        profile_photo: file
      }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setUpdating(true);
      const token = localStorage.getItem('usertoken');
      
      if (!token) {
        toast.error('Please login to update your profile');
        return;
      }

      const formData = new FormData();
      Object.keys(userData).forEach(key => {
        if (key === 'profile_photo' && typeof userData[key] === 'object') {
          formData.append(key, userData[key]);
        } else if (key !== 'profile_photo' || typeof userData[key] === 'string') {
          formData.append(key, userData[key]);
        }
      });

      const response = await axios.put(
        'http://localhost:8080/user/update',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        toast.success('Profile updated successfully!');
      } else {
        toast.error(response.data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('An error occurred while updating your profile');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body text-center p-4">
              <div className="position-relative mb-4 mx-auto" style={{ width: '150px', height: '150px' }}>
                {previewImage ? (
                  <img 
                    src={previewImage}
                    alt="Profile" 
                    className="rounded-circle img-thumbnail" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div 
                    className="rounded-circle bg-light d-flex align-items-center justify-content-center" 
                    style={{ width: '100%', height: '100%' }}
                  >
                    <FaUser size={60} className="text-secondary" />
                  </div>
                )}
                <label 
                  className="position-absolute bottom-0 end-0 bg-primary rounded-circle p-2 shadow"
                  style={{ cursor: 'pointer' }}
                >
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                  <FaCamera className="text-white" />
                </label>
              </div>
              
              <h4 className="mb-0">{userData.first_name} {userData.last_name}</h4>
              <p className="text-muted">{userData.email}</p>
              
              <div className="d-grid mt-4">
                <button 
                  className="btn btn-primary"
                  onClick={handleSubmit}
                  disabled={updating}
                >
                  {updating ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Updating...
                    </>
                  ) : (
                    <>
                      <FaSave className="me-2" /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <h5 className="card-title mb-3">Account Information</h5>
              <div className="mb-2 d-flex align-items-center">
                <FaEnvelope className="me-2 text-primary" />
                <span>{userData.email}</span>
              </div>
              <div className="mb-2 d-flex align-items-center">
                <FaPhone className="me-2 text-primary" />
                <span>{userData.mobile || 'Not provided'}</span>
              </div>
              <div className="d-flex align-items-center">
                <FaMapMarkerAlt className="me-2 text-primary" />
                <span>{userData.address || 'Not provided'}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <h4 className="mb-4">Edit Profile</h4>
              
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">First Name</label>
                    <input 
                      type="text"
                      className="form-control"
                      name="first_name"
                      value={userData.first_name || ''}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="col-md-6">
                    <label className="form-label">Last Name</label>
                    <input 
                      type="text"
                      className="form-control"
                      name="last_name"
                      value={userData.last_name || ''}
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
                      value={userData.email || ''}
                      onChange={handleChange}
                      required
                      readOnly
                    />
                    <div className="form-text">Email address cannot be changed</div>
                  </div>
                  
                  <div className="col-md-6">
                    <label className="form-label">Phone Number</label>
                    <input 
                      type="tel"
                      className="form-control"
                      name="mobile"
                      value={userData.mobile || ''}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="col-12">
                    <label className="form-label">Address</label>
                    <textarea 
                      className="form-control"
                      name="address"
                      value={userData.address || ''}
                      onChange={handleChange}
                      rows="3"
                    ></textarea>
                  </div>
                  
                  <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <button 
                        type="button" 
                        className="btn btn-outline-secondary"
                        onClick={fetchUserProfile}
                      >
                        Reset Changes
                      </button>
                      
                      <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={updating}
                      >
                        {updating ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Updating...
                          </>
                        ) : (
                          'Update Profile'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
