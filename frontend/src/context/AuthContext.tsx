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
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('[AuthContext] Iniciando login para:', email);
      
      const response = await authService.login(email, password);
      console.log('[AuthContext] Respuesta recibida:', response);
      console.log('[AuthContext] response.data:', response.data);
      
      const { datos } = response.data;
      console.log('[AuthContext] datos:', datos);
      
      if (!datos) {
        throw new Error('Respuesta inválida: falta el campo "datos"');
      }
      
      const { token, usuario } = datos;
      console.log('[AuthContext] token:', token?.substring(0, 30) + '...');
      console.log('[AuthContext] usuario:', usuario);
      
      if (!token) {
        throw new Error('Respuesta inválida: falta el token');
      }
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(usuario));
      setToken(token);
      setUser(usuario);
      
      console.log('[AuthContext] ✓ Login exitoso');
    } catch (error: any) {
      console.error('[AuthContext] ✗ Error en login:', error);
      console.error('[AuthContext] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        fullError: error
      });
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    localStorage.removeItem('user');
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
