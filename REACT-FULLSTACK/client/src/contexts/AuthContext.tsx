import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, RegisterPacienteDTO } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  registerPaciente: (data: RegisterPacienteDTO) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkSession = async () => {
    try {
      const data = await authApi.getMe();
      setUser(data.usuario);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const login = async (email: string, password: string): Promise<AuthUser> => {
    const data = await authApi.login(email, password);
    setUser(data.usuario);
    return data.usuario;
  };

  const registerPaciente = async (formData: RegisterPacienteDTO): Promise<AuthUser> => {
    const data = await authApi.registerPaciente(formData);
    setUser(data.usuario);
    return data.usuario;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error('Error cerrando sesión:', err);
    } finally {
      setUser(null);
    }
  };

  const refreshUser = async () => {
    await checkSession();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        registerPaciente,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe utilizarse dentro de un AuthProvider');
  }
  return context;
};
