const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// PostgreSQL pool setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ensure users table exists
pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20) UNIQUE
  )
`).then(() => {
  console.log('✅ Users table is ready');
}).catch(err => {
  console.error('❌ Error creating users table:', err);
});

// Ensure prizes table exists and initialize
pool.query(`
  CREATE TABLE IF NOT EXISTS prizes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE,
    remaining INTEGER NOT NULL
  )
`).then(() => {
  console.log('✅ Prizes table is ready');
  return pool.query(`
    INSERT INTO prizes (name, remaining)
    VALUES 
      ('Pen', 200),
      ('Cap', 100),
      ('Cup', 50)
    ON CONFLICT (name) DO NOTHING;
  `);
}).catch(err => {
  console.error('❌ Error setting up prizes:', err);
});

// Register route
app.post('/register', async (req, res) => {
  const { name, phone, email = null } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ success: false, message: 'Name and phone are required' });
  }
  try {
    await pool.query(
      'INSERT INTO users (name, email, phone) VALUES ($1, $2, $3)',
      [name, email, phone]
    );
    res.status(200).json({ success: true, message: 'User added successfully' });
  } catch (err) {
    if (err.code === '23505') {
      res.status(409).json({ success: false, message: 'Phone number already registered!' });
    } else {
      console.error('Insert error:', err);
      res.status(500).json({ success: false, message: 'Failed to add user' });
    }
  }
});

// Prize route with random chance and DB inventory tracking
app.get('/get-prize', async (req, res) => {
  try {
    const random = Math.random();
    if (random < 0.3) {
      return res.json({ prize: '😢 Better luck next time!' });
    }

    const prizes = ['Pen', 'Cap', 'Cup'];
    for (const prize of prizes) {
      const result = await pool.query('SELECT remaining FROM prizes WHERE name = $1', [prize]);
      if (result.rows.length > 0 && result.rows[0].remaining > 0) {
        await pool.query('UPDATE prizes SET remaining = remaining - 1 WHERE name = $1', [prize]);
        return res.json({ prize: `🎁 You won a ${prize}!` });
      }
    }

    res.json({ prize: '😢 Better luck next time!' });
  } catch (err) {
    console.error('Prize error:', err);
    res.status(500).json({ prize: '😢 Better luck next time!' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});