const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  multipleStatements: true
});

const sql = fs.readFileSync(path.join(__dirname, 'createTables.sql'), 'utf8');

db.connect(err => {
  if (err) {
    console.error('Could not connect to MySQL:', err.message);
    process.exit(1);
  }

  db.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
  db.changeUser({ database: process.env.DB_NAME }, err => {
    if (err) throw err;

    db.query(sql, err => {
      if (err) {
        console.error('Failed to initialize database:', err.message);
      } else {
        console.log('Database initialized successfully ✅');
      }
      db.end();
    });
  });
});