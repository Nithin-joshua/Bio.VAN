# Bio.V - Secure Biometric Voice Authentication Protocol

![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)

Bio.V is a next-generation decentralized voice authentication system leveraging spectral analysis and neural mesh networks to map unique vocal identifiers. Designed with a Cyberpunk aesthetic, it provides secure, privacy-focused identity verification.

## 🚀 Key Features

* **Voice Enrollment Wizard**: Multi-step process to capture high-quality voice samples.
* **Anti-Spoofing / Liveness Detection**: Spectral analysis to detect and reject synthetic or recorded voice attacks.
* **Secure ID Generation**: Generates a unique 10-character alphanumeric ID for each user.
* **Real-time Verification**: Instant voice matching using ECAPA-TDNN embeddings.
* **Challenge-Response ASR**: Offline Vosk model verifies dynamic security passphrases without any cloud dependency.
* **Immersive UI**: "Cyberpunk" interface with glassmorphism, neon effects, and a **Lore Terminal** that simulates system boot sequences and live metrics.
* **Smooth Animations**: Page transitions, logo animations, and real-time voice activity visualization using `framer-motion`.
* **Voice Activity Ring**: Dynamic visual feedback during recording with color-shifting rings that respond to audio amplitude.
* **Vector Database**: Uses **Milvus** for high-speed similarity search of voice embeddings.
* **Admin Dashboard**: Monitor system health, user registry, and network traffic.
* **Responsive Design**: Fully optimized for Desktop, Tablet, and Mobile.

## 🛠️ Tech Stack

* **Frontend**: React (Vite), CSS3 (Variables, Animations), Canvas API (Waveforms), Framer Motion (Animations).
* **Backend**: Python (FastAPI), SpeechBrain (Speaker Embeddings), Vosk (Offline ASR for passphrase).
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

## ☁️ Deployment

For production or server-based hosting, the recommended approach is using **Docker Compose**:

1. **Configure Environment**: Ensure `.env` files (if any) are set for production values.
2. **Build & Run**:

   ```bash
   docker-compose up -d --build
   ```

3. **Access**:
   * Frontend: Port `5173` (or configured reverse proxy port)
   * API: Port `8000`
   * Milvus: Port `19530`

Ensure your host firewall allows traffic on these ports if accessing remotely.

## 🖥️ System Access

| Component | URL | Description |
| ----------- | ----- | ------------- |
| **Bio.V UI** | `http://localhost:5173` | Main User Interface |
| **API Docs** | `http://localhost:8000/docs` | Swagger UI for Backend API |
| **Attu (Milvus)** | `http://localhost:8001` | Visual Manager for Vector DB |

## 📂 Project Structure

* `/frontend`: React application source code.
* `/backend`: FastAPI application and backend ML integration.
* `/engine`: Core ML engine and pre-trained SpeechBrain models (ECAPA, RawNet2).
* `/docker-compose.yml`: Infrastructure configuration.

## 🧪 Testing

The project includes a comprehensive test suite for both backend and frontend.

### Backend Tests (Pytest)

```bash
cd backend
..\myenv\Scripts\activate
pytest  # Run all tests
```

### Frontend Tests (Vitest)

```bash
cd frontend
npm test
```

For detailed testing procedures and reports, see **[`PROJECT_REPORT.md`](PROJECT_REPORT.md)**.

## 📜 Recent Updates

* **RawNet2 Anti-Spoofing**: Integrated advanced neural network (RawNet2) to detect synthetic and recorded audio attacks.
* **Biometric Deduplication**: Prevents duplicate identities by scanning vector database for existing voiceprints before enrollment.
* **Periodic Re-enrollment**: Enforces voice profile refresh every 90 days to account for aging and maintain accuracy.
* **Adaptive Authentication**: Dynamically adjusts acceptance thresholds based on liveness confidence scores.
* **ID Generation**: Implemented 10-digit secure alphanumeric ID system.
* **Lore Terminal**: Replaced static lore text with a dynamic, animated terminal component.
* **Tablet Support**: Improved layout for verification page on tablet devices.
* **Attu Integration**: Added Attu service for easier vector database management.
* **Vosk Offline ASR**: Replaced fragile cloud-style ASR with a local Vosk model dedicated to challenge phrase verification.
* **Challenge Error Semantics**: Frontend now surfaces `DURATION_TOO_SHORT` and `CHALLENGE_FAILED` as distinct, user-friendly messages.
* **Milvus Stability**: Added retry logic and improved error handling around Milvus vector search to avoid transient failures.
