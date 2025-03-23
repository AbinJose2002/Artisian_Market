import React, { useState, useEffect } from "react";
import axios from "axios";
import ArtItems from "./ArtItems";
import { useNavigate } from "react-router-dom";

const Shop = () => {
  const [shopArtData, setShopArtData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get("http://localhost:8080/product/list");
        const formattedProducts = res.data.products.map(product => ({
          id: product._id, // Ensure MongoDB ObjectId is converted to string in API
          name: product.name,
          price: product.price,
          image: product.image || "https://source.unsplash.com/300x300/?art", // Fallback image
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

  const handleArtClick = (artId) => {
    navigate(`/art/${artId}`);
  };

  return (
    <div>
      {loading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      )}
      {error && <p className="text-danger animate__animated animate__shakeX">{error}</p>}
      {!loading && !error && <ArtItems items={shopArtData} onArtClick={handleArtClick} />}
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
      `}</style>
    </div>
  );
};

export default Shop;
