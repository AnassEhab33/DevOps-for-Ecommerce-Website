require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { pool, initDB } = require('./db');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'healthy', service: 'user-service', db: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'unhealthy', service: 'user-service', db: 'disconnected' });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
initDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ User Service running on port ${PORT}`);
  });
}).catch(err => {
  console.error('❌ Failed to initialize DB:', err);
  process.exit(1);
});

module.exports = app;
