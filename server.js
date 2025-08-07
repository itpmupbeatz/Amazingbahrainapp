const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Create users table if not exists
pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20) UNIQUE
  )
`).then(() => {
  console.log('Users table ensured');
}).catch(err => {
  console.error('Error creating users table:', err);
});

// DB connection test route
app.get('/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.send(result.rows);
  } catch (err) {
    console.error('Database connection failed:', err);
    res.status(500).send('DB error');
  }
});

// Handle registration
app.post('/register', async (req, res) => {
  const { name, phone, email } = req.body;
  try {
    await pool.query(
      'INSERT INTO users (name, email, phone) VALUES ($1, $2, $3)',
      [name, email, phone]
    );
    res.status(200).json({ success: true, message: 'User added successfully' });
  } catch (err) {
    if (err.code === '23505') {
      res.json({ success: false, message: 'Phone number already registered!' });
    } else {
      console.error('Insert error:', err);
      res.status(500).json({ success: false, message: 'Failed to add user' });
    }
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
