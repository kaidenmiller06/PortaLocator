// -----------------------------------------------------
// Server setup
// -----------------------------------------------------

const express = require('express');
const { WorkOS } = require('@workos-inc/node');
const session = require('express-session');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors({
  origin: 'http://127.0.0.1:3000',
  credentials: true,
}));
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

const workos = new WorkOS(process.env.WORKOS_API_KEY);
const clientId = process.env.WORKOS_CLIENT_ID;

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));



// -----------------------------------------------------
// Google Maps API route
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



// -----------------------------------------------------
// WorkOS API route
// -----------------------------------------------------

// Protect routes
function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect('/auth');
  next();
}


// Public - Home route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// Protected - App route (auth required)
app.get('/app', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'app.html'));
});


// WorkOS SSO route
app.get('/auth', (req, res) => {
  const authorizationUrl = workos.userManagement.getAuthorizationUrl({
    clientId,
    redirectUri: 'http://127.0.0.1:3000/callback',
    provider: 'authkit',
    prompt: 'login',
  });
  res.redirect(authorizationUrl);
});


// Callback
app.get('/callback', async (req, res) => {
  const { code, error, error_description } = req.query;

  if (error) return res.status(401).send(error_description);

  try {
    const { user } = await workos.userManagement.authenticateWithCode({
      clientId,
      code,
    });

    db.query(
      'INSERT INTO users (id) VALUES (?) ON DUPLICATE KEY UPDATE id=id',
      [user.id]
    );

    req.session.user = user;
    res.redirect('/app');
  } catch (err) {
    res.status(500).send(err.message);
  }
});


// Get current user
app.get('/api/me', requireAuth, (req, res) => {
  res.json(req.session.user);
});


// Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});


// Static files
app.use(express.static(path.join(__dirname, 'public'), { index: false }));
app.use('/assets', express.static('assets'));



// -----------------------------------------------------
// Porta Potty API routes
// -----------------------------------------------------

// Fetch porta potties
app.get('/api/porta-potties', (req, res) => {
  db.query('SELECT * FROM porta_potties', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});


// Fetch user porta potty count
app.get('/api/porta-potties/count', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });

  db.query('SELECT COUNT(*) as count FROM porta_potties WHERE createdBy=?', [req.session.user.id], (err, results) => {
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



// -----------------------------------------------------
// Porta Potty Vote API routes
// -----------------------------------------------------

// Fetch porta potty upvotes and user vote
app.get('/api/votes/:portaPottyId', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });

  const { portaPottyId } = req.params;

  db.query(
    `SELECT 
      (SELECT COUNT(*) FROM votes WHERE portaPottyId=? AND voteType=1) AS upvoteCount,
      (SELECT voteType FROM votes WHERE portaPottyId=? AND createdBy=?) AS userVote`,
    [portaPottyId, portaPottyId, req.session.user.id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        upvoteCount: results[0].upvoteCount,
        userVote: results[0].userVote ?? null  // 1, 0, or null
      });
    }
  );
});


// Create porta potty vote
app.post('/api/votes', (req, res) => {
  const { voteType, portaPottyId, createdBy, createdAt } = req.body;

  db.query(
    'INSERT INTO votes (voteType, portaPottyId, createdBy, createdAt) VALUES (?, ?, ?, ?)',
    [voteType, portaPottyId, req.session.user.id, createdAt],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ 
        id: result.insertId,
        voteType,
        portaPottyId,
        createdBy,
        createdAt
      });
    }
  );
});


// Edit porta potty vote
app.put('/api/votes/:portaPottyId', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });

  const { portaPottyId } = req.params;
  const { voteType } = req.body;

  db.query(
    'UPDATE votes SET voteType=? WHERE createdBy=? AND portaPottyId=?',
    [voteType, req.session.user.id, portaPottyId],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
      res.json({ voteType, portaPottyId });
    }
  );
});


// Delete porta potty vote
app.delete('/api/votes/:portaPottyId', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });

  const { portaPottyId } = req.params;

  db.query(
    'DELETE FROM votes WHERE createdBy=? AND portaPottyId=?',
    [req.session.user.id, portaPottyId],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
      res.json({ message: 'Vote deleted successfully' });
    }
  );
});


// Fetch user porta potty vote count
app.get('/api/votes/count', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });

  db.query('SELECT COUNT(*) as count FROM votes WHERE createdBy=? AND voteType=1', [req.session.user.id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});



// -----------------------------------------------------
// Theme API routes
// -----------------------------------------------------

// Fetch user theme
app.get('/api/user/theme', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });

  db.query('SELECT theme FROM users WHERE id=?', [req.session.user.id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results[0]);
  });
});


// Update user theme
app.put('/api/user/theme', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });

  const { theme } = req.body;

  db.query('UPDATE users SET theme=? WHERE id=?', [theme, req.session.user.id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Theme updated successfully' });
  });
});



// Listen for requests
app.listen(3000, () => console.log(`Server running on port 3000`));