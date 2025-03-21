import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./ArtItems.css";

const ArtItems = ({ items }) => {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  // Show only first 4 items on Home page
  const displayedItems = isHomePage ? items.slice(0, 4) : items;

  return (
    <div className="container py-5">
      <h2 className="text-center mb-4">{isHomePage ? "Featured Artworks" : "Shop All Artworks"}</h2>
      <div className="row">
        {displayedItems.map((item) => (
          <div key={item.id} className="col-md-3 col-sm-6 mb-4">
            <div className="card art-card shadow-sm">
              <img src={item.image} className="card-img-top" alt={item.name} />
              <div className="card-body text-center">
                <h5 className="card-title">{item.name}</h5>
                <p className="card-text">${item.price}</p>
                <Link to={`/art/${item._id}`} className="btn btn-primary">
                  View Details
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Show "View All" Button only on Home Page */}
      {isHomePage && (
        <div className="text-center mt-4">
          <Link to="/shop" className="btn btn-outline-primary">
            View All Artworks
          </Link>
        </div>
      )}
    </div>
  );
};

export default ArtItems;
