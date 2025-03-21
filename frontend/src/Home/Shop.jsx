import React, { useState, useEffect } from "react";
import axios from "axios";
import ArtItems from "./ArtItems";

const Shop = () => {
  const [shopArtData, setShopArtData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  return (
    <div>
      {loading && <p>Loading products...</p>}
      {error && <p className="text-danger">{error}</p>}
      {!loading && !error && <ArtItems items={shopArtData} />}
    </div>
  );
};

export default Shop;
