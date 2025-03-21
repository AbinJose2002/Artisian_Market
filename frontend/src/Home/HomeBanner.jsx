import React from "react";
import artillu from '../assets/art-illu.jpg'; // Import the image
import "./HomeBanner.css"; // Add custom styling if needed

const HomeBanner = () => {
  return (
    <div className="container-fluid banner-container d-flex align-items-center justify-content-center py-5">
      <div className="row w-100">
        {/* Left Side - Text Content */}
        <div className="col-md-6 d-flex flex-column justify-content-center text-center text-md-start px-4">
          <h1 className="fw-bold">Discover the Art Within</h1>
          <p className="lead">
            Welcome to our exclusive Art Store! Find unique, handcrafted pieces
            that tell a story and inspire creativity.
          </p>
          <button className="btn btn-primary mt-3 col-3">Explore Now</button>
        </div>

        {/* Right Side - Image */}
        <div className="col-md-6 d-flex justify-content-center align-items-center">
          <img
            src={artillu}
            alt="Art Store"
            className="img-fluid rounded "
          />
        </div>
      </div>
    </div>
  );
};

export default HomeBanner;
