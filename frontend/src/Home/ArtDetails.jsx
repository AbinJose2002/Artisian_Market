import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const ArtDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [art, setArt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchArtDetails = async () => {
      try {
        const res = await axios.get(`http://localhost:8080/product/art/${id}`);
        setArt(res.data.product);
        console.log(res.data.product);
      } catch (error) {
        console.error("Error fetching art details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArtDetails();
  }, [id]);

  const getToken = () => {
    return (
      localStorage.getItem('usertoken') || 
      localStorage.getItem('sellertoken') || 
      localStorage.getItem('instructortoken')
    );
  };

  const handleAddToCart = async () => {
    try {
      const token = getToken();
      if (!token) {
        navigate('/user-login', { state: { from: `/art/${id}` } });
        return;
      }

      const response = await axios.post(
        'http://localhost:8080/product/cart/add',
        { product_id: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setMessage({ type: 'success', text: response.data.message });
      } else {
        setMessage({ type: 'error', text: response.data.message });
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to add to cart' 
      });
    }
  };

  const handleAddToWishlist = async () => {
    try {
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.post(
        'http://localhost:8080/product/wishlist/add',
        { product_id: id },
        { headers: { Authorization: `Bearer ${token}` }}
      );

      setMessage({ type: 'success', text: 'Added to wishlist successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to add to wishlist' });
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!art) return <p>Art not found.</p>;

  return (
    <div className="art-details-container">
      {message && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
          {message.text}
        </div>
      )}
      <div className="row g-5">
        <div className="col-md-5">
          <div className="image-container">
            <img src={art.image} alt={art.name} />
          </div>
          <div className="action-buttons">
            <button className="btn-cart" onClick={handleAddToCart}>Add to Cart</button>
            <button className="btn-buy">Buy Now</button>
          </div>
        </div>

        <div className="col-md-7">
          <h2 className="fw-bold">{art.name}</h2>
          <p className="text-muted">Category: {art.category}</p>
          
          <div className="mb-3">
            <h3 className="text-danger">₹{art.price}</h3>
            <span className="text-success fw-bold">Inclusive of all taxes</span>
          </div>

          <p className="lead">{art.description}</p>

          {/* Delivery & Offers Section */}
          <div className="bg-light p-3 rounded">
            <h5 className="fw-bold">Available Offers</h5>
            <ul className="list-unstyled">
              <li>✅ 10% off on first order</li>
              <li>✅ Free delivery for orders above ₹500</li>
              <li>✅ Cashback offers available on select cards</li>
            </ul>
          </div>

          {/* Additional Information */}
          <div className="mt-4">
            <h5 className="fw-bold">Product Details</h5>
            <table className="table">
              <tbody>
                <tr>
                  <td>Artist</td>
                  <td>{art.artist || "Unknown"}</td>
                </tr>
                <tr>
                  <td>Dimensions</td>
                  <td>{art.dimensions || "24x36 inches"}</td>
                </tr>
                <tr>
                  <td>Material</td>
                  <td>{art.material || "Canvas"}</td>
                </tr>
                <tr>
                  <td>Frame</td>
                  <td>{art.frame || "No frame included"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Action Buttons */}
          <div className="mt-3">
            <button className="btn btn-outline-primary btn-lg" onClick={handleAddToWishlist}>
              Wishlist
            </button>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .art-details-container {
          max-width: 1200px;
          margin: 2rem auto;
          padding: 0 1rem;
        }
        
        .image-container {
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 8px 16px rgba(0,0,0,0.1);
          transition: transform 0.3s;
        }
        
        .image-container:hover {
          transform: scale(1.02);
        }
        
        .image-container img {
          width: 100%;
          height: auto;
          object-fit: cover;
        }
        
        .action-buttons {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
        }
        
        .btn-cart, .btn-buy {
          flex: 1;
          padding: 1rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .btn-cart {
          background: #f39c12;
          color: white;
        }
        
        .btn-buy {
          background: #2ecc71;
          color: white;
        }
        
        .btn-cart:hover, .btn-buy:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        
        h2 {
          font-size: 2.5rem;
          margin-bottom: 1rem;
          color: #2c3e50;
        }
        
        .price-tag {
          font-size: 2rem;
          color: #e74c3c;
          font-weight: 700;
        }
        
        .offers-section {
          background: #f8f9fa;
          padding: 1.5rem;
          border-radius: 12px;
          margin: 2rem 0;
        }
      `}</style>
    </div>
  );
};

export default ArtDetails;
