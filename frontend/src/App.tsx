import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
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
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div>
      <Navbar />
      <div style={{ display: 'flex', marginTop: '70px' }}>
        <Sidebar />
        <div style={{ marginLeft: '250px', width: 'calc(100% - 250px)' }}>
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
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </div>
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
