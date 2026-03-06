/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, ReactNode } from 'react';
import api from '../services/api'; //

interface AuthContextType {
  user: any;
  token: string | null;
  login: (data: any, userData?: any) => void;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: any) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<any>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const register = async (name: string, email: string, password: string) => {
    try {
      await api.post('/auth/register', { 
        fullName: name, 
        email, 
        password 
      });
    } catch (error) {
      console.error("Error en registro:", error);
      throw error;
    }
  };

  const login = (data: any, userData?: any) => {
    const tokenString = typeof data === 'string' ? data : (data.access_token || data.token);

    if (!tokenString || tokenString.includes('@')) {
      console.error("❌ TOKEN INVÁLIDO detectado:", tokenString);
      return;
    }

    const userToSave = userData || data.user || {};
    
    localStorage.setItem('token', tokenString);
    localStorage.setItem('user', JSON.stringify(userToSave));

    setToken(tokenString);
    setUser(userToSave);
  };

  const updateUser = (updatedUserData: any) => {
    localStorage.setItem('user', JSON.stringify(updatedUserData));
    setUser(updatedUserData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token;
  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      logout, 
      updateUser, 
      register, //
      isAuthenticated 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de un AuthProvider');
  return context;
}