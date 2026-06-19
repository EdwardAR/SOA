import React, { useEffect, useState } from 'react';
import { notificacionesService } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const NotificationBanner: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      try {
        const response = await notificacionesService.getAll();
        const all = response.data?.datos || [];
        const unread = all.filter((n: any) => !n.leida).length;
        setUnreadCount(unread);
      } catch {
        // silently fail
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user || unreadCount === 0 || dismissed) return null;

  return (
    <div
      className="alert alert-info alert-dismissible d-flex align-items-center gap-2 mx-3 mt-2 mb-0 py-2"
      role="alert"
      style={{ borderRadius: 12, fontSize: '0.9rem' }}
    >
      <i className="bi bi-bell-fill"></i>
      <span>
        Tienes <strong>{unreadCount}</strong> {unreadCount === 1 ? 'notificación no leída' : 'notificaciones no leídas'}.
        <button
          className="btn btn-link btn-sm p-0 ms-2 align-baseline"
          onClick={() => navigate('/notificaciones')}
          style={{ verticalAlign: 'baseline' }}
        >
          Ver ahora
        </button>
      </span>
      <button
        type="button"
        className="btn-close py-2"
        onClick={() => setDismissed(true)}
      ></button>
    </div>
  );
};

export default NotificationBanner;
