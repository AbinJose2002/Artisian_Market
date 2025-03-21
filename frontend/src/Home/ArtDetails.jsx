import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const ArtDetails = () => {
  const { id } = useParams();
  const [art, setArt] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <p>Loading...</p>;
  if (!art) return <p>Art not found.</p>;

  return (
    <div className="container mt-4">
      <div className="row">
        {/* Left: Product Image */}
        <div className="col-md-5 text-center">
          <img
            src={art.image}
            alt={art.name}
            className="img-fluid rounded shadow"
            style={{ maxHeight: "450px", objectFit: "cover" }}
          />
          <div className="mt-3">
            <button className="btn btn-warning btn-lg me-3">Add to Cart</button>
            <button className="btn btn-success btn-lg">Buy Now</button>
          </div>
        </div>

        {/* Right: Product Details */}
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
            <button className="btn btn-outline-primary btn-lg">Wishlist</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtDetails;
