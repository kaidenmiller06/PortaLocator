# PortaLocator

A crowdsourced, community-verified map of porta potty locations built on the Google Maps JavaScript API.

## 📚 Table of Contents
- [Features](#-features)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Database Structure](#-database-structure)
- [Future Development](#-future-development)
<!-- - [API Endpoints](#-api-endpoints) -->

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

## 🗃️ Database Structure
PortaLocator uses a MySQL database with the following tables:
- `users`: Stores WorkOS user information (id, createdAt)
- `porta_potties`: Stores porta potty information (id, name, latitude, longitude, description, rating, isPrivate, isAccessible, hasWomensProducts, createdBy, createdAt)
- `votes`: Stores user votes on porta potties (id, voteType, portaPottyId, createdBy, createdAt)

<!-- ## API Endpoints -->

## ⌛ Future Development
- Signout button takes users to the WorkOS logout endpoint to properly end their session
- Moveable markers for easier editing
- Strava route integration to show porta potties along routes