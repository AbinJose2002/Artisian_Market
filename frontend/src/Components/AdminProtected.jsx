import React from 'react';
import { Navigate } from 'react-router-dom';

const AdminProtected = ({ children }) => {
  const adminToken = localStorage.getItem('admintoken');
  
  if (!adminToken) {
    // Redirect to admin login if no token is found
    return <Navigate to="/admin/login" replace />;
  }
  
  // If admin token exists, render the child components
  return children;
};

export default AdminProtected;
