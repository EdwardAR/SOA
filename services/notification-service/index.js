const express = require('express');
require('dotenv').config();
const { errorHandler } = require('../../shared/errors');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Middleware
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'Notification Service',
    status: 'running',
  });
});

// Error handling
app.use(errorHandler);

const PORT = process.env.NOTIFICATION_SERVICE_PORT || 3007;
app.listen(PORT, () => {
  console.log(`[Notification Service] Running on port ${PORT}`);
});

module.exports = app;
