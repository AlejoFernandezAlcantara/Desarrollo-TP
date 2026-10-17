import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  label?: string;
  /** Ruta a la que va si no hay página anterior (ej. el usuario abrió la URL directo) */
  fallback?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({ label = 'Volver', fallback = '/' }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = () => {
    // key === 'default' indica la primera entrada del historial: no hay página anterior dentro de la app
    if (location.key !== 'default') {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };

  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm"
      style={{ marginBottom: '1rem' }}
      onClick={handleClick}
    >
      <ArrowLeft size={16} />
      <span>{label}</span>
    </button>
  );
};