const express = require('express');
require('dotenv').config();
const { errorHandler } = require('../../shared/errors');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();

// Middleware
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/payments', paymentRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'Payment Service',
    status: 'running',
  });
});

// Error handling
app.use(errorHandler);

const PORT = process.env.PAYMENT_SERVICE_PORT || 3006;
app.listen(PORT, () => {
  console.log(`[Payment Service] Running on port ${PORT}`);
});

module.exports = app;
