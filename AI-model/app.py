"""
MediSense AI — Main Application Entry Point
===========================================
Serves the modularized Flask API on port 5002.
Maintains 100% backward compatibility with Node.js and frontend services.
"""

from config.settings import PORT, HOST, DEBUG, UPLOAD_DIR
from src.api.app import app

# Export for WSGI servers (Gunicorn / Waitress / uWSGI)
application = app

if __name__ == "__main__":
    print(f"\n=======================================================")
    print(f"  MediSense AI v11.1 Service")
    print(f"  URL:           http://localhost:{PORT}")
    print(f"  Upload Folder: {UPLOAD_DIR}")
    print(f"  Endpoints:     /predict  /follow_up  /analyze-report  /health")
    print(f"=======================================================\n")
    app.run(host=HOST, port=PORT, debug=DEBUG)
