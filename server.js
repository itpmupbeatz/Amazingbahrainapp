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

// Test DB route
app.get('/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.status(200).send(`Database connected! Time: ${result.rows[0].now}`);
  } catch (err) {
    console.error('❌ DB connection failed:', err);
    res.status(500).send('Database error');
  }
});

// Register route
app.post('/register', async (req, res) => {
  const { name, phone, email } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ success: false, message: 'Name and phone are required' });
  }

  try {
    await pool.query(
      'INSERT INTO users (name, email, phone) VALUES ($1, $2, $3)',
      [name, email || null, phone]
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

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
