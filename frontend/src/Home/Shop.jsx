import React, { useState, useEffect } from "react";
import axios from "axios";
import ArtItems from "./ArtItems";
import { useNavigate } from "react-router-dom";

const Shop = () => {
  const [shopArtData, setShopArtData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const categories = [
    "all",
    "Painting",
    "Sculpture",
    "Photography",
    "Digital Art",
    "Calligraphy",
    "Mixed Media"
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get("http://localhost:8080/product/list");
        const formattedProducts = res.data.products.map(product => ({
          id: product._id, // Ensure MongoDB ObjectId is converted to string in API
          name: product.name,
          price: product.price,
          image: product.image || "https://source.unsplash.com/300x300/?art", // Fallback image
          category: product.category || "Mixed Media", // Fallback category
          quantity: product.quantity || 0 // Add quantity here
        }));
        setShopArtData(formattedProducts);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Failed to load products.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredData(shopArtData);
    } else {
      setFilteredData(shopArtData.filter(item => item.category === selectedCategory));
    }
  }, [selectedCategory, shopArtData]);

  const handleArtClick = (artId) => {
    navigate(`/art/${artId}`);
  };

  return (
    <div>
      <div className="container py-5">
        <div className="row mb-5">
          <div className="col-12">
            <div className="filter-container p-4 rounded-3 shadow-sm">
              <h4 className="text-center mb-4">Browse by Category</h4>
              <div className="d-flex justify-content-center gap-3 flex-wrap">
                {categories.map(category => (
                  <button
                    key={category}
                    className={`filter-btn ${selectedCategory === category ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      )}
      {error && <p className="text-danger animate__animated animate__shakeX">{error}</p>}
      {!loading && !error && <ArtItems items={filteredData} onArtClick={handleArtClick} />}

      <style jsx>{`
        .loading-spinner {
          display: flex;
          justify-content: center;
          padding: 2rem;
        }
        .spinner {
          width: 50px;
          height: 50px;
          border: 5px solid #f0f0f7;
          border-top: 5px solid #3a1d6e;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        .text-danger {
          color: #dc3545 !important;
          font-weight: 500;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .btn-outline-primary {
          border-color: var(--primary-color);
          color: var(--primary-color);
          transition: all 0.3s ease;
        }
        .btn-outline-primary:hover {
          background-color: var(--primary-color);
          color: white;
        }
        .btn-primary {
          background-color: var(--primary-color);
          border-color: var(--primary-color);
        }
        .filter-container {
          background: white;
          border: 1px solid rgba(0,0,0,0.1);
          transition: all 0.3s ease;
        }

        .filter-container:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 15px rgba(0,0,0,0.1) !important;
        }

        .filter-btn {
          padding: 0.6rem 1.2rem;
          border: 2px solid var(--primary-color);
          background: transparent;
          color: var(--primary-color);
          border-radius: 25px;
          font-weight: 500;
          transition: all 0.3s ease;
          min-width: 120px;
        }

        .filter-btn:hover {
          background: var(--primary-color);
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(58, 29, 110, 0.2);
        }

        .filter-btn.active {
          background: var(--primary-color);
          color: white;
          box-shadow: 0 4px 8px rgba(58, 29, 110, 0.2);
        }

        h4 {
          color: var(--primary-color);
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default Shop;
