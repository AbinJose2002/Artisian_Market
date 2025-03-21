from flask import Flask
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from pymongo import MongoClient
from pathlib import Path

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

def create_app():
    app = Flask(__name__)

    # Enable CORS
    CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})
    


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
    from app.controllers.seller import seller_bp
    from app.controllers.product import product_bp
    

    app.register_blueprint(home_bp)
    app.register_blueprint(user_bp, url_prefix='/user')
    app.register_blueprint(instructor_bp, url_prefix='/instructor')
    app.register_blueprint(seller_bp, url_prefix='/seller')
    app.register_blueprint(product_bp, url_prefix='/product')

    return app
