# Centralized Disaster Management & Relief Coordination System

A full-stack web application that helps authorities and citizens prepare for disasters in advance and manage recovery after disasters. The system provides real-time disaster risk alerts, preventive guidelines, and post-disaster damage reporting with resource coordination support.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![React](https://img.shields.io/badge/react-19.2.0-blue.svg)
![MySQL](https://img.shields.io/badge/mysql-8.0-orange.svg)

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
- **Resource Release** — Deployed resources can be released back to available state

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, React Router DOM, Vite |
| Backend | Node.js, Express 4 |
| Database | MySQL 8 |
| Real-time | Socket.io 4 |
| Maps | Google Maps JavaScript API, @react-google-maps/api |
| Weather | OpenWeatherMap API |
| Auth | JWT (jsonwebtoken), bcryptjs |
| File Upload | Multer |
| HTTP Client | Axios |
| Dev Tools | Nodemon, ESLint |

---

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Frontend (React + Vite)             │
│   Login · Dashboard · Map · Report · Admin Panel    │
└────────────────────────┬────────────────────────────┘
                         │ HTTP / WebSocket
┌────────────────────────▼────────────────────────────┐
│              Backend (Node.js + Express)             │
│   Auth API · Incidents · Alerts · Resources · Admin  │
│              Socket.io (real-time events)            │
└──────────┬──────────────────────────┬───────────────┘
           │                          │
┌──────────▼──────────┐   ┌──────────▼──────────────┐
│   MySQL Database     │   │     External APIs        │
│  users · incidents   │   │  OpenWeatherMap          │
│  resources · alerts  │   │  Google Maps API         │
│  assignments · notif │   └─────────────────────────┘
└──────────────────────┘
```

---

## Database Schema

```sql
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
│   ├── .env
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
    ├── .env
    ├── .gitignore
    ├── netlify.toml
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

Open MySQL and run:
```sql
CREATE DATABASE IF NOT EXISTS disaster_mgmt;
USE disaster_mgmt;
```

Then run the full schema from `backend/schema.sql` or copy the CREATE TABLE statements from the Database Schema section above.

**2. Seed initial resources**
```sql
USE disaster_mgmt;

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

Register via the app, then run:
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
| GET | `/` | Yes | Any | Get all incidents (filterable) |
| GET | `/my` | Yes | Any | Get current user's incidents |
| GET | `/:id` | Yes | Any | Get single incident |
| POST | `/` | Yes | Any | Create incident (multipart/form-data) |
| PUT | `/:id/status` | Yes | Admin | Update incident status |

### Alert Routes — `/api/alerts`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/weather?lat=&lng=` | Yes | Any | Get weather alert for location |
| GET | `/forecast?lat=&lng=` | Yes | Any | Get 5-day forecast |
| GET | `/` | Yes | Any | Get all active alerts from DB |
| POST | `/` | Yes | Admin | Create manual alert |
| DELETE | `/:id` | Yes | Admin | Delete an alert |

### Resource Routes — `/api/resources`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/` | Yes | Any | Get all resources |
| POST | `/` | Yes | Admin | Create a resource |
| PUT | `/:id` | Yes | Admin | Update a resource |
| DELETE | `/:id` | Yes | Admin | Delete a resource |
| POST | `/assign` | Yes | Admin | Assign resource to incident |
| POST | `/release/:id` | Yes | Admin | Release by assignment ID |
| POST | `/release-by-resource/:id` | Yes | Admin | Release by resource ID |
| GET | `/assignments/:incident_id` | Yes | Any | Get assignments for incident |

### Admin Routes — `/api/admin`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/stats` | Yes | Admin | Get dashboard statistics |
| GET | `/incidents` | Yes | Admin | Get all incidents with reporter details |
| GET | `/users` | Yes | Admin | Get all users |
| PUT | `/users/:id/role` | Yes | Admin | Update user role |

---

## Pages & Features

### Citizen Pages

| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | JWT-based login with role redirect |
| Register | `/register` | Create citizen account |
| Dashboard | `/dashboard` | View own reported incidents with status badges |
| Report Incident | `/report` | Report disaster with GPS, photo, type, severity |
| Map View | `/map` | Interactive map with all incidents, filters, heatmap |
| Alerts | `/alerts` | Current weather, 5-day forecast, active alerts |

### Admin Pages

| Page | Route | Description |
|------|-------|-------------|
| Admin Panel | `/admin` | Full control center with 5 tabs |
| Overview | `/admin` → Overview | Stats cards + recent incidents |
| Incidents | `/admin` → Incidents | Manage status, assign/release resources |
| Resources | `/admin` → Resources | Add, delete, release deployed resources |
| Alerts | `/admin` → Alerts | Create/delete manual alerts |
| Users | `/admin` → Users | View all users, change roles |

### Real-time Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `new_incident` | Server → Client | New incident reported |
| `incident_updated` | Server → Client | Incident status changed |
| `new_alert` | Server → Client | New alert broadcasted |
| `alert_deleted` | Server → Client | Alert removed |
| `resource_assigned` | Server → Client | Resource assigned to incident |
| `resource_released` | Server → Client | Resource released back to available |
| `users_online` | Server → Client | Live online user count |

---

## Deployment

This project is deployed using three free services:

| Service | Purpose | URL |
|---------|---------|-----|
| db4free.net | MySQL Database | db4free.net |
| Render | Backend (Node.js) | render.com |
| Netlify | Frontend (React) | netlify.com |

### Environment Variables for Production

**Render (Backend):**
```env
PORT=5000
DB_HOST=db4free.net
DB_USER=your_db4free_username
DB_PASSWORD=your_db4free_password
DB_NAME=disaster_mgmt
DB_PORT=3306
JWT_SECRET=your_production_jwt_secret
OPENWEATHER_API_KEY=your_key
CLIENT_URL=https://your-app.netlify.app
NODE_ENV=production
```

**Netlify (Frontend):**
```env
VITE_API_URL=https://your-backend.onrender.com/api
VITE_SOCKET_URL=https://your-backend.onrender.com
VITE_BACKEND_URL=https://your-backend.onrender.com
VITE_GOOGLE_MAPS_KEY=your_key
```

### Netlify Build Settings

| Field | Value |
|-------|-------|
| Base directory | `frontend` |
| Build command | `npm run build` |
| Publish directory | `frontend/dist` |

### Render Build Settings

| Field | Value |
|-------|-------|
| Root Directory | `backend` |
| Build Command | `npm install` |
| Start Command | `npm start` |

---

## Contributing

1. Fork the repository
2. Create your feature branch — `git checkout -b feature/AmazingFeature`
3. Commit your changes — `git commit -m 'feat: add some amazing feature'`
4. Push to the branch — `git push origin feature/AmazingFeature`
5. Open a Pull Request

### Commit Message Convention

This project follows conventional commits:

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

- [OpenWeatherMap](https://openweathermap.org/) for weather data
- [Google Maps Platform](https://developers.google.com/maps) for mapping
- [Socket.io](https://socket.io/) for real-time communication
- [Render](https://render.com/) for backend hosting
- [Netlify](https://netlify.com/) for frontend hosting
- [db4free.net](https://db4free.net/) for free MySQL hosting

---

> Built as a college project demonstrating full-stack development with real-time features, map integration, and role-based access control.