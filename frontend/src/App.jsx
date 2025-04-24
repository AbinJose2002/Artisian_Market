import React from 'react'
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import UserRegister from "./Auth/User/UserRegister"
import UserLogin from "./Auth/User/UserLogin"
import InstructorLogin from "./Auth/Instructor/InstructorLogin"
import InstructorRegistrer from './Auth/Instructor/InstructorRegistrer'
import InstructorHome from './Dashboard/Instructor/InstructorHome'
import Home from './Dashboard/User/Home'
import SellerHome from './Dashboard/Seller/SellerHome'
import SellerLogin from './Auth/Seller/SellerLogin'
import SellerRegister from './Auth/Seller/SellerRegistrer'
import Navbar from './Navbar/Navbar'
import Body from "./Home/Body"
import Shop from "./Home/Shop"
import ArtDetails from './Home/ArtDetails'
import WishList from './Pages/WishList'
import Events from './Pages/Events'
import PaymentSuccess from './Pages/PaymentSuccess'
import Cart from './Pages/Cart'
import AdminLogin from "./Auth/Admin/AdminLogin";
import AdminRegister from "./Auth/Admin/AdminRegister";
import AdminHome from './Dashboard/Admin/AdminHome';
import Bids from './Pages/Bids';
import Contact from './Home/Contact'
import Crafts from './Pages/Crafts'
import CraftDetail from './Pages/CraftDetail'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ThankYou from './Pages/ThankYou';
// import Footer from '';

export default function App() {
  return (
    <div>
      <Router>
        <Navbar />
        <ToastContainer />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Body />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/wishlist" element={<WishList />} />
          <Route path="/art/:id" element={<ArtDetails />} />
          <Route path="/events" element={<Events />} />
          <Route path='/cart' element={<Cart />}></Route>
          <Route path="/bids" element={<Bids />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/craft" element={<Crafts />} />
          <Route path="/craft/:id" element={<CraftDetail />} />
          <Route path="/thank-you" element={<ThankYou />} />

          {/* User Routes */}
          <Route path="/user-register" element={<UserRegister />} />
          <Route path="/user-login" element={<UserLogin />} />
          <Route path="/user-dashboard" element={<Home />} />

          {/* Instructor Routes */}
          <Route path="/instructor-login" element={<InstructorLogin />} />
          <Route path="/instructor-register" element={<InstructorRegistrer />} />
          <Route path="/instructor-dashboard" element={<InstructorHome />} />

          {/* Seller Routes */}
          <Route path="/seller-register" element={<SellerRegister />} />
          <Route path="/seller-login" element={<SellerLogin />} />
          <Route path="/seller-dashboard" element={<SellerHome />} />

          {/* Admin Routes */}
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin-register" element={<AdminRegister />} />
          <Route path="/admin-dashboard" element={<AdminHome />} />

          {/* Payment Routes */}
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/cancel" element={<Navigate to="/events" replace />} />
        </Routes>
        {/* <Footer /> */}
      </Router>
    </div>
  )
}