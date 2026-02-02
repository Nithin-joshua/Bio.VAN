# Bio.VAN - Secure Biometric Voice Authentication Protocol

![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)

Bio.VAN is a next-generation decentralized voice authentication system leveraging spectral analysis and neural mesh networks to map unique vocal identifiers. Designed with a Cyberpunk aesthetic, it provides secure, privacy-focused identity verification.

## 🚀 Key Features

* **Voice Enrollment Wizard**: Multi-step process to capture high-quality voice samples.
* **Anti-Spoofing / Liveness Detection**: Spectral analysis to detect and reject synthetic or recorded voice attacks.
* **Secure ID Generation**: Generates a unique 10-character alphanumeric ID for each user.
* **Real-time Verification**: Instant voice matching using ECAPA-TDNN embeddings.
* **Immersive UI**: "Cyberpunk" interface with glassmorphism, neon effects, and a **Lore Terminal** that simulates system boot sequences and live metrics.
* **Vector Database**: Uses **Milvus** for high-speed similarity search of voice embeddings.
* **Admin Dashboard**: Monitor system health, user registry, and network traffic.
* **Responsive Design**: Fully optimized for Desktop, Tablet, and Mobile.

## 🛠️ Tech Stack

* **Frontend**: React (Vite), CSS3 (Variables, Animations), Canvas API (Waveforms).
* **Backend**: Python (FastAPI), SpeechBrain (Audio Processing).
* **Database**:
  * **PostgreSQL**: Metadata storage.
  * **Milvus**: Vector embedding storage.
* **DevOps**: Docker, Docker Compose.
* **Tools**: Attu (Milvus GUI).

## ⚡ Quick Start

### Prerequisites

* Docker & Docker Compose
* Node.js (v18+)
* Python (3.9+)

### 1. Start Infrastructure

Launch the database services (Milvus, PostgreSQL, Attu):

```bash
docker-compose up -d
```

### 2. Start Backend

Navigate to the backend directory and run the server:

```bash
cd backend
# Activate virtual environment
..\myenv\Scripts\activate  # Windows
# source ../myenv/bin/activate # Linux/Mac

# Install dependencies (if first time)
pip install -r requirements.txt

# Run Server
uvicorn api.main:app --reload
```

*API will be available at <http://localhost:8000>*

### 3. Start Frontend

Navigate to the frontend directory and start the dev server:

```bash
cd frontend
npm install  # If first time
npm run dev
```

*UI will be available at <http://localhost:5173>*

## 🖥️ System Access

| Component | URL | Description |
|-----------|-----|-------------|
| **Bio.VAN UI** | `http://localhost:5173` | Main User Interface |
| **API Docs** | `http://localhost:8000/docs` | Swagger UI for Backend API |
| **Attu (Milvus)** | `http://localhost:8001` | Visual Manager for Vector DB |

## 📂 Project Structure

* `/frontend`: React application source code.
* `/backend`: FastAPI application and ML logic.
* `/models`: Pre-trained SpeechBrain models.
* `/docker-compose.yml`: Infrastructure configuration.

## 📜 Recent Updates

* **Anti-Spoofing**: Integrated spectral analysis for liveness detection.
* **ID Generation**: Implemented 10-digit secure alphanumeric ID system.
* **Lore Terminal**: Replaced static lore text with a dynamic, animated terminal component.
* **Tablet Support**: Improved layout for verification page on tablet devices.
* **Attu Integration**: Added Attu service for easier vector database management.
