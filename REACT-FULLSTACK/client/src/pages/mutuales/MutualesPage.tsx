import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { MisObrasSociales } from './MisObrasSociales';
import { MisMutualesOdontologo } from './MisMutualesOdontologo';
import { Navigate } from 'react-router-dom';

export const MutualesPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.rol === 'ODONTOLOGO') {
    return <MisMutualesOdontologo />;
  }

  if (user.rol === 'PACIENTE') {
    return <MisObrasSociales />;
  }

  // Si ingresa un ADMINISTRADOR, redirige a la gestión de mutuales administrativa
  if (user.rol === 'ADMINISTRADOR') {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/" replace />;
};

export default MutualesPage;
