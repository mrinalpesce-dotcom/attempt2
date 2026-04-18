# 🛡️ CyberShield — AI-Driven Threat Detection Platform

A full-stack cybersecurity command center with real-time threat detection, WebSocket-powered live monitoring, MITRE ATT&CK mapping, and AI-driven prevention engine.

## 📁 Project Structure

```
cyber-shield/
├── frontend/          # React + Vite frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Route pages (Dashboard, Alerts, etc.)
│   │   ├── context/       # Auth, Socket, Theme contexts
│   │   └── api.js         # API client
│   ├── public/
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/           # Node.js + Express + MongoDB backend
│   ├── config/            # Database config
│   ├── middleware/         # Auth middleware
│   ├── models/            # Mongoose models
│   ├── routes/            # API routes
│   ├── index.js           # Main server (REST + WebSocket)
│   └── package.json
│
└── sentinel-ai/       # Python AI Engine (optional)
    ├── detection_engine.py
    ├── prevention_engine.py
    └── main.py
```

## 🚀 Quick Start

### Backend
```bash
cd backend
npm install
# Set up .env (see .env.example)
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🌐 Deployment

- **Frontend**: Deployed on [Vercel](https://vercel.com)
- **Backend**: Deployed on [Render](https://render.com)

## ⚡ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Framer Motion, Recharts, Socket.io-client |
| Backend | Node.js, Express, MongoDB, Socket.io, JWT |
| AI Engine | Python, FastAPI (optional) |

## 🔐 Features

- Real-time threat dashboard with WebSocket
- Global attack map with live threat visualization
- MITRE ATT&CK framework mapping  
- Brute force simulation engine
- Prevention engine with DLP, encryption monitoring
- Automated playbook execution
- System metrics monitoring (CPU, Memory, Network)
- Role-based admin panel with audit logs
- Cybersecurity news feed (RSS)
