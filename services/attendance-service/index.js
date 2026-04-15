const express = require('express');
require('dotenv').config();
const { errorHandler } = require('../../shared/errors');
const attendanceRoutes = require('./routes/attendanceRoutes');

const app = express();

// Middleware
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/attendance', attendanceRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'Attendance Service',
    status: 'running',
  });
});

// Error handling
app.use(errorHandler);

const PORT = process.env.ATTENDANCE_SERVICE_PORT || 3005;
app.listen(PORT, () => {
  console.log(`[Attendance Service] Running on port ${PORT}`);
});

module.exports = app;
