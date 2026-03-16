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

// Fetch porta potties
app.get('/api/porta-potties', (req, res) => {
  db.query('SELECT * FROM porta_potties', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Create porta potty
app.post('/api/porta-potties', (req, res) => {
  const { name, latitude, longitude, description, createdBy } = req.body;
  db.query(
    'INSERT INTO porta_potties (name, latitude, longitude, description, createdBy) VALUES (?, ?, ?, ?, ?)',
    [name, latitude, longitude, description, createdBy],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: result.insertId });
    }
  );
});

// Listen for requests
app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));