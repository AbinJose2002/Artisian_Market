import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Body = () => {
  const [products, setProducts] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch trending products
        const productsRes = await axios.get("http://localhost:8080/product/list");
        const eventsRes = await axios.get("http://localhost:8080/instructor/events/list");

        if (productsRes.data.success && Array.isArray(productsRes.data.products)) {
          setProducts(productsRes.data.products.slice(0, 4)); // Get first 4 products
        }

        if (eventsRes.data.success && Array.isArray(eventsRes.data.events)) {
          setEvents(eventsRes.data.events.slice(0, 2)); // Get first 2 events
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Image helper function
  const getProductImageUrl = (image) => {
    if (!image) return "https://source.unsplash.com/300x300/?art,crafts";
    return `${image}`;
  };

  const getEventImageUrl = (image) => {
    if (!image) return "https://source.unsplash.com/300x300/?art,event";
    return `http://localhost:8080/uploads/event_posters/${image}`;
  };

  return (
    <>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h1 className="display-4 fw-bold mb-4">Discover Unique Artisan Creations</h1>
              <p className="lead mb-4">Explore handcrafted art, participate in exclusive events, and bid on one-of-a-kind masterpieces.</p>
              <div className="d-flex gap-3">
                <Link to="/shop" className="btn btn-primary btn-lg">Explore Shop</Link>
                <Link to="/events" className="btn btn-outline-primary btn-lg">Browse Events</Link>
              </div>
            </div>
            <div className="col-lg-6 d-none d-lg-block">
              <img 
                src="https://images.unsplash.com/photo-1589030343991-69ea1433b941?q=80&w=1200" 
                alt="Art Collection" 
                className="img-fluid rounded hero-image"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section py-5">
        <div className="container py-4">
          <h2 className="text-center mb-5">What We Offer</h2>
          <div className="row g-4">
            <div className="col-md-4">
              <div className="card h-100 feature-card">
                <div className="card-body text-center">
                  <div className="feature-icon mb-3">🎨</div>
                  <h4>Artisan Products</h4>
                  <p>Browse our collection of handcrafted items made by skilled artisans from across the country.</p>
                  <Link to="/shop" className="btn btn-sm btn-outline-primary mt-2">Shop Now</Link>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 feature-card">
                <div className="card-body text-center">
                  <div className="feature-icon mb-3">🎭</div>
                  <h4>Art Events</h4>
                  <p>Join workshops, exhibitions, and classes conducted by professional artists and instructors.</p>
                  <Link to="/events" className="btn btn-sm btn-outline-primary mt-2">View Events</Link>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 feature-card">
                <div className="card-body text-center">
                  <div className="feature-icon mb-3">🔨</div>
                  <h4>Art Auctions</h4>
                  <p>Participate in bidding for exclusive art pieces and collectibles at competitive prices.</p>
                  <Link to="/bids" className="btn btn-sm btn-outline-primary mt-2">View Auctions</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Products Section */}
      <section className="trending-section py-5 bg-light">
        <div className="container py-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">Trending Products</h2>
            <Link to="/shop" className="btn btn-outline-primary">View All</Link>
          </div>
          <div className="row g-4">
            {loading ? (
              <div className="col-12 text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              products.length > 0 ? (
                products.map(product => (
                  <div key={product._id} className="col-md-3">
                    <div className="card h-100 product-card">
                      <img 
                        src={getProductImageUrl(product.image)} 
                        className="card-img-top" 
                        alt={product.name}
                        style={{ height: '200px', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://source.unsplash.com/300x300/?art,crafts";
                        }}
                      />
                      <div className="card-body">
                        <h5 className="card-title">{product.name}</h5>
                        <p className="text-primary fw-bold">₹{product.price}</p>
                        <div className="d-flex justify-content-between">
                          <span className="badge bg-light text-dark">{product.category || 'Art'}</span>
                          <button className="btn btn-sm btn-outline-primary">Add to Cart</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="col-md-3">
                    <div className="card h-100 product-card">
                      <img 
                        src={`https://source.unsplash.com/300x300/?art,crafts&sig=${index}`} 
                        className="card-img-top" 
                        alt="Product"
                        style={{ height: '200px', objectFit: 'cover' }}
                      />
                      <div className="card-body">
                        <h5 className="card-title">Handcrafted Item {index + 1}</h5>
                        <p className="text-primary fw-bold">₹1,200</p>
                        <div className="d-flex justify-content-between">
                          <span className="badge bg-light text-dark">Painting</span>
                          <button className="btn btn-sm btn-outline-primary">Add to Cart</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="events-section py-5">
        <div className="container py-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">Upcoming Events</h2>
            <Link to="/events" className="btn btn-outline-primary">View All</Link>
          </div>
          <div className="row g-4">
            {loading ? (
              <div className="col-12 text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              events.length > 0 ? (
                events.map(event => (
                  <div key={event._id} className="col-md-6">
                    <div className="card event-card">
                      <div className="row g-0">
                        <div className="col-md-4">
                          <img 
                            src={event.poster_url || getEventImageUrl(event.poster)}
                            className="img-fluid rounded-start event-image" 
                            alt={event.name}
                            style={{ height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "https://source.unsplash.com/300x300/?art,event";
                            }}
                          />
                        </div>
                        <div className="col-md-8">
                          <div className="card-body">
                            <h5 className="card-title">{event.name}</h5>
                            <p className="card-text">{event.description}</p>
                            <p className="mb-1"><i className="bi bi-calendar me-2"></i> {event.date}</p>
                            <p className="mb-3"><i className="bi bi-geo-alt me-2"></i> {event.place || 'Online'}</p>
                            <Link to={`/events`} className="btn btn-sm btn-primary">Register Now</Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                Array.from({ length: 2 }).map((_, index) => (
                  <div key={index} className="col-md-6">
                    <div className="card event-card">
                      <div className="row g-0">
                        <div className="col-md-4">
                          <img 
                            src={`https://source.unsplash.com/300x300/?art,event&sig=${index}`}
                            className="img-fluid rounded-start event-image" 
                            alt="Event"
                            style={{ height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <div className="col-md-8">
                          <div className="card-body">
                            <h5 className="card-title">Art Workshop {index + 1}</h5>
                            <p className="card-text">Learn professional techniques from expert artists in this hands-on workshop.</p>
                            <p className="mb-1"><i className="bi bi-calendar me-2"></i> June 1{index + 1}, 2023</p>
                            <p className="mb-3"><i className="bi bi-geo-alt me-2"></i> Art Studio, Downtown</p>
                            <Link to={`/events`} className="btn btn-sm btn-primary">Register Now</Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section py-5 bg-light">
        <div className="container py-4">
          <h2 className="text-center mb-5">What Our Customers Say</h2>
          <div className="row g-4">
            {[
              { name: 'Priya S.', text: 'The quality of artisan products here is exceptional. I\'ve purchased multiple paintings and they\'ve all been beautiful.', rating: 5 },
              { name: 'Rahul M.', text: 'I attended a pottery workshop and it was an amazing experience. The instructor was knowledgeable and patient.', rating: 5 },
              { name: 'Anjali K.', text: 'I won a beautiful sculpture through the bidding system. The process was transparent and exciting!', rating: 4 }
            ].map((testimonial, index) => (
              <div key={index} className="col-md-4">
                <div className="card h-100 testimonial-card">
                  <div className="card-body">
                    <div className="ratings mb-3">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <span key={i} className="text-warning">★</span>
                      ))}
                    </div>
                    <p className="card-text mb-4">"{testimonial.text}"</p>
                    <p className="fw-bold mb-0">- {testimonial.name}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="newsletter-section py-5">
        <div className="container py-4">
          <div className="row justify-content-center">
            <div className="col-md-8 text-center">
              <h2 className="mb-3">Stay Updated</h2>
              <p className="mb-4">Subscribe to our newsletter for updates on new products, upcoming events, and exclusive offers.</p>
              <div className="input-group mb-3">
                <input type="email" className="form-control" placeholder="Your email address" />
                <button className="btn btn-primary" type="button">Subscribe</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>
        {`
          .hero-section {
            padding: 6rem 0;
            background-color: #f8f9fa;
            position: relative;
          }
          
          .hero-image {
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            transition: all 0.5s ease;
          }
          
          .hero-image:hover {
            transform: scale(1.02);
          }
          
          .feature-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
          }
          
          .feature-card {
            transition: all 0.3s ease;
            border: none;
            box-shadow: 0 5px 15px rgba(0,0,0,0.05);
          }
          
          .feature-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 15px 30px rgba(0,0,0,0.1);
          }
          
          .product-card {
            transition: all 0.3s ease;
            border: none;
            box-shadow: 0 5px 15px rgba(0,0,0,0.05);
          }
          
          .product-card:hover {
            transform: translateY(-5px);
          }
          
          .event-card {
            transition: all 0.3s ease;
            border: none;
            box-shadow: 0 5px 15px rgba(0,0,0,0.05);
            overflow: hidden;
          }
          
          .event-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 30px rgba(0,0,0,0.1);
          }
          
          .event-image {
            height: 100%;
            object-fit: cover;
            transition: all 0.5s ease;
          }
          
          .event-card:hover .event-image {
            transform: scale(1.05);
          }
          
          .testimonial-card {
            border: none;
            box-shadow: 0 5px 15px rgba(0,0,0,0.05);
          }
          
          .newsletter-section {
            background-color: var(--primary-color);
            color: white;
          }
          
          .btn-primary {
            background-color: var(--primary-color);
            border-color: var(--primary-color);
          }
          
          .btn-outline-primary {
            color: var(--primary-color);
            border-color: var(--primary-color);
          }
          
          .btn-outline-primary:hover {
            background-color: var(--primary-color);
            color: white;
          }
        `}
      </style>
    </>
  );
};

export default Body;
