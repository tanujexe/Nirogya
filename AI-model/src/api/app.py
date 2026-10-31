"""
MediSense AI — Application Factory
==================================
Initializes Flask, enables CORS, registers blueprints, and sets limits.
"""

from flask import Flask
from flask_cors import CORS

from config.settings import BASE_DIR, MAX_CONTENT_LENGTH
from src.api.routes.prediction_routes import prediction_bp
from src.api.routes.report_routes import report_bp
from src.api.routes.system_routes import system_bp


def create_app() -> Flask:
    """Create and configure the MediSense AI Flask application."""
    app = Flask(
        __name__,
        template_folder=str(BASE_DIR / "templates"),
    )
    CORS(app)
    app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH

    # Register modular blueprints
    app.register_blueprint(system_bp)
    app.register_blueprint(prediction_bp)
    app.register_blueprint(report_bp)

    return app


app = create_app()

if __name__ == "__main__":
    from config.settings import PORT, HOST, DEBUG
    print(f"\nMediSense AI v11.1 -> http://localhost:{PORT}")
    print("   Endpoints: /predict  /follow_up  /analyze-report  /health\n")
    app.run(host=HOST, port=PORT, debug=DEBUG)
