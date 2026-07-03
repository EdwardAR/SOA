import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Alumnos from './pages/Alumnos';
import Profesores from './pages/Profesores';
import Cursos from './pages/Cursos';
import Matriculas from './pages/Matriculas';
import Pagos from './pages/Pagos';
import Asistencia from './pages/Asistencia';
import Calificaciones from './pages/Calificaciones';
import Notificaciones from './pages/Notificaciones';
import Perfil from './pages/Perfil';
import AuditoriaLogs from './pages/AuditoriaLogs';
import Servicios from './pages/Servicios';
import Reportes from './pages/Reportes';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import NotificationBanner from './components/NotificationBanner';

const AppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div>
      <Navbar />
      <div style={{ display: 'flex', marginTop: '70px', minHeight: 'calc(100vh - 70px)' }}>
        <Sidebar />
        <div
          style={{
            marginLeft: '250px',
            width: 'calc(100% - 250px)',
            transition: 'all 0.3s ease-in-out',
          }}
          className="main-content"
        >
          <NotificationBanner />
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/alumnos" element={<Alumnos />} />
            <Route path="/profesores" element={<Profesores />} />
            <Route path="/cursos" element={<Cursos />} />
            <Route path="/matriculas" element={<Matriculas />} />
            <Route path="/pagos" element={<Pagos />} />
            <Route path="/asistencia" element={<Asistencia />} />
            <Route path="/calificaciones" element={<Calificaciones />} />
            <Route path="/notificaciones" element={<Notificaciones />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/auditoria" element={<AuditoriaLogs />} />
            <Route path="/servicios" element={<Servicios />} />
            <Route path="/reportes" element={<Reportes />} />
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/login" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 991px) {
          .main-content {
            margin-left: 0 !important;
            width: 100% !important;
          }
        }

        @media (max-width: 768px) {
          .navbar-brand span.d-sm-inline {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;
