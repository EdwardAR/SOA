import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../api/services';

interface User {
  id: string;
  nombre: string;
  email: string;
  tipo_usuario: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function isValidUser(obj: any): obj is User {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.nombre === 'string' &&
    typeof obj.email === 'string' &&
    typeof obj.tipo_usuario === 'string' &&
    obj.tipo_usuario.length > 0
  );
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (isValidUser(parsed)) {
          setToken(savedToken);
          setUser(parsed);
        } else {
          // Sesión inválida/corrupta — limpiar
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password);
      const { datos } = response.data;

      if (!datos) {
        throw new Error('Respuesta inválida: falta el campo "datos"');
      }

      const { token, usuario } = datos;

      if (!token) {
        throw new Error('Respuesta inválida: falta el token');
      }

      if (!isValidUser(usuario)) {
        throw new Error('Respuesta inválida: datos de usuario incompletos');
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(usuario));
      setToken(token);
      setUser(usuario);
    } catch (error: any) {
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
