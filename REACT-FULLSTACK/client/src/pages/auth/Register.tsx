import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Phone,
  MapPin,
  IdCard,
  UserPlus,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { TipoDocumento } from '../../types';
import './Register.css';

export const Register: React.FC = () => {
  const { isAuthenticated, registerPaciente } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    confirmPassword: '',
    tipoDoc: 'DNI' as TipoDocumento,
    nroDocumento: '',
    direccion: '',
    telefono: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/agenda', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (
      !formData.nombre.trim() ||
      !formData.apellido.trim() ||
      !formData.email.trim() ||
      !formData.password ||
      !formData.confirmPassword ||
      !formData.direccion.trim() ||
      !formData.nroDocumento.trim()
    ) {
      setError('Por favor completa todos los campos obligatorios (*)');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas ingresadas no coinciden');
      return;
    }

    setIsSubmitting(true);

    try {
      await registerPaciente({
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        email: formData.email.trim(),
        password: formData.password,
        direccion: formData.direccion.trim(),
        telefono: formData.telefono.trim() || undefined,
        nroDocumento: formData.nroDocumento.trim(),
        tipoDoc: formData.tipoDoc
      });

      setSuccess(true);
      // Redirigir al inicio o agenda tras un instante breve
      setTimeout(() => {
        navigate('/agenda', { replace: true });
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Error al registrar paciente. Intenta nuevamente.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <div className="register-icon-badge">
            <UserPlus size={28} />
          </div>
          <h1 className="register-title">Crear Cuenta de Paciente</h1>
          <p className="register-subtitle">
            Regístrate en Consultorio Carestia para solicitar turnos, consultar tu historial y acceder a tus consultas
          </p>
        </div>

        {error && (
          <div className="register-error-alert" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="register-success-alert" role="alert">
            <CheckCircle2 size={18} />
            <span>¡Registro exitoso! Iniciando sesión en tu cuenta...</span>
          </div>
        )}

        <form className="register-form" onSubmit={handleSubmit} noValidate>
          <div className="register-grid">
            {/* Nombre */}
            <div className="register-field">
              <label htmlFor="reg-nombre">
                Nombre <span className="required">*</span>
              </label>
              <div className="register-input-wrapper">
                <span className="register-input-icon">
                  <User size={18} />
                </span>
                <input
                  id="reg-nombre"
                  name="nombre"
                  type="text"
                  className="register-input"
                  placeholder="Juan"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting || success}
                />
              </div>
            </div>

            {/* Apellido */}
            <div className="register-field">
              <label htmlFor="reg-apellido">
                Apellido <span className="required">*</span>
              </label>
              <div className="register-input-wrapper">
                <span className="register-input-icon">
                  <User size={18} />
                </span>
                <input
                  id="reg-apellido"
                  name="apellido"
                  type="text"
                  className="register-input"
                  placeholder="Pérez"
                  value={formData.apellido}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting || success}
                />
              </div>
            </div>

            {/* Tipo de Documento */}
            <div className="register-field">
              <label htmlFor="reg-tipoDoc">
                Tipo de Doc. <span className="required">*</span>
              </label>
              <div className="register-input-wrapper">
                <span className="register-input-icon">
                  <IdCard size={18} />
                </span>
                <select
                  id="reg-tipoDoc"
                  name="tipoDoc"
                  className="register-select"
                  value={formData.tipoDoc}
                  onChange={handleChange}
                  disabled={isSubmitting || success}
                >
                  <option value="DNI">DNI (Documento Nacional)</option>
                  <option value="Pasaporte">Pasaporte</option>
                </select>
              </div>
            </div>

            {/* Número de Documento */}
            <div className="register-field">
              <label htmlFor="reg-nroDoc">
                N° de Documento <span className="required">*</span>
              </label>
              <div className="register-input-wrapper">
                <span className="register-input-icon">
                  <IdCard size={18} />
                </span>
                <input
                  id="reg-nroDoc"
                  name="nroDocumento"
                  type="text"
                  className="register-input"
                  placeholder="40123456"
                  value={formData.nroDocumento}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting || success}
                />
              </div>
            </div>

            {/* Correo Electrónico */}
            <div className="register-field full-width">
              <label htmlFor="reg-email">
                Correo Electrónico <span className="required">*</span>
              </label>
              <div className="register-input-wrapper">
                <span className="register-input-icon">
                  <Mail size={18} />
                </span>
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  className="register-input"
                  placeholder="paciente@correo.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                  disabled={isSubmitting || success}
                />
              </div>
            </div>

            {/* Teléfono */}
            <div className="register-field">
              <label htmlFor="reg-telefono">Teléfono / Celular</label>
              <div className="register-input-wrapper">
                <span className="register-input-icon">
                  <Phone size={18} />
                </span>
                <input
                  id="reg-telefono"
                  name="telefono"
                  type="tel"
                  className="register-input"
                  placeholder="11 2345-6789"
                  value={formData.telefono}
                  onChange={handleChange}
                  disabled={isSubmitting || success}
                />
              </div>
            </div>

            {/* Dirección */}
            <div className="register-field">
              <label htmlFor="reg-direccion">
                Dirección / Domicilio <span className="required">*</span>
              </label>
              <div className="register-input-wrapper">
                <span className="register-input-icon">
                  <MapPin size={18} />
                </span>
                <input
                  id="reg-direccion"
                  name="direccion"
                  type="text"
                  className="register-input"
                  placeholder="Av. San Martín 1234"
                  value={formData.direccion}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting || success}
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="register-field">
              <label htmlFor="reg-password">
                Contraseña <span className="required">*</span>
              </label>
              <div className="register-input-wrapper">
                <span className="register-input-icon">
                  <Lock size={18} />
                </span>
                <input
                  id="reg-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="register-input"
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                  disabled={isSubmitting || success}
                />
                <button
                  type="button"
                  className="register-input-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirmar Contraseña */}
            <div className="register-field">
              <label htmlFor="reg-confirmPassword">
                Confirmar Contraseña <span className="required">*</span>
              </label>
              <div className="register-input-wrapper">
                <span className="register-input-icon">
                  <Lock size={18} />
                </span>
                <input
                  id="reg-confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="register-input"
                  placeholder="Repite la contraseña"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                  disabled={isSubmitting || success}
                />
                <button
                  type="button"
                  className="register-input-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="register-submit-btn"
            disabled={isSubmitting || success}
          >
            {isSubmitting ? (
              <>
                <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                <span>Registrando cuenta...</span>
              </>
            ) : success ? (
              <>
                <CheckCircle2 size={18} />
                <span>¡Registrado con Éxito!</span>
              </>
            ) : (
              <>
                <UserPlus size={18} />
                <span>Completar Registro</span>
              </>
            )}
          </button>
        </form>

        <div className="register-footer">
          <span>¿Ya tienes una cuenta registrada?</span>
          <Link to="/login" className="register-login-link">
            Inicia sesión aquí
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
