# 🚽 PortaLocator

A crowdsourced, community-verified map of porta potty locations built on the Google Maps JavaScript API.

## 📚 Table of Contents
- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Database Structure](#database-structure)
<!-- - [API Endpoints](#api-endpoints)
- [Future Development](#future-development) -->

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

4. Set up environment variables in a `.env` file for Python backend:
```plaintext
DB_HOST=your_host
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=your_db_name
DB_PORT=your_port
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

5. Turn on XAMPP's MySQL and initialize the database:
```bash
mysql -u root -p your_db_name < createTables.sql
```

## 🚀 Quick Start
1. Start Apache and MySQL in the XAMPP control panel

2. Start the backend server:
```bash
node server.js
```

## 🗃️ Database Structure
PortaLocator uses a MySQL database with the following tables:
- `users`: Stores user information (id, username, password hash, fname, lname)
- `porta_potties`: Stores porta potty information (id, name, latitude, longitude, description, rating, isPrivate, isAccessible, hasWomensProducts, createdBy, createdAt)
- `votes`: Stores user votes on porta potties (id, voteType, createdAt, userId, portaPottyId)

<!-- ## API Endpoints

## Future Development -->