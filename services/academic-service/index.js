const express = require('express');
require('dotenv').config();
const { errorHandler } = require('../../shared/errors');
const academicRoutes = require('./routes/academicRoutes');

const app = express();

// Middleware
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/academic', academicRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'Academic Service',
    status: 'running',
  });
});

// Error handling
app.use(errorHandler);

const PORT = process.env.ACADEMIC_SERVICE_PORT || 3004;
app.listen(PORT, () => {
  console.log(`[Academic Service] Running on port ${PORT}`);
});

module.exports = app;
