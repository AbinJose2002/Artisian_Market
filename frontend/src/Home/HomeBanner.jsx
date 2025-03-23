import React from "react";
import artillu from '../assets/art-illu.jpg';
import "./HomeBanner.css";

const HomeBanner = () => {
  return (
    <div className="banner-wrapper">
      <div className="banner-container">
        <div className="banner-overlay"></div>
        <div className="container position-relative">
          <div className="row h-100 align-items-center">
            <div className="col-md-6 banner-content">
              <h1 className="mega-title">
                <span className="highlight">Discover</span> Unique
                <span className="d-block">Artisan Creations</span>
              </h1>
              <p className="banner-subtitle">
                Explore handcrafted masterpieces from talented artists worldwide
              </p>

              <div className="category-pills">
                <span className="pill">Paintings</span>
                <span className="pill">Sculptures</span>
                <span className="pill">Digital Art</span>
                <span className="pill">Photography</span>
              </div>
            </div>
            
            <div className="col-md-6 banner-image-container">
              <img
                src={artillu}
                alt="Art Store"
                className="floating-image"
              />
              <div className="stats-card">
                <div className="stat-item">
                  <span className="stat-number">1000+</span>
                  <span className="stat-label">Artworks</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">500+</span>
                  <span className="stat-label">Artists</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeBanner;
