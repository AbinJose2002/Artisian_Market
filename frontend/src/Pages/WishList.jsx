import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { BsTrash } from 'react-icons/bs';

const WishList = () => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const token = localStorage.getItem('usertoken');
      const response = await axios.get('http://localhost:8080/product/wishlist', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWishlistItems(response.data.items);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      const token = localStorage.getItem('usertoken');
      await axios.delete(`http://localhost:8080/product/wishlist/remove/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchWishlist();
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container py-5">
      <h2 className="mb-4">My Wishlist</h2>
      {wishlistItems.length === 0 ? (
        <div className="text-center">
          <p>Your wishlist is empty</p>
          <Link to="/shop" className="btn btn-primary">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="row g-4">
          {wishlistItems.map((item) => (
            <div key={item._id} className="col-md-3">
              <div className="card h-100">
                <img src={item.image} className="card-img-top" alt={item.name} />
                <div className="card-body">
                  <h5 className="card-title">{item.name}</h5>
                  <p className="card-text">₹{item.price}</p>
                  <div className="d-flex justify-content-between">
                    <Link to={`/art/${item._id}`} className="btn btn-primary">
                      View Details
                    </Link>
                    <button 
                      className="btn btn-danger"
                      onClick={() => removeFromWishlist(item._id)}
                    >
                      <BsTrash />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WishList;
