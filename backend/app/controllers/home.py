from flask import Blueprint, render_template

home_bp = Blueprint('home', __name__)

@home_bp.route('/')
def home():
    return render_template('home.html')

@home_bp.route('/about')
def about():
    return "<h1>About</h1>"
