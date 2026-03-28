# Centralized Disaster Management & Relief Coordination System

A full-stack web application that helps authorities and citizens prepare for disasters in advance and manage recovery after disasters. The system provides real-time disaster risk alerts, preventive guidelines, and post-disaster damage reporting with resource coordination support.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![React](https://img.shields.io/badge/react-19.2.0-blue.svg)
![MySQL](https://img.shields.io/badge/mysql-8.0-orange.svg)

---

## Live Demo

| Service | URL |
|---------|-----|
| Frontend | https://disaster-mgmt.netlify.app |
| Backend API | https://disaster-management-backend-85vf.onrender.com/api/health |

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Database Schema](#database-schema)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running Locally](#running-locally)
- [API Documentation](#api-documentation)
- [Pages & Features](#pages--features)
- [Real-time Events](#real-time-events)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Phase 1 (MVP)
- **User Authentication** — JWT-based login and registration with role-based access (Citizen / Admin)
- **Interactive Disaster Map** — Google Maps integration with incident markers, severity-based sizing, heatmap visualization, and real-time updates
- **Incident Reporting** — Citizens report disasters with title, description, type, severity, GPS location, and photo upload
- **Weather Alerts** — OpenWeatherMap API integration with automatic danger detection and 5-day forecast
- **Admin Control Center** — Full dashboard for managing incidents, resources, alerts, and users
- **Resource Management** — Track and assign ambulances, shelters, food supply, rescue teams, medical units, and fire brigades
- **Real-time Updates** — Socket.io powered live incident map, toast notifications, and online user counter

### Phase 2 (Implemented)
- **Socket.io Rooms** — User and admin rooms for targeted notifications
- **Live Status Bar** — Pulsing connection indicator with online user count
- **Global Toast System** — Slide-in notifications for all real-time events
- **Resource Release** — Deployed resources can be released back to available state directly from resource cards
- **Responsive UI** — Mobile-first design works on phone, tablet, and desktop

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, React Router DOM 7, Vite 6 |
| Backend | Node.js 22, Express 4.18 |
| Database | MySQL 8 (freesqldatabase.com) |
| Real-time | Socket.io 4 |
| Maps | Google Maps JavaScript API, @react-google-maps/api |
| Weather | OpenWeatherMap API |
| Auth | JWT (jsonwebtoken), bcryptjs |
| File Upload | Multer |
| HTTP Client | Axios |
| Dev Tools | Nodemon, ESLint |
| Deployment | Render (backend), Netlify (frontend), freesqldatabase (DB) |

---

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│            Frontend — React + Vite                   │
│   Login · Dashboard · Map · Report · Admin Panel    │
│              Deployed on Netlify                     │
└────────────────────────┬────────────────────────────┘
                         │ HTTP / WebSocket
┌────────────────────────▼────────────────────────────┐
│           Backend — Node.js + Express                │
│   Auth · Incidents · Alerts · Resources · Admin     │
│         Socket.io (real-time events)                 │
│              Deployed on Render                      │
└──────────┬──────────────────────────┬───────────────┘
           │                          │
┌──────────▼──────────┐   ┌──────────▼──────────────┐
│   MySQL Database     │   │     External APIs        │
│  freesqldatabase.com │   │  OpenWeatherMap          │
│  users · incidents   │   │  Google Maps API         │
│  resources · alerts  │   └─────────────────────────┘
│  assignments · notif │
└──────────────────────┘
```

---

## Database Schema

```
users                  incidents               resources
─────────────────      ─────────────────────   ─────────────────────
id (PK)                id (PK)                 id (PK)
name                   user_id (FK→users)      name
email (UNIQUE)         title                   type (ENUM)
password               description             quantity
role (ENUM)            type (ENUM)             status (ENUM)
phone                  severity (ENUM)         lat
lat                    status (ENUM)           lng
lng                    lat                     updated_at
created_at             lng
                       image_url
alerts                 created_at              resource_assignments
─────────────────                              ─────────────────────
id (PK)                notifications           id (PK)
title                  ─────────────────────   incident_id (FK)
message                id (PK)                 resource_id (FK)
severity (ENUM)        user_id (FK→users)      assigned_by (FK)
source                 title                   assigned_at
lat                    message                 released_at
lng                    type (ENUM)
radius_km              is_read
expires_at             created_at
created_at
```

---

## Project Structure

```
disaster-mgmt/
├── backend/
│   ├── config/
│   │   ├── db.js                 # MySQL connection pool
│   │   └── multer.js             # File upload configuration
│   ├── controllers/
│   │   ├── authController.js     # Register, login, getMe
│   │   ├── incidentController.js # CRUD + status update
│   │   ├── resourceController.js # Assign, release, manage
│   │   ├── alertController.js    # Weather + manual alerts
│   │   └── adminController.js    # Stats, users, incidents
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT verification
│   │   └── roleMiddleware.js     # Role-based access guard
│   ├── routes/
│   │   ├── auth.js
│   │   ├── incidents.js
│   │   ├── resources.js
│   │   ├── alerts.js
│   │   └── admin.js
│   ├── services/
│   │   └── weatherService.js     # OpenWeatherMap integration
│   ├── uploads/                  # Uploaded incident images
│   ├── .env                      # Local environment variables
│   ├── .gitignore
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── public/
    ├── src/
    │   ├── api/
    │   │   └── axios.js           # Axios instance + interceptors
    │   ├── components/
    │   │   ├── AlertBanner.jsx    # Severity-based alert banner
    │   │   ├── LiveStatusBar.jsx  # Socket connection indicator
    │   │   ├── ProtectedRoute.jsx # Auth + role route guards
    │   │   └── ToastContainer.jsx # Global toast notifications
    │   ├── context/
    │   │   ├── AuthContext.jsx    # User auth state
    │   │   └── SocketContext.jsx  # Socket.io connection
    │   ├── hooks/
    │   │   └── useWeatherAlerts.js # Weather data hook
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Dashboard.jsx      # Citizen dashboard
    │   │   ├── MapView.jsx        # Interactive Google Map
    │   │   ├── ReportIncident.jsx # Incident reporting form
    │   │   ├── AlertsPage.jsx     # Weather + active alerts
    │   │   └── AdminPanel.jsx     # Admin control center
    │   ├── styles/
    │   │   └── responsive.css     # Mobile-first responsive CSS
    │   ├── App.jsx
    │   └── main.jsx
    ├── .env                       # Local environment variables
    ├── .gitignore
    ├── netlify.toml               # Netlify build + redirect config
    └── package.json
```

---

## Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) v18 or higher
- [MySQL](https://www.mysql.com/) 8.0 or higher
- [Git](https://git-scm.com/)
- A [Google Maps API Key](https://console.cloud.google.com/)
- An [OpenWeatherMap API Key](https://openweathermap.org/api)

---

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/disaster-mgmt.git
cd disaster-mgmt
```

**2. Install backend dependencies**
```bash
cd backend
npm install
```

**3. Install frontend dependencies**
```bash
cd ../frontend
npm install
```

---

### Environment Variables

**Backend — create `backend/.env`:**
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=disaster_mgmt
DB_PORT=3306
JWT_SECRET=your_super_secret_jwt_key
OPENWEATHER_API_KEY=your_openweathermap_api_key
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

**Frontend — create `frontend/.env`:**
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_BACKEND_URL=http://localhost:5000
VITE_GOOGLE_MAPS_KEY=your_google_maps_api_key
```

---

### Running Locally

**1. Set up the database**

Open MySQL CMD and connect:
```bash
mysql -u root -p
```

Then create and use the database:
```sql
CREATE DATABASE IF NOT EXISTS disaster_mgmt;
USE disaster_mgmt;
```

Run all the CREATE TABLE statements from the Database Schema section above.

**2. Seed initial resources**
```sql
INSERT INTO resources (name, type, quantity, status) VALUES
('Ambulance Unit 1',    'ambulance',    2, 'available'),
('Ambulance Unit 2',    'ambulance',    1, 'available'),
('City Shelter A',      'shelter',    200, 'available'),
('Relief Camp B',       'shelter',    500, 'available'),
('Food Supply Truck 1', 'food',        50, 'available'),
('Food Supply Truck 2', 'food',        80, 'available'),
('Rescue Team Alpha',   'rescue_team',  8, 'available'),
('Medical Unit 1',      'medical',     15, 'available'),
('Fire Brigade Unit 1', 'fire_brigade', 3, 'available'),
('Fire Brigade Unit 2', 'fire_brigade', 5, 'available');
```

**3. Create your admin account**

Register via the app, then promote yourself to admin:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

**4. Start the backend**
```bash
cd backend
npm run dev
```

You should see:
```
Server running on http://localhost:5000
MySQL connected successfully
```

**5. Start the frontend** (new terminal)
```bash
cd frontend
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## API Documentation

### Auth Routes — `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | No | Register a new citizen |
| POST | `/login` | No | Login and receive JWT token |
| GET | `/me` | Yes | Get current user profile |

### Incident Routes — `/api/incidents`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/` | Yes | Any | Get all incidents (filterable by type, severity, status) |
| GET | `/my` | Yes | Any | Get current user's incidents |
| GET | `/:id` | Yes | Any | Get single incident |
| POST | `/` | Yes | Any | Create incident (multipart/form-data with image) |
| PUT | `/:id/status` | Yes | Admin | Update incident status |

### Alert Routes — `/api/alerts`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/weather?lat=&lng=` | Yes | Any | Get weather alert for coordinates |
| GET | `/forecast?lat=&lng=` | Yes | Any | Get 5-day forecast |
| GET | `/` | Yes | Any | Get all active alerts from DB |
| POST | `/` | Yes | Admin | Create and broadcast manual alert |
| DELETE | `/:id` | Yes | Admin | Delete an alert |

### Resource Routes — `/api/resources`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/` | Yes | Any | Get all resources with assignment count |
| POST | `/` | Yes | Admin | Create a new resource |
| PUT | `/:id` | Yes | Admin | Update a resource |
| DELETE | `/:id` | Yes | Admin | Delete a resource |
| POST | `/assign` | Yes | Admin | Assign resource to incident |
| POST | `/release/:id` | Yes | Admin | Release resource by assignment ID |
| POST | `/release-by-resource/:id` | Yes | Admin | Release resource directly by resource ID |
| GET | `/assignments/:incident_id` | Yes | Any | Get active assignments for an incident |

### Admin Routes — `/api/admin`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/stats` | Yes | Admin | Get dashboard statistics |
| GET | `/incidents` | Yes | Admin | Get all incidents with reporter details |
| GET | `/users` | Yes | Admin | Get all users with incident count |
| PUT | `/users/:id/role` | Yes | Admin | Update user role |

---

## Pages & Features

### Citizen Pages

| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | JWT-based login with role-based redirect |
| Register | `/register` | Create citizen account |
| Dashboard | `/dashboard` | View own reported incidents with status badges |
| Report Incident | `/report` | Report disaster with GPS, photo, type, severity |
| Map View | `/map` | Interactive map with all incidents, filters, heatmap |
| Alerts | `/alerts` | Current weather, 5-day forecast, active alerts list |

### Admin Pages

| Page | Route | Description |
|------|-------|-------------|
| Admin Panel | `/admin` | Full control center with 5 tabs |
| Overview tab | — | 8 stat cards + recent incidents table |
| Incidents tab | — | Manage status, assign and release resources |
| Resources tab | — | Add, delete, release deployed resources |
| Alerts tab | — | Create/broadcast/delete manual alerts |
| Users tab | — | View all users, change roles |

---

## Real-time Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `new_incident` | Server → All | New incident appears on map instantly |
| `incident_updated` | Server → All | Incident status updates live |
| `new_alert` | Server → All | Toast + banner shown to all users |
| `alert_deleted` | Server → All | Alert removed from list instantly |
| `resource_assigned` | Server → All | Resource status updates to deployed |
| `resource_released` | Server → All | Resource status updates to available |
| `users_online` | Server → All | Live online user count updates |

---

## Deployment

This project is deployed using three completely free services:

| Service | Purpose | Cost |
|---------|---------|------|
| freesqldatabase.com | MySQL Database | Free forever (5MB) |
| Render | Backend Node.js | Free tier |
| Netlify | Frontend React | Free forever |

### Step 1 — Database (freesqldatabase.com)

1. Sign up at `freesqldatabase.com`
2. Get credentials from your account dashboard
3. Login to phpMyAdmin and run the full schema SQL
4. **Important:** SSL must be disabled — freesqldatabase does not support SSL connections

### Step 2 — Backend (Render)

1. Connect GitHub repo at `render.com`
2. Set Root Directory to `backend`
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Add environment variables:

```env
PORT=5000
DB_HOST=sql12.freesqldatabase.com
DB_USER=your_db_username
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
DB_PORT=3306
JWT_SECRET=your_jwt_secret
OPENWEATHER_API_KEY=your_key
CLIENT_URL=https://your-app.netlify.app
NODE_ENV=production
```

### Step 3 — Frontend (Netlify)

1. Connect GitHub repo at `netlify.com`
2. Base directory: `frontend`
3. Build command: `npm run build`
4. Publish directory: `frontend/dist`
5. Add environment variables:

```env
VITE_API_URL=https://your-backend.onrender.com/api
VITE_SOCKET_URL=https://your-backend.onrender.com
VITE_BACKEND_URL=https://your-backend.onrender.com
VITE_GOOGLE_MAPS_KEY=your_google_maps_key
```

### Post-Deployment Steps

1. After getting Netlify URL, update `CLIENT_URL` on Render to match exactly
2. Add your Netlify URL to Google Maps API key HTTP referrer restrictions
3. Register on the live app and promote your account to admin via phpMyAdmin

### Important Notes

- Render free tier spins down after 15 minutes of inactivity — first request may take 30-60 seconds to wake up
- The `netlify.toml` file handles SPA routing — all routes redirect to `index.html`
- Image uploads are stored on Render's ephemeral filesystem — they reset on redeploy. For production use, integrate Cloudinary
- freesqldatabase does **not** support SSL — ensure `ssl: false` in `db.js`

---

## Known Limitations

- Render free tier cold start delay of 30-60 seconds after inactivity
- freesqldatabase free tier limited to 5MB storage (sufficient for demo/college use)
- Uploaded images reset on Render redeploy (ephemeral filesystem)
- Google Maps API key should be restricted to your domain in production

---

## Contributing

1. Fork the repository
2. Create your feature branch — `git checkout -b feature/AmazingFeature`
3. Commit your changes — `git commit -m 'feat: add some amazing feature'`
4. Push to the branch — `git push origin feature/AmazingFeature`
5. Open a Pull Request

### Commit Message Convention

| Prefix | Use for |
|--------|---------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `chore:` | Build/config changes |
| `docs:` | Documentation |
| `style:` | UI/CSS changes |
| `refactor:` | Code refactoring |

---

## License

This project is licensed under the MIT License.

---

## Acknowledgements

- [OpenWeatherMap](https://openweathermap.org/) for weather data API
- [Google Maps Platform](https://developers.google.com/maps) for mapping services
- [Socket.io](https://socket.io/) for real-time communication
- [Render](https://render.com/) for backend hosting
- [Netlify](https://netlify.com/) for frontend hosting
- [freesqldatabase.com](https://freesqldatabase.com/) for free MySQL hosting

---

> Built with ❤️ demonstrating full-stack development with real-time features,
> map integration, weather API, and role-based access control.