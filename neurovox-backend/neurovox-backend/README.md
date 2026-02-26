# 🧠 NeuroVox Backend
> **Transforming Silence Into Hope** — Express.js + Node.js backend for the NeuroVox application.

---

## ⚡ Quick Start

### 1. Prerequisites
- **Node.js** v18+
- **MongoDB** (local or Atlas)

### 2. Install & Run

```bash
# Install dependencies
npm install

# Copy and fill in environment variables
cp .env.example .env

# Start development server
npm run dev

# OR production
npm start
```

Server runs at: **http://localhost:5000**

---

## 🔧 Environment Variables (`.env`)

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/neurovox
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

FRONTEND_URL=http://localhost:3000
```

---

## 🗂️ Project Structure

```
neurovox-backend/
├── src/
│   ├── index.js              # Entry point (Express + Socket.io)
│   ├── config/
│   │   └── database.js       # MongoDB connection
│   ├── models/
│   │   ├── User.js           # User (patient/doctor/caregiver/technician)
│   │   ├── BrainSignal.js    # Brain signal readings
│   │   ├── EmergencyAlert.js # Emergency/SOS alerts
│   │   └── index.js          # MindLog, Appointment, TherapySession, HealthReport, etc.
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── brainController.js
│   │   ├── emergencyController.js
│   │   └── mainController.js
│   ├── middleware/
│   │   ├── auth.js           # JWT protect + role authorization
│   │   ├── errorHandler.js
│   │   └── upload.js         # Multer file uploads
│   └── routes/
│       └── index.js          # All API routes
├── uploads/                  # Uploaded files (auto-created)
├── .env.example
└── package.json
```

---

## 📡 API Reference

Base URL: `http://localhost:5000/api`

### 🔐 Authentication (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | ❌ | Register new user |
| POST | `/auth/login` | ❌ | Login & get token |
| GET | `/auth/me` | ✅ | Get current user |
| PUT | `/auth/update-profile` | ✅ | Update profile |
| PUT | `/auth/change-password` | ✅ | Change password |
| POST | `/auth/forgot-password` | ❌ | Request reset link |
| POST | `/auth/reset-password/:token` | ❌ | Reset password |
| DELETE | `/auth/delete-account` | ✅ | Deactivate account |

**Register body:**
```json
{
  "name": "Ramesh Kumar",
  "email": "ramesh@example.com",
  "password": "securePass123",
  "role": "patient",
  "phone": "+91-9876543210"
}
```
**Roles:** `patient`, `doctor`, `caregiver`, `technician`, `admin`

**Login response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1...",
  "user": { "name": "...", "role": "patient", ... }
}
```

> **All protected routes need:** `Authorization: Bearer <token>`

---

### 🧠 Brain Signals (`/api/brain`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/brain/signal` | Ingest signal from headband |
| GET | `/brain/history` | Get signal history |
| GET | `/brain/live` | Get latest signal (polling) |
| GET | `/brain/stats?days=7` | Get stats for dashboard |
| POST | `/brain/translate` | Convert text to speech |

**Ingest signal body (from headband device):**
```json
{
  "rawSignal": {
    "alpha": 9.5,
    "beta": 18.2,
    "theta": 5.1,
    "delta": 2.3,
    "gamma": 32.4
  },
  "sessionId": "optional-session-id",
  "deviceId": "NV-DEVICE-001"
}
```

**Response includes:** translated text, emotional state, confidence score, cognitive load.

> **Production:** Replace `simulateTranslation()` in `brainController.js` with your actual ML model / BCI SDK.

---

### 🚨 Emergency Alerts (`/api/emergency`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/emergency/sos` | Trigger SOS alert |
| GET | `/emergency/alerts` | Get alerts (role-aware) |
| GET | `/emergency/alerts/:id` | Get single alert |
| PUT | `/emergency/alerts/:id/acknowledge` | Acknowledge alert |
| PUT | `/emergency/alerts/:id/resolve` | Resolve alert |

**SOS body:**
```json
{
  "alertType": "sos",
  "severity": "critical",
  "message": "Patient needs immediate assistance",
  "location": { "latitude": 28.6139, "longitude": 77.2090, "address": "New Delhi" }
}
```

> Triggers real-time WebSocket event `emergency_alert` to all connected clients.
> **Production:** Add Twilio SMS integration to notify contacts by text/call.

---

### 📊 Live Dashboard (`/api/dashboard`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Get all dashboard stats |

Returns: total signal readings, active alerts, upcoming appointments, weekly stats, current brain state.

---

### 📝 Mind Log (`/api/mindlog`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/mindlog` | Create journal entry |
| GET | `/mindlog` | Get all entries |
| GET | `/mindlog/:id` | Get entry |
| PUT | `/mindlog/:id` | Update entry |
| DELETE | `/mindlog/:id` | Delete entry |

**Body:**
```json
{
  "title": "Good day today",
  "content": "Felt calm and focused, speech exercises went well.",
  "mood": "good",
  "tags": ["progress", "therapy"],
  "isPrivate": true
}
```
Auto-generates **sentiment analysis** (positive/neutral/negative).

---

### 🏥 Appointments (`/api/appointments`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/appointments/hospitals` | Search hospitals |
| POST | `/appointments` | Book appointment |
| GET | `/appointments` | Get appointments |
| PUT | `/appointments/:id` | Update appointment |
| PUT | `/appointments/:id/cancel` | Cancel appointment |

> **Production:** Replace mock hospitals with Google Places API.

---

### 🧑‍⚕️ Therapy Sessions (`/api/therapy`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/therapy` | Schedule session |
| GET | `/therapy` | Get sessions |
| PUT | `/therapy/:id` | Update session |

---

### 📄 Health Reports (`/api/reports`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/reports/generate` | Auto-generate report |
| GET | `/reports` | Get all reports |
| GET | `/reports/:id` | Get single report |

Auto-aggregates: brain wave averages, emotion breakdown, translation stats, emergency counts.

---

### 🔒 Doctor Portal (`/api/doctor`) — Doctor/Admin only

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/doctor/patients` | Get all assigned patients |
| GET | `/doctor/patients/:patientId` | Full patient profile + signals |
| POST | `/doctor/annotate` | Add annotation to signal |
| POST | `/doctor/assign` | Assign doctor to patient |

---

### 🛠️ Technician Support (`/api/technician`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/technician/ticket` | Create support ticket |
| GET | `/technician/tickets` | Get tickets (role-aware) |
| PUT | `/technician/tickets/:id` | Update ticket |

---

### 📚 Resources (`/api/resources`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/resources` | List resources (public) |
| GET | `/resources/:id` | View resource |
| POST | `/resources` | Create resource (doctor/admin) |

---

### 🤖 Chatbot (`/api/chatbot`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chatbot/message` | Send message, get AI response |

> **Production:** Replace the keyword matcher with Claude API / OpenAI for real conversational AI.

---

## 🔌 WebSocket Events (Socket.io)

Connect to `ws://localhost:5000`

| Event (emit) | Payload | Description |
|---|---|---|
| `join_room` | `userId` | Join personal notification room |
| `brain_signal_stream` | signal data | Stream live brain signals |
| `emergency` | alert data | Manually emit emergency |

| Event (listen) | Payload | Description |
|---|---|---|
| `emergency_alert` | `{ alert, user }` | Receive emergency notification |
| `brain_signal_update` | signal data | Receive brain signal updates |
| `alert_acknowledged` | `{ alertId, respondedBy }` | Alert was acknowledged |

---

## 🔗 Connecting to NeuroVox Frontend

In your frontend JavaScript, set the base URL and include the JWT token:

```javascript
const API_BASE = 'http://localhost:5000/api';

// After login, store the token
localStorage.setItem('nv_token', data.token);

// For all protected requests
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('nv_token')}`
};

// Example: Trigger SOS
fetch(`${API_BASE}/emergency/sos`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ alertType: 'sos' })
});

// Example: Socket.io connection
const socket = io('http://localhost:5000');
socket.on('emergency_alert', (data) => {
  alert(`🚨 Emergency: ${data.user.name} needs help!`);
});
```

---

## 🚀 Production Integrations (TODO)

| Feature | Recommended Service |
|---|---|
| SMS/Call Alerts | Twilio |
| Email | Nodemailer + Gmail / SendGrid |
| Real TTS | Google Cloud TTS / Amazon Polly |
| Brain Signal ML | Custom TensorFlow model / OpenBCI SDK |
| Hospital Search | Google Places API |
| AI Chatbot | Anthropic Claude / OpenAI GPT |
| PDF Generation | PDFKit (already installed) |
| Push Notifications | Firebase Cloud Messaging |

---

## 🌐 CORS Setup for Netlify Frontend

In `.env`:
```
FRONTEND_URL=https://neuro-vox.netlify.app
```

---

*Built with ❤️ for Team VIANRA — NeuroVox: Silence into Hope*
