import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BsCart, BsPersonCircle, BsHeart } from "react-icons/bs";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Navbar.css"; // For additional styling

const Navbar = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState(null);

  useEffect(() => {
    if (localStorage.getItem("usertoken")) {
      setRole("user");
    } else if (localStorage.getItem("instructortoken")) {
      setRole("instructor");
    } else if (localStorage.getItem("sellertoken")) {
      setRole("seller");
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setRole(null);
    navigate("/");
    window.location.reload(); // Reload the page to reflect the logout state
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark nav-custom px-5">
      <Link className="navbar-brand fw-bold" to="/">Decor Collect</Link>

      <button
        className="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
        aria-controls="navbarNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span className="navbar-toggler-icon"></span>
      </button>

      <div className="collapse navbar-collapse justify-content-center" id="navbarNav">
        <ul className="navbar-nav">
          <li className="nav-item">
            <Link className="nav-link" to="/">Home</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to="/shop">Shop</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to="/craft">Craft Items</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to="/events">Events</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to="/contact">Contact Us</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to="/bids">Bids</Link>
          </li>
        </ul>
      </div>

      <div className="d-flex align-items-center">
        <Link className="nav-link me-3 cart-icon text-white" to="/cart">
          <BsCart size={22} />
        </Link>
        <Link className="nav-link me-3 text-white" to="/wishlist">
          <BsHeart size={22} />
        </Link>

        {role ? (
          <div className="dropdown">
            <BsPersonCircle size={24} className="profile-icon dropdown-toggle text-white" data-bs-toggle="dropdown" />
            <ul className="dropdown-menu dropdown-menu-end">
              <li>
                {role === "user" && <Link className="dropdown-item" to="/user-dashboard">Dashboard</Link>}
                {role === "instructor" && <Link className="dropdown-item" to="/instructor-dashboard">Dashboard</Link>}
                {role === "seller" && <Link className="dropdown-item" to="/seller-dashboard">Dashboard</Link>}
              </li>
              <li>
                <button className="dropdown-item text-danger" onClick={handleLogout}>Logout</button>
              </li>
            </ul>
          </div>
        ) : (
          <div className="dropdown">
            <button
              className="btn btn-outline-light dropdown-toggle"
              type="button"
              data-bs-toggle="dropdown"
            >
              Login / Signup
            </button>
            <ul className="dropdown-menu dropdown-menu-end">
              <li>
                <button className="dropdown-item" onClick={() => navigate("/user-login")}>
                  Login as User
                </button>
              </li>
              <li>
                <button className="dropdown-item" onClick={() => navigate("/instructor-login")}>
                  Login as Instructor
                </button>
              </li>
              <li>
                <button className="dropdown-item" onClick={() => navigate("/seller-login")}>
                  Login as Seller
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
