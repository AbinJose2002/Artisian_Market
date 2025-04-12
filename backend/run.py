from app import create_app
from app.controllers.user import user_bp

app = create_app()


if __name__ == '__main__':
    app.run(debug=True, port=8080)
