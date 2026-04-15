const express = require('express');
const httpProxy = require('express-http-proxy');
require('dotenv').config();

const app = express();

// Middlewares
app.use(express.json());

// URLs de servicios. En produccion deberian venir desde variables de entorno
const serviceUrls = {
  auth: 'http://localhost:3008',
  student: 'http://localhost:3001',
  teacher: 'http://localhost:3002',
  enrollment: 'http://localhost:3003',
  academic: 'http://localhost:3004',
  attendance: 'http://localhost:3005',
  payment: 'http://localhost:3006',
  notification: 'http://localhost:3007',
};

// Middleware de logging de solicitudes
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Enrutamiento hacia microservicios
app.use('/api/students', httpProxy(serviceUrls.student, {
  proxyReqPathResolver: (req) => `/api/students${req.url}`,
}));

app.use('/api/auth', httpProxy(serviceUrls.auth, {
  proxyReqPathResolver: (req) => `/api/auth${req.url}`,
}));

app.use('/api/teachers', httpProxy(serviceUrls.teacher, {
  proxyReqPathResolver: (req) => `/api/teachers${req.url}`,
}));

app.use('/api/enrollments', httpProxy(serviceUrls.enrollment, {
  proxyReqPathResolver: (req) => `/api/enrollments${req.url}`,
}));

app.use('/api/academic', httpProxy(serviceUrls.academic, {
  proxyReqPathResolver: (req) => `/api/academic${req.url}`,
}));

app.use('/api/attendance', httpProxy(serviceUrls.attendance, {
  proxyReqPathResolver: (req) => `/api/attendance${req.url}`,
}));

app.use('/api/payments', httpProxy(serviceUrls.payment, {
  proxyReqPathResolver: (req) => `/api/payments${req.url}`,
}));

app.use('/api/notifications', httpProxy(serviceUrls.notification, {
  proxyReqPathResolver: (req) => `/api/notifications${req.url}`,
}));

// Endpoint de salud
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API Gateway is running',
    timestamp: new Date().toISOString(),
  });
});

// Manejador 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[API Gateway] Server running on port ${PORT}`);
  console.log('Servicios disponibles:');
  Object.entries(serviceUrls).forEach(([service, url]) => {
    console.log(`  - ${service}: ${url}`);
  });
});
