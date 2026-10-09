import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Lock, Mail, Eye, EyeOff, LogIn, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';
import './Login.css';

export const Login: React.FC = () => {
  const { user, isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated && user) {
      redirectByRole(user.rol);
    }
  }, [isAuthenticated, user]);

const redirectByRole = (_rol?: string) => {
  // Si el usuario venía de una página protegida, vuelve a esa; si no, va al Home
  const fromPath = (location.state as any)?.from?.pathname;
  if (fromPath && fromPath !== '/login') {
    navigate(fromPath, { replace: true });
    return;
  }

  navigate('/', { replace: true });
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Por favor completa todos los campos');
      return;
    }

    setIsSubmitting(true);
    try {
      const loggedUser = await login(email.trim(), password);
      redirectByRole(loggedUser.rol);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillQuickCredentials = (userEmail: string, pass: string) => {
    setEmail(userEmail);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon-badge">
            <ShieldCheck size={28} />
          </div>
          <h1 className="login-title">Iniciar Sesión</h1>
          <p className="login-subtitle">
            Accede a tu panel clínico y administrativo de Consultorio Carestia
          </p>
        </div>

        {error && (
          <div className="login-error-alert" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="login-field">
            <label htmlFor="login-email">Correo Electrónico</label>
            <div className="login-input-wrapper">
              <span className="login-input-icon">
                <Mail size={18} />
              </span>
              <input
                id="login-email"
                type="email"
                className="login-input"
                placeholder="ejemplo@dentalcare.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="login-password">Contraseña</label>
            <div className="login-input-wrapper">
              <span className="login-input-icon">
                <Lock size={18} />
              </span>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="login-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="login-input-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                <span>Validando...</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>Ingresar al Sistema</span>
              </>
            )}
          </button>
        </form>

        <div className="login-register-prompt">
          <span>¿No tienes una cuenta de paciente?</span>
          <Link to="/register" className="login-register-link">
            Regístrate aquí
          </Link>
        </div>

        <div className="login-quickfill">
          <div className="login-quickfill-title">
            <Sparkles size={14} />
            <span>Acceso rápido de prueba</span>
          </div>
          <div className="login-quickfill-chips">
            <button
              type="button"
              className="quickfill-chip"
              onClick={() => fillQuickCredentials('admin@consultorio.com', 'Admin123!')}
              title="Cargar credenciales de Administrador"
            >
              👑 Administrador
            </button>
            <button
              type="button"
              className="quickfill-chip"
              onClick={() => fillQuickCredentials('odonto@consultorio.com', 'Odonto123!')}
              title="Cargar credenciales de Odontólogo"
            >
              🩺 Odontólogo
            </button>
            <button
              type="button"
              className="quickfill-chip"
              onClick={() => fillQuickCredentials('paciente@consultorio.com', 'Paciente123!')}
              title="Cargar credenciales de Paciente"
            >
              👤 Paciente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
