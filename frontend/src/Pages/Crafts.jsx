import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faShoppingCart, faFilter, faTimes, faSearch } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';

const Crafts = () => {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOption, setSortOption] = useState('default');
    
    const userToken = localStorage.getItem('usertoken') || 
    localStorage.getItem('sellertoken') || 
    localStorage.getItem('instructortoken');

    const fetchMaterials = async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://localhost:8080/material/list');
            if (response.data.success) {
                setMaterials(response.data.materials);
                
                // Extract unique categories
                const uniqueCategories = [...new Set(response.data.materials.map(material => material.category))];
                setCategories(['All', ...uniqueCategories]);
            }
        } catch (error) {
            console.error("Error fetching craft materials:", error);
            toast.error("Failed to load craft materials");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMaterials();
    }, []);

    const handleAddToCart = async (materialId) => {
        if (!userToken) {
            toast.warning("Please login to add items to cart");
            return;
        }

        try {
            console.log("Adding material to cart:", materialId);
            const response = await axios.post(
                'http://localhost:8080/material/cart/add',
                { material_id: materialId },
                { headers: { Authorization: `Bearer ${userToken}` } }
            );

            if (response.data.success) {
                toast.success("Added to cart successfully!");
            } else {
                toast.error(response.data.message || "Failed to add to cart");
            }
        } catch (error) {
            console.error("Error adding to cart:", error.response?.data || error);
            toast.error(error.response?.data?.message || "Failed to add to cart");
        }
    };

    const handleAddToWishlist = async (materialId) => {
        if (!userToken) {
            toast.warning("Please login to add items to wishlist");
            return;
        }

        try {
            const response = await axios.post(
                'http://localhost:8080/material/wishlist/add',
                { material_id: materialId },
                { headers: { Authorization: `Bearer ${userToken}` } }
            );

            if (response.data.success) {
                toast.success("Added to wishlist!");
            }
        } catch (error) {
            toast.error("Failed to add to wishlist");
            console.error("Error adding to wishlist:", error);
        }
    };

    const filteredMaterials = materials
        .filter(material => 
            (selectedCategory === 'All' || material.category === selectedCategory) &&
            (material.price >= priceRange.min && material.price <= priceRange.max) &&
            (material.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
             material.description.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        .sort((a, b) => {
            switch (sortOption) {
                case 'price-low-to-high':
                    return a.price - b.price;
                case 'price-high-to-low':
                    return b.price - a.price;
                default:
                    return 0;
            }
        });

    return (
        <div className="container mt-4 mb-5">
            <h2 className="mb-4 text-center">Craft Materials</h2>
            
            {/* Search and Filter Controls */}
            <div className="row mb-4">
                <div className="col-md-6">
                    <div className="input-group">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search craft materials..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button className="btn btn-primary">
                            <FontAwesomeIcon icon={faSearch} />
                        </button>
                    </div>
                </div>
                <div className="col-md-6 text-end">
                    <button 
                        className="btn btn-outline-primary me-2"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <FontAwesomeIcon icon={faFilter} /> Filter
                    </button>
                    <select 
                        className="form-select d-inline-block" 
                        style={{ width: 'auto' }}
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value)}
                    >
                        <option value="default">Sort By</option>
                        <option value="price-low-to-high">Price: Low to High</option>
                        <option value="price-high-to-low">Price: High to Low</option>
                    </select>
                </div>
            </div>
            
            {/* Filter Panel */}
            {showFilters && (
                <div className="card mb-4 filter-panel">
                    <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="mb-0">Filters</h5>
                            <button 
                                className="btn btn-sm btn-outline-secondary" 
                                onClick={() => setShowFilters(false)}
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Category</label>
                                <select 
                                    className="form-select"
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                >
                                    {categories.map(category => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Price Range</label>
                                <div className="d-flex">
                                    <input
                                        type="number"
                                        className="form-control me-2"
                                        placeholder="Min"
                                        value={priceRange.min}
                                        onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
                                    />
                                    <input
                                        type="number"
                                        className="form-control"
                                        placeholder="Max"
                                        value={priceRange.max}
                                        onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Materials Display */}
            {loading ? (
                <div className="text-center my-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Loading craft materials...</p>
                </div>
            ) : filteredMaterials.length === 0 ? (
                <div className="text-center my-5">
                    <p>No craft materials found matching your criteria.</p>
                </div>
            ) : (
                <div className="row">
                    {filteredMaterials.map((material) => (
                        <div key={material._id} className="col-md-3 mb-4">
                            <div className="card h-100 material-card">
                                <Link to={`/craft/${material._id}`} className="text-decoration-none">
                                    {material.image ? (
                                        <img 
                                            src={material.image} 
                                            className="card-img-top material-image" 
                                            alt={material.name} 
                                        />
                                    ) : (
                                        <div className="placeholder-image">No Image</div>
                                    )}
                                    <div className="card-body">
                                        <h5 className="card-title">{material.name}</h5>
                                        <p className="card-text text-truncate">{material.description}</p>
                                        <p className="text-primary fw-bold">₹{material.price}</p>
                                        <p className="card-text"><small className="text-muted">Category: {material.category}</small></p>
                                    </div>
                                </Link>
                                <div className="card-footer bg-white d-flex justify-content-between">
                                    <button 
                                        className="btn btn-outline-danger btn-sm" 
                                        onClick={() => handleAddToWishlist(material._id)}
                                    >
                                        <FontAwesomeIcon icon={faHeart} />
                                    </button>
                                    <button 
                                        className="btn btn-primary btn-sm" 
                                        onClick={() => handleAddToCart(material._id)}
                                    >
                                        <FontAwesomeIcon icon={faShoppingCart} /> Add to Cart
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style jsx>{`
                .material-image {
                    height: 200px;
                    object-fit: cover;
                }
                .placeholder-image {
                    height: 200px;
                    background-color: #f0f0f0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #999;
                }
                .material-card {
                    transition: all 0.3s ease;
                    border: none;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                }
                .material-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 20px rgba(0,0,0,0.1);
                }
                .filter-panel {
                    border: none;
                    box-shadow: 0 2px 15px rgba(0,0,0,0.1);
                }
            `}</style>
        </div>
    );
};

export default Crafts;
