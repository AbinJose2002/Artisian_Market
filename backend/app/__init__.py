from flask import Flask
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from pymongo import MongoClient
from pathlib import Path
import os

# Initialize extensions
bcrypt = Bcrypt()
jwt = JWTManager()

# MongoDB connection
MONGO_URI = "mongodb+srv://abinjos307:abinjos307@cluster0.cg0bf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(MONGO_URI)
db = client.get_database("artisian_market_database")  
users_collection = db.get_collection("users") 
instructor_collection = db.get_collection("instructor") 
events_collection = db.get_collection("events") 
seller_collection = db.get_collection("seller") 
product_collection = db.get_collection("product") 
orders_collection = db.get_collection("orders")
admin_collection = db.get_collection("admin")
bids_collection = db.get_collection("bids")  # Add bids collection

def create_app():
    # Configure static file serving
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    app = Flask(__name__, 
                static_url_path='/uploads', 
                static_folder=os.path.join(base_dir, 'uploads'))

    # Enable CORS
    CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})
    
    # Create upload directories
    upload_dirs = {
        'event_posters': os.path.join(base_dir, 'uploads', 'event_posters'),
        'product_images': os.path.join(base_dir, 'uploads', 'product_images'),
        'profile_photos': os.path.join(base_dir, 'uploads', 'profile_photos')
    }
    
    app.config['UPLOAD_FOLDERS'] = upload_dirs
    
    # Create directories and print paths
    for name, path in upload_dirs.items():
        os.makedirs(path, exist_ok=True)
        print(f"Created {name} directory at: {path}")

    # JWT Configuration
    app.config['JWT_SECRET_KEY'] = '12345'  # Change this to a secure key
    jwt.init_app(app)  # ✅ Corrected duplicate initialization

    # Initialize extensions
    bcrypt.init_app(app)

    # ✅ Configure Upload Folder
    UPLOAD_FOLDER = Path("uploads") / "product_images"
    UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)
    app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER.as_posix()

    # Register Blueprints (routers)
    from app.controllers.home import home_bp
    from app.controllers.user import user_bp
    from app.controllers.instructor import instructor_bp
    from app.controllers.seller import seller_bp  # Make sure this import exists
    from app.controllers.product import product_bp
    from app.controllers.payment import payment_bp
    from app.controllers.order import order_bp
    from app.controllers.admin import admin_bp
    from app.controllers.bids import bids_bp
    from app.controllers.reviews import reviews_bp
    
    app.register_blueprint(home_bp)
    app.register_blueprint(user_bp, url_prefix='/user')
    app.register_blueprint(seller_bp, url_prefix='/seller')  # Make sure this line exists
    app.register_blueprint(instructor_bp, url_prefix='/instructor')
    app.register_blueprint(admin_bp, url_prefix='/admin')
    app.register_blueprint(product_bp, url_prefix='/product')
    app.register_blueprint(bids_bp, url_prefix='/bids')
    app.register_blueprint(payment_bp, url_prefix='/payment')
    app.register_blueprint(order_bp, url_prefix='/order')
    app.register_blueprint(reviews_bp, url_prefix='/reviews')
    
    # Update CORS configuration to be more permissive during development
    CORS(app, resources={
        r"/*": {
            "origins": ["http://localhost:5173"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
            "allow_headers": ["Content-Type", "Authorization", "Accept"],
            "supports_credentials": True
        }
    })

    return app
