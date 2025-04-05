import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

function ArtItems({ items }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === "/";

  const handleArtClick = (artId) => {
    navigate(`/art/${artId}`);
  };

  // Show only first 4 items on Home page
  const displayedItems = isHomePage ? items.slice(0, 4) : items;

  return (
    <div className="container py-5">
      <h2 className="text-center mb-4 fw-bold">{isHomePage ? "Featured Artworks" : "Shop All Artworks"}</h2>
      <div className="row g-4">
        {displayedItems.map((item) => (
          <div key={item.id} className="col-md-3 col-sm-6">
            <div className="art-card h-100">
              <div className="card-img-wrapper position-relative">
                <img src={item.image} alt={item.name} />
                {item.quantity <= 0 && (
                  <div className="out-of-stock-overlay">
                    Out of Stock
                  </div>
                )}
              </div>
              <div className="card-content">
                <h5>{item.name}</h5>
                <p className="price">₹{item.price}</p>
                <p className={`stock ${item.quantity <= 0 ? 'text-danger' : 'text-success'}`}>
                  {item.quantity <= 0 ? 'Out of Stock' : `In Stock: ${item.quantity}`}
                </p>
                <button 
                  className={`view-btn ${item.quantity <= 0 ? 'disabled' : ''}`}
                  onClick={() => item.quantity > 0 && handleArtClick(item.id)}
                  disabled={item.quantity <= 0}
                >
                  {item.quantity <= 0 ? 'Out of Stock' : 'View Details'}
                </button>
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

      <style jsx>{`
        .art-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          transition: transform 0.3s, box-shadow 0.3s;
          cursor: pointer;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .art-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 16px rgba(0,0,0,0.2);
        }
        
        .card-img-wrapper {
          height: 250px;
          overflow: hidden;
          position: relative;
        }
        
        .card-img-wrapper img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s;
        }
        
        .art-card:hover .card-img-wrapper img {
          transform: scale(1.05);
        }
        
        .out-of-stock-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.7);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          font-weight: bold;
        }
        
        .card-content {
          padding: 1.5rem;
          text-align: center;
        }
        
        .price {
          font-size: 1.25rem;
          color: #2c3e50;
          font-weight: 600;
          margin: 0.5rem 0;
        }
        
        .stock {
          font-size: 1rem;
          margin: 0.5rem 0;
          font-weight: 500;
          margin-bottom: 10px;
        }
        
        .view-btn {
          background: #3498db;
          color: white;
          border: none;
          padding: 0.5rem 1.5rem;
          border-radius: 25px;
          transition: background 0.3s;
        }
        
        .view-btn:hover {
          background: #2980b9;
        }
        
        .view-btn.disabled {
          background: #ccc;
          cursor: not-allowed;
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
}

export default ArtItems;
