const express = require('express');
require('dotenv').config();
const { errorHandler } = require('../../shared/errors');
const enrollmentRoutes = require('./routes/enrollmentRoutes');

const app = express();

// Middleware
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/enrollments', enrollmentRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'Enrollment Service',
    status: 'running',
  });
});

// Error handling
app.use(errorHandler);

const PORT = process.env.ENROLLMENT_SERVICE_PORT || 3003;
app.listen(PORT, () => {
  console.log(`[Enrollment Service] Running on port ${PORT}`);
});

module.exports = app;
