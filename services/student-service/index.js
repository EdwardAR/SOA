const express = require('express');
require('dotenv').config();
const { errorHandler } = require('../../shared/errors');
const studentRoutes = require('./routes/studentRoutes');

const app = express();

// Middleware
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/students', studentRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'Student Service',
    status: 'running',
  });
});

// Error handling
app.use(errorHandler);

const PORT = process.env.STUDENT_SERVICE_PORT || 3001;
app.listen(PORT, () => {
  console.log(`[Student Service] Running on port ${PORT}`);
});

module.exports = app;
