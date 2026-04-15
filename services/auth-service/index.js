const express = require('express');
require('dotenv').config();
const { errorHandler } = require('../../shared/errors');
const authRoutes = require('./routes/authRoutes');

const app = express();

// Middleware
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'Auth Service',
    status: 'running',
  });
});

// Error handling
app.use(errorHandler);

const PORT = process.env.AUTH_SERVICE_PORT || 3008;
app.listen(PORT, () => {
  console.log(`[Auth Service] Running on port ${PORT}`);
});

module.exports = app;
