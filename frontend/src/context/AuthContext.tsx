/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  user: any;
  token: string | null;
  login: (data: any, userData?: any) => void;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<any>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = (data: any, userData?: any) => {
    const tokenString = typeof data === 'string' ? data : (data.access_token || data.token);

    if (!tokenString || tokenString.includes('@')) {
      console.error("❌ TOKEN INVÁLIDO detectado:", tokenString);
      return;
    }

    localStorage.setItem('token', tokenString);
    localStorage.setItem('user', JSON.stringify(userData || data.user || {}));
    
    setToken(tokenString);
    setUser(userData || data.user || {});
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated, register: async () => {} }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de un AuthProvider');
  return context;
}