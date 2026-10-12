import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Calendar,
  CalendarPlus,
  Users,
  Settings,
  Activity,
  Home,
  Menu,
  X,
  LogOut,
  LogIn,
  User as UserIcon,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import './Navbar.css';

export const Navbar: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  // Cerrar el sidebar con la tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) {
        closeSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  // Bloquear el scroll del body cuando el sidebar está abierto
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  // Cerrar el sidebar al cambiar de ruta
  useEffect(() => {
    closeSidebar();
  }, [location.pathname]);

  const handleLogout = async () => {
    closeSidebar();
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
    <>
      {/* Barra superior con botón hamburguesa en la esquina superior izquierda */}
      <header className="navbar-topbar">
        <div className="navbar-topbar-inner">
          <div className="navbar-left">
            <button
              type="button"
              className="navbar-hamburger-btn"
              onClick={toggleSidebar}
              aria-label="Abrir menú de navegación"
              title="Abrir menú"
            >
              <Menu size={22} />
            </button>

            <NavLink to="/" className="navbar-brand">
              <div className="navbar-logo-wrapper">
                <img
                  src={theme === 'dark' ? '/logo-gold-dark.png' : '/logo-gold-light.png'}
                  alt="Logo Clínica"
                  className="navbar-logo"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logo-icon.png';
                  }}
                />
              </div>
              <span className="navbar-title">Consultorio Carestia</span>
            </NavLink>
          </div>

          <div className="navbar-right">
            <button
              type="button"
              className="btn-theme-toggle"
              onClick={toggleTheme}
              title={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo luminoso'}
              aria-label="Cambiar tema de color"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {isAuthenticated && user ? (
              <div className="topbar-user-chip" onClick={toggleSidebar} title="Ver opciones de usuario">
                <div className="navbar-user-avatar">
                  <UserIcon size={14} />
                </div>
                <span className="topbar-user-name">{user.nombre}</span>
              </div>
            ) : (
              <NavLink to="/login" className="btn btn-primary btn-sm btn-login">
                <LogIn size={15} />
                <span>Iniciar Sesión</span>
              </NavLink>
            )}
          </div>
        </div>
      </header>

      {/* Overlay backdrop oscuro */}
      <div
        className={`sidebar-backdrop ${sidebarOpen ? 'open' : ''}`}
        onClick={closeSidebar}
        aria-hidden={!sidebarOpen}
      />

      {/* Panel lateral deslizante (Sidebar) */}
      <aside
        className={`sidebar-drawer ${sidebarOpen ? 'open' : ''}`}
        aria-label="Menú principal de navegación"
        aria-hidden={!sidebarOpen}
      >
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="navbar-logo-wrapper">
              <img
                src={theme === 'dark' ? '/logo-gold-dark.png' : '/logo-gold-light.png'}
                alt="Logo Clínica"
                className="sidebar-logo"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo-icon.png';
                }}
              />
            </div>
            <div className="sidebar-brand-text">
              <span className="sidebar-title">Consultorio Carestia</span>
              <span className="sidebar-subtitle">Gestión Odontológica</span>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-close-btn"
            onClick={closeSidebar}
            aria-label="Cerrar menú"
            title="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        {/* Sección de usuario si está autenticado */}
        {isAuthenticated && user && (
          <div className="sidebar-user-card">
            <div className="navbar-user-avatar sidebar-avatar">
              <UserIcon size={18} />
            </div>
            <div className="sidebar-user-details">
              <span className="sidebar-user-name">
                {user.nombre} {user.apellido}
              </span>
              <span className={`badge badge-role badge-${user.rol.toLowerCase()}`}>
                {user.rol}
              </span>
            </div>
          </div>
        )}

        {/* Navegación vertical */}
        <nav className="sidebar-nav">
          <div className="sidebar-nav-group-title">Navegación</div>

          <NavLink
            to="/"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={closeSidebar}
            end
          >
            <Home size={19} />
            <span>Inicio</span>
          </NavLink>

          {canViewAgenda && (
            <NavLink
              to="/agenda"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={closeSidebar}
              end
            >
              <Calendar size={19} />
              <span>Reservar Turnos</span>
            </NavLink>
          )}

          {canViewGenerarTurnos && (
            <NavLink
              to="/agenda/turnos"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <CalendarPlus size={19} />
              <span>{user?.rol === 'ODONTOLOGO' ? 'Mis Turnos' : 'Generar Turnos'}</span>
            </NavLink>
          )}

          {canViewRecepcion && (
            <NavLink
              to="/recepcion"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <Users size={19} />
              <span>Recepción / Pacientes</span>
            </NavLink>
          )}

          {canViewConsultorio && (
            <NavLink
              to="/consultorio"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <Activity size={19} />
              <span>Consultorio Clínico</span>
            </NavLink>
          )}

          {canViewAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <Settings size={19} />
              <span>Administración</span>
            </NavLink>
          )}
        </nav>

        {/* Footer del sidebar con cambio de tema y logout */}
        <div className="sidebar-footer">
          <button
            type="button"
            className="sidebar-theme-btn"
            onClick={toggleTheme}
            aria-label="Cambiar tema de color"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            <span>{theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}</span>
          </button>

          {isAuthenticated && user ? (
            <button
              type="button"
              className="sidebar-logout-btn"
              onClick={handleLogout}
            >
              <LogOut size={18} />
              <span>Cerrar Sesión</span>
            </button>
          ) : (
            <NavLink
              to="/login"
              className="btn btn-primary btn-sm sidebar-login-btn"
              onClick={closeSidebar}
            >
              <LogIn size={18} />
              <span>Iniciar Sesión</span>
            </NavLink>
          )}
        </div>
      </aside>
    </>
  );
};

