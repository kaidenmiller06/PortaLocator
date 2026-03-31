// -----------------------------------------------------
// Server setup
// -----------------------------------------------------

const express = require('express');
const mysql = require('mysql2');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to database');
});


// -----------------------------------------------------
// API Endpoints
// -----------------------------------------------------

// Runtime config for browser-safe values.
app.get('/api/config/maps-key', (req, res) => {
  const mapsApiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!mapsApiKey) {
    return res.status(500).json({
      error: 'Missing GOOGLE_MAPS_API_KEY environment variable'
    });
  }

  res.json({ key: mapsApiKey });
});

// Fetch porta potties
app.get('/api/porta-potties', (req, res) => {
  db.query('SELECT * FROM porta_potties', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Create porta potty
app.post('/api/porta-potties', (req, res) => {
  const { name, latitude, longitude, description, rating, isPrivate, isAccessible, hasWomensProducts, createdBy, createdAt } = req.body;

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return res.status(400).json({ error: 'Invalid coordinates' });
  }

  db.query(
    'INSERT INTO porta_potties (name, latitude, longitude, description, rating, isPrivate, isAccessible, hasWomensProducts, createdBy, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [name, latitude, longitude, description, rating, isPrivate, isAccessible, hasWomensProducts, createdBy, createdAt],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ 
        id: result.insertId,
        name,
        latitude,
        longitude,
        description,
        rating,
        isPrivate,
        isAccessible,
        hasWomensProducts,
        createdBy,
        createdAt
      });
    }
  );
});

// Edit porta potty
app.put('/api/porta-potties/:id', (req, res) => {
  const { id } = req.params;
  const { name, latitude, longitude, description, rating, isPrivate, isAccessible, hasWomensProducts } = req.body;

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return res.status(400).json({ error: 'Invalid coordinates' });
  }

  db.query(
    'UPDATE porta_potties SET name=?, latitude=?, longitude=?, description=?, rating=?, isPrivate=?, isAccessible=?, hasWomensProducts=? WHERE id=?',
    [name, latitude, longitude, description, rating, isPrivate, isAccessible, hasWomensProducts, id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
      res.json({ id, name, latitude, longitude, description, rating, isPrivate, isAccessible, hasWomensProducts });
    }
  );
});

// Delete porta potty
app.delete('/api/porta-potties/:id', (req, res) => {
  const { id } = req.params;

  db.query('DELETE FROM porta_potties WHERE id=?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Porta potty deleted successfully' });
  });
});

// Listen for requests
app.listen(3000, () => console.log(`Server running on port 3000`));

// 1. Auth0, 2. WorkOS, 3. OAuth