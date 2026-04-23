![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![WorkOS](https://img.shields.io/badge/WorkOS-000000?style=for-the-badge&logo=workos&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Google Maps API](https://img.shields.io/badge/Google_Maps_API-4285F4?style=for-the-badge&logo=googlemaps&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)

# PortaLocator

A crowdsourced, community-verified map of porta potty locations built on the Google Maps JavaScript API.

## 📚 Table of Contents
- [Features](#-features)
- [Installation](#%EF%B8%8F-installation)
- [Quick Start](#-quick-start)
- [Routes](#-routes)
- [Database Structure](#%EF%B8%8F-database-structure)
- [API Endpoints](#-api-endpoints)
- [Future Development](#-future-development)

## 🌟 Features
- 📍 **Submit locations** — Users can place a marker anywhere on the Google Maps-powered interface to report a porta potty

- ✅ **Community verification** — Other users can upvote or flag submissions to confirm accuracy

- 🌍 **Global coverage** — No boundaries; if it exists somewhere in the world, it can be mapped

- 🗺️ **Live map** — Browse verified and pending locations in real time 

## 🛠️ Installation
1. Install <a href="https://www.apachefriends.org/download.html">XAMPP</a>

2. Clone the repository into XAMPP's htdocs folder:
```bash
cd C:\xampp\htdocs
git clone https://github.com/yourusername/yourrepository.git
cd yourrepository
```

3. Install dependencies
```bash
npm install
```

4. Set up environment variables — create a `.env` file in your project root:
```plaintext
DB_HOST=your_host
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=your_db_name
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
WORKOS_API_KEY=your_workos_api_key
WORKOS_CLIENT_ID=your_workos_client_id
SESSION_SECRET=your_session_secret
```

5. Generate a strong session secret:
```bash
npm run gen:session
```

> 💡 Copy the output and set it as `SESSION_SECRET=<generated_value>` in your `.env` file.

6. Turn on XAMPP's MySQL and initialize the database:
```bash
npm run db:init
```

## 🚀 Quick Start
1. Start Apache and MySQL in the XAMPP control panel

2. Start the backend server:
```bash
npm start
```
3. Open your browser and navigate to `http://127.0.0.1:3000/` to access the landing page

## 🔀 Routes
### 💻 Pages
| Method | Route | Description | Auth Required |
|--------|-------|-------------|---------------|
| GET | / | Landing page | No |
| GET | /app | Main map application | Yes |

### 🛡️ Auth (WorkOS AuthKit)
| Method | Route | Description |
|--------|-------|-------------|
| GET | /auth | Redirects to WorkOS login |
| GET | /callback | WorkOS OAuth callback, creates session |
| Get | /logout | Destroys session, redirects to WorkOS logout |

## 🗃️ Database Structure
PortaLocator uses a MySQL database with the following tables:
- `users`: Stores WorkOS user information (id) and other metadata (createdAt, theme)
- `porta_potties`: Stores porta potty information (id, name, latitude, longitude, description, rating, isPrivate, isAccessible, hasWomensProducts, createdBy, createdAt)
- `votes`: Stores user votes on porta potties (id, voteType, portaPottyId, createdBy, createdAt)

## 🌐 API Endpoints
### 🗺️ Google Maps
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/config/maps-key | Fetch Google Maps API key |

### 👤 User
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/me | Get current authenticated user |

### 🚽 Porta Potties
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/porta-potties | Fetch all porta potties |
| GET | /api/porta-potties/count | Get total count of user porta potties |
| GET | /api/porta-potties/:id | Fetch a single porta potty by ID |
| POST | /api/porta-potties | Create a new porta potty |
| PUT | /api/porta-potties/:id | Update a porta potty |
| DELETE | /api/porta-potties/:id | Delete a porta potty |

### 🗳️ Votes
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/votes/count | Get total upvotes for a specific user |
| GET | /api/votes/:portaPottyId | Fetch votes for a specific porta potty |
| POST | /api/votes | Create a new vote |
| PUT | /api/votes/:id | Update a vote |
| DELETE | /api/votes/:id | Delete a vote |

### 🎨 Theme
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/user/theme | Fetch user theme |
| PUT | /api/user/theme | Update user theme |

## ⌛ Future Development
- Upload photos of porta potties (Firebase)
- User comments on porta potty objects
- Moveable markers for easier editing
- Strava route integration to show porta potties along routes