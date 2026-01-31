# Bio.VAN - Testing & Execution Guide

Follow this guide to run the complete Bio.VAN system (Frontend + Backend + Databases) on your local Windows machine.

## Prerequisites

- **Docker Desktop** installed and running.
- **Node.js** (v18 or higher) installed.
- **Python** (v3.10 or higher) installed.

---

## Step 1: Start Infrastructure (Databases)

We use Docker to run Milvus (Vector DB) and PostgreSQL (User DB).

1. Open a terminal (PowerShell) in the project root.
2. Navigate to the backend folder:

   ```powershell
   cd N:\PGM\Bio.VAN\backend
   ```

3. Start the containers:

   ```powershell
   docker-compose up -d
   ```

   *Wait for all containers (milvus, postgres, etcd, minio) to show "Running".*

---

## Step 2: Start the Backend API

1. Open a **new** terminal window.
2. Navigate to the backend:

   ```powershell
   cd N:\PGM\Bio.VAN\backend
   ```

3. Create and activate a virtual environment (if not already done):

   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate
   ```

4. Install dependencies:

   ```powershell
   pip install -r requirements.txt
   ```

5. Initialize the database:
   *(Note: The app usually initializes tables on startup, but ensuring dependencies are installed is key)*
6. Create an Admin User (Required for Dashboard access):

   ```powershell
   python -m scripts.create_admin --email admin@biovan.com --password securepass123
   ```

7. Start the API server:

   ```powershell
   uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
   ```

   *You should see "Application startup complete".*

---

## Step 3: Start the Holographic Frontend

1. Open a **third** terminal window.
2. Navigate to the frontend:

   ```powershell
   cd N:\PGM\Bio.VAN\frontend
   ```

3. Install dependencies:

   ```powershell
   npm install
   ```

4. Start the development server:

   ```powershell
   npm run dev
   ```

5. Open your browser and go to: `http://localhost:5173`

---

## Step 4: Testing & Usage Scenarios

Now that everything is running, try these flows:

### Scenario A: New User Enrollment

1. On the Home Page, click **"INITIALIZE ENROLLMENT"**.
2. Enter a Name and Email (e.g., "John Doe", "<john@example.com>").
3. Select "PERSONNEL" role.
4. **Voice Calibration**:
   - The system will ask you to read 3 different text prompts.
   - Click the **Microphone** icon to record.
   - Read the text actively.
   - Click stop when done.
   - Proceed to the next sample.
5. After 3 samples, clicks **"COMPLETE REGISTRATION"**.
   - *Result*: You should see a "SUCCESS" card.

### Scenario B: Voice Verification

1. Go back to Home and click **"VOICE VERIFICATION"**.
2. Click the microphone to start the secure handshake.
3. Speak naturally (e.g., "This is John Doe requesting access").
4. **Observe the Terminal**:
   - It will show "ANALYZING SPECTRAL DATA..."
   - It will show a "MATCH SCORE".
   - *Result*: Application should grant access if it's you, or deny access if the score is low.

### Scenario C: Admin Dashboard

1. Go to `http://localhost:5173/admin`.
2. Login with the credentials you created in Step 2:
   - Email: `admin@biovan.com`
   - Password: `securepass123`
3. View the list of registered users and their voice profile status.

---

## Troubleshooting

- **"Connection Refused"**: Ensure the Backend terminal is running (Step 2).
- **"Database Error"**: Ensure Docker is running (Step 1).
- **"Microphone Not Working"**: Check your browser permissions and ensure you are using `localhost` or `https`.
