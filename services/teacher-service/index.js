const express = require('express');
require('dotenv').config();
const { errorHandler } = require('../../shared/errors');
const teacherRoutes = require('./routes/teacherRoutes');

const app = express();

// Middleware
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/teachers', teacherRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'Teacher Service',
    status: 'running',
  });
});

// Error handling
app.use(errorHandler);

const PORT = process.env.TEACHER_SERVICE_PORT || 3002;
app.listen(PORT, () => {
  console.log(`[Teacher Service] Running on port ${PORT}`);
});

module.exports = app;
