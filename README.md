# Nirogya

Nirogya is a healthcare web application with a React frontend, an Express API, and a Python-based AI service. The API handles application data and connects the frontend to the AI service for symptom and lab-report analysis.

## Features

- Browse healthcare providers and hospitals, and manage appointments.
- Access lab tests, blood bank, ambulance, medical records, and notifications.
- Get AI-assisted symptom predictions and lab-report analysis.
- Receive real-time ambulance updates through Socket.IO.

## Architecture

| Component | Stack | Default address | Purpose |
| --- | --- | --- | --- |
| Frontend | React, Vite | `http://localhost:5173` | Web application |
| Backend | Node.js, Express, MongoDB, Socket.IO | `http://localhost:5000` | REST API, persistence, and real-time events |
| AI service | Python, Flask | `http://localhost:5002` | Symptom and lab-report analysis |

The browser calls the backend at `/api`; the backend forwards AI requests to the Python service.

## Prerequisites

- Node.js and npm
- Python 3.10 or later and pip
- MongoDB (local or hosted)
- Tesseract OCR for image-based lab-report extraction (optional; PDF and OCR support depends on installed system tools)

## Setup

Run each component from its own directory.

### 1. Configure and start the backend

Create `backend/.env` with at least:

```env
MONGO_URI=mongodb://localhost:27017/nirogya
JWT_SECRET=replace-with-a-long-random-secret
PORT=5000
FRONTEND_URL=http://localhost:5173
PYTHON_AI_URL=http://localhost:5002
```

Start MongoDB, then run:

```powershell
cd backend
npm install
npm run dev
```

The backend requires `MONGO_URI` and `JWT_SECRET`. For production, configure the services your deployment uses, such as Cloudinary (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) and email (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`). Keep secrets out of source control.

### 2. Install and start the AI service

```powershell
cd AI-model
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python app.py
```

The service listens on port `5002` by default. Set `PORT` or `HOST` in the environment to change its binding. To configure OCR when Tesseract is not on `PATH`, set `TESSERACT_CMD` to the full path of the Tesseract executable. `ANTHROPIC_API_KEY` is optional.

### 3. Start the frontend

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL printed in the terminal. The frontend defaults to the local backend and ambulance socket. To override them, create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000/ambulance
```

Start all three services in separate terminals. The backend must be able to reach both MongoDB and the AI service; the browser must be able to reach the backend.

## Tests and production build

Run the AI service tests:

```powershell
cd AI-model
python tests/runner.py
```

Build the frontend:

```powershell
cd frontend
npm run build
```

The backend package does not currently define an automated test suite.

## Main API routes

The Express API is served under `/api`. Route groups include:

`/auth`, `/users`, `/doctors`, `/bookings`, `/admin`, `/hospitals`, `/lab-tests`, `/bloodbanks`, `/ambulances`, `/records`, `/reviews`, `/notifications`, `/providers`, and `/ai`.

The AI service exposes `POST /predict`, `POST /follow_up`, `POST /analyze-report`, `POST /normalize-input`, and `GET /health`. AI routes are also available through the backend under `/api/ai`.

## Repository layout

```text
backend/       Express API, database models, routes, and Socket.IO handlers
frontend/      React application and Vite configuration
AI-model/      Flask AI service, tests, configuration, and model resources
PROJECT_STRUCTURE.md
```

For AI service details, see [AI-model/README.md](AI-model/README.md). For the broader repository map, see [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md).

## Disclaimer

AI-generated health information is for informational and decision-support purposes only. It is not a diagnosis and does not replace advice from a qualified healthcare professional or emergency services. Seek urgent medical care for emergencies.
