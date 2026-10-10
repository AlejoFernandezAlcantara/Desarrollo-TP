import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Calendar, CalendarPlus, Users, Settings, Activity, Home, Menu, X, LogOut, LogIn, User as UserIcon, Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import './Navbar.css';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const toggleMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMenu = () => setMobileMenuOpen(false);

  const handleLogout = async () => {
    closeMenu();
    await logout();
    navigate('/login');
  };

  // Determinar permisos de visibilidad de enlaces
  const canViewAdmin = user?.rol === 'ADMINISTRADOR';
  const canViewRecepcion = user?.rol === 'ADMINISTRADOR';
  const canViewConsultorio = user?.rol === 'ADMINISTRADOR' || user?.rol === 'ODONTOLOGO';
  const canViewGenerarTurnos = user?.rol === 'ADMINISTRADOR' || user?.rol === 'ODONTOLOGO';
  const canViewAgenda = true; // Todos pueden ver agenda o turnos según su contexto

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-brand" onClick={closeMenu}>
          <img src="/logo.jpeg" alt="Logo Clínica" className="navbar-logo" onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }} />
          <span className="navbar-title">Consultorio Carestia</span>
        </NavLink>

        <button
          className="navbar-mobile-toggle"
          onClick={toggleMenu}
          aria-label="Abrir menú"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <nav className={`navbar-links ${mobileMenuOpen ? 'open' : ''}`}>
          <NavLink
            to="/"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={closeMenu}
            end
          >
            <Home size={18} />
            <span>Inicio</span>
          </NavLink>

          {canViewAgenda && (
            <NavLink
              to="/agenda"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={closeMenu}
            >
              <Calendar size={18} />
              <span>Agenda & Turnos</span>
            </NavLink>
          )}

          {canViewGenerarTurnos && (
            <NavLink
              to="/agenda/turnos"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={closeMenu}
            >
              <CalendarPlus size={18} />
              <span>{user?.rol === 'ODONTOLOGO' ? 'Mis Turnos' : 'Generar Turnos'}</span>
            </NavLink>
          )}

          {canViewRecepcion && (
            <NavLink
              to="/recepcion"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={closeMenu}
            >
              <Users size={18} />
              <span>Recepción / Pacientes</span>
            </NavLink>
          )}

          {canViewConsultorio && (
            <NavLink
              to="/consultorio"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={closeMenu}
            >
              <Activity size={18} />
              <span>Consultorio Clínico</span>
            </NavLink>
          )}

          {canViewAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={closeMenu}
            >
              <Settings size={18} />
              <span>Administración</span>
            </NavLink>
          )}

          <div className="navbar-controls-section">
            <button
              type="button"
              className="btn-theme-toggle"
              onClick={toggleTheme}
              title={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo luminoso'}
              aria-label="Cambiar tema de color"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            <div className="navbar-auth-section">
              {isAuthenticated && user ? (
                <div className="navbar-user-box">
                  <div className="navbar-user-info">
                    <div className="navbar-user-avatar">
                      <UserIcon size={14} />
                    </div>
                    <div className="navbar-user-details">
                      <span className="navbar-user-name">
                        {user.nombre} {user.apellido}
                      </span>
                      <span className={`badge badge-role badge-${user.rol.toLowerCase()}`}>
                        {user.rol}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm btn-logout"
                    onClick={handleLogout}
                    title="Cerrar sesión"
                  >
                    <LogOut size={16} />
                    <span className="logout-text">Salir</span>
                  </button>
                </div>
              ) : (
                <NavLink
                  to="/login"
                  className="btn btn-primary btn-sm btn-login"
                  onClick={closeMenu}
                >
                  <LogIn size={16} />
                  <span>Iniciar Sesión</span>
                </NavLink>
              )}
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
};

