import React, { useEffect, useState } from 'react';
import {
  User,
  Pencil,
  Save,
  X,
  Lock,
  KeyRound,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { perfilApi } from '../../services/api';
import { Perfil, TipoDocumento, UpdatePerfilDTO } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import './Perfil.css';

interface PerfilForm {
  nombre: string;
  apellido: string;
  telefono: string;
  nroDocumento: string;
  tipoDoc: TipoDocumento;
  direccion: string; // solo pacientes
  especialidad: string; // solo odontólogos
}

interface PasswordForm {
  actual: string;
  nueva: string;
  confirmar: string;
}

const PASSWORD_VACIA: PasswordForm = { actual: '', nueva: '', confirmar: '' };

const perfilToForm = (p: Perfil): PerfilForm => ({
  nombre: p.nombre,
  apellido: p.apellido,
  telefono: p.telefono ?? '',
  nroDocumento: p.nroDocumento,
  tipoDoc: p.tipoDoc,
  direccion: p.rol === 'PACIENTE' ? p.direccion : '',
  especialidad: p.rol === 'ODONTOLOGO' ? p.especialidad : ''
});

const mensajeDeError = (err: unknown, porDefecto: string): string =>
  err instanceof Error && err.message ? err.message : porDefecto;

// ─── Piezas de presentación ────────────────────────────────────────────────

const Dato: React.FC<{ label: string; value?: React.ReactNode; locked?: boolean }> = ({
  label,
  value,
  locked
}) => (
  <div className="perfil-field">
    <span className="perfil-field-label">
      {label}
      {locked && (
        <span className="perfil-lock" title="Este dato no se puede modificar">
          <Lock size={12} />
        </span>
      )}
    </span>
    <span className="perfil-field-value">
      {value || <span className="perfil-field-empty">Sin completar</span>}
    </span>
  </div>
);

const Campo: React.FC<{
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}> = ({ id, label, hint, children }) => (
  <div className="form-group">
    <label className="form-label" htmlFor={id}>
      {label}
    </label>
    {children}
    {hint && <span className="perfil-hint">{hint}</span>}
  </div>
);

// ─── Página ────────────────────────────────────────────────────────────────

export const PerfilPage: React.FC = () => {
  const { refreshUser } = useAuth();

  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<PerfilForm | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [password, setPassword] = useState<PasswordForm>(PASSWORD_VACIA);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const cargarPerfil = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await perfilApi.get();
      setPerfil(data);
      setForm(perfilToForm(data));
    } catch (err) {
      setLoadError(mensajeDeError(err, 'No se pudieron cargar tus datos personales.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPerfil();
  }, []);

  const empezarEdicion = () => {
    if (!perfil) return;
    setForm(perfilToForm(perfil));
    setFormError(null);
    setSuccess(null);
    setEditing(true);
  };

  const cancelarEdicion = () => {
    if (perfil) setForm(perfilToForm(perfil));
    setFormError(null);
    setEditing(false);
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!perfil || !form) return;

    setSaving(true);
    setFormError(null);

    // Solo se envían los campos editables: email y matrícula nunca viajan al servidor
    const telefono = form.telefono.trim();
    const payload: UpdatePerfilDTO = {
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      telefono: telefono === '' ? null : telefono,
      nroDocumento: form.nroDocumento.trim(),
      tipoDoc: form.tipoDoc,
      ...(perfil.rol === 'PACIENTE'
        ? { direccion: form.direccion.trim() }
        : { especialidad: form.especialidad.trim() })
    };

    try {
      const actualizado = await perfilApi.update(payload);
      setPerfil(actualizado);
      setForm(perfilToForm(actualizado));
      setEditing(false);
      setSuccess('Tus datos personales se actualizaron correctamente.');
      // Refresca el usuario de la sesión para que el nombre del menú lateral quede al día
      await refreshUser();
    } catch (err) {
      setFormError(mensajeDeError(err, 'No se pudieron guardar los cambios.'));
    } finally {
      setSaving(false);
    }
  };

  const handleCambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (password.nueva !== password.confirmar) {
      setPasswordError('La nueva contraseña y su confirmación no coinciden.');
      return;
    }

    setSavingPassword(true);
    try {
      await perfilApi.cambiarPassword({
        passwordActual: password.actual,
        passwordNueva: password.nueva
      });
      setPassword(PASSWORD_VACIA);
      setPasswordSuccess('Tu contraseña se actualizó correctamente.');
    } catch (err) {
      setPasswordError(mensajeDeError(err, 'No se pudo cambiar la contraseña.'));
    } finally {
      setSavingPassword(false);
    }
  };

  // ── Estados de carga / error ──
  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
        <span>Cargando tus datos personales...</span>
      </div>
    );
  }

  if (loadError || !perfil || !form) {
    return (
      <div className="perfil-container">
        <div className="perfil-alert perfil-alert-error" role="alert">
          <AlertCircle size={18} />
          <span>{loadError ?? 'No se encontraron tus datos personales.'}</span>
        </div>
        <button type="button" className="btn btn-secondary" onClick={cargarPerfil}>
          <RefreshCw size={16} />
          <span>Reintentar</span>
        </button>
      </div>
    );
  }

  const esPaciente = perfil.rol === 'PACIENTE';

  return (
    <div className="perfil-container">
      <div className="page-header">
        <div>
          <h1 className="page-header-title">Mi Perfil</h1>
          <p className="page-header-desc">
            Consultá y actualizá tus datos personales. El email y la matrícula no se pueden modificar desde aquí.
          </p>
        </div>
      </div>

      {success && (
        <div className="perfil-alert perfil-alert-success" role="status">
          <CheckCircle size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* ── Datos personales ── */}
      <div className="card perfil-card">
        <div className="card-header">
          <div className="perfil-card-title">
            <span className="perfil-card-icon">
              <User size={18} />
            </span>
            <h2 className="card-title" style={{ fontSize: '1.1rem' }}>
              Datos personales
            </h2>
          </div>
          {!editing && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={empezarEdicion}>
              <Pencil size={14} />
              <span>Editar datos</span>
            </button>
          )}
        </div>

        {!editing ? (
          <div className="perfil-grid">
            <Dato label="Nombre" value={perfil.nombre} />
            <Dato label="Apellido" value={perfil.apellido} />
            <Dato label="Email" value={perfil.email} locked />
            <Dato label="Teléfono" value={perfil.telefono} />
            <Dato label="Tipo de documento" value={perfil.tipoDoc} />
            <Dato label="Número de documento" value={perfil.nroDocumento} />
            {perfil.rol === 'PACIENTE' ? (
              <>
                <Dato label="N° de paciente" value={perfil.nro_paciente} locked />
                <Dato label="Dirección" value={perfil.direccion} />
              </>
            ) : (
              <>
                <Dato label="Matrícula" value={perfil.nro_Matricula} locked />
                <Dato label="Especialidad" value={perfil.especialidad} />
              </>
            )}
          </div>
        ) : (
          <form onSubmit={handleGuardar}>
            {formError && (
              <div className="perfil-alert perfil-alert-error" role="alert">
                <AlertCircle size={18} />
                <span>{formError}</span>
              </div>
            )}

            <div className="form-row">
              <Campo id="perfil-nombre" label="Nombre *">
                <input
                  id="perfil-nombre"
                  type="text"
                  required
                  maxLength={50}
                  className="form-control"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
              </Campo>
              <Campo id="perfil-apellido" label="Apellido *">
                <input
                  id="perfil-apellido"
                  type="text"
                  required
                  maxLength={50}
                  className="form-control"
                  value={form.apellido}
                  onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                />
              </Campo>
            </div>

            <div className="form-row">
              <Campo id="perfil-email" label="Email" hint="No se puede modificar.">
                <input
                  id="perfil-email"
                  type="email"
                  readOnly
                  tabIndex={-1}
                  className="form-control"
                  value={perfil.email}
                />
              </Campo>
              <Campo id="perfil-telefono" label="Teléfono" hint="Dejalo vacío si no querés informar uno.">
                <input
                  id="perfil-telefono"
                  type="tel"
                  className="form-control"
                  placeholder="Ej: +54 9 341 555-1234"
                  pattern="[0-9+\s\(\)\-]{7,20}"
                  title="Entre 7 y 20 caracteres: números, espacios, +, - y paréntesis"
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                />
              </Campo>
            </div>

            <div className="form-row">
              <Campo id="perfil-tipodoc" label="Tipo de documento *">
                <select
                  id="perfil-tipodoc"
                  className="form-control"
                  value={form.tipoDoc}
                  onChange={(e) => setForm({ ...form, tipoDoc: e.target.value as TipoDocumento })}
                >
                  <option value="DNI">DNI</option>
                  <option value="Pasaporte">Pasaporte</option>
                </select>
              </Campo>
              <Campo id="perfil-nrodoc" label="Número de documento *">
                <input
                  id="perfil-nrodoc"
                  type="text"
                  required
                  pattern="[A-Za-z0-9]{7,20}"
                  title="Entre 7 y 20 letras o números, sin puntos ni espacios"
                  className="form-control"
                  value={form.nroDocumento}
                  onChange={(e) => setForm({ ...form, nroDocumento: e.target.value })}
                />
              </Campo>
            </div>

            {esPaciente ? (
              <div className="form-row">
                <Campo id="perfil-nropaciente" label="N° de paciente" hint="No se puede modificar.">
                  <input
                    id="perfil-nropaciente"
                    type="text"
                    readOnly
                    tabIndex={-1}
                    className="form-control"
                    value={perfil.rol === 'PACIENTE' ? perfil.nro_paciente : ''}
                  />
                </Campo>
                <Campo id="perfil-direccion" label="Dirección *">
                  <input
                    id="perfil-direccion"
                    type="text"
                    required
                    minLength={5}
                    maxLength={100}
                    className="form-control"
                    placeholder="Calle y N°, Barrio, Ciudad"
                    value={form.direccion}
                    onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                  />
                </Campo>
              </div>
            ) : (
              <div className="form-row">
                <Campo id="perfil-matricula" label="Matrícula" hint="No se puede modificar.">
                  <input
                    id="perfil-matricula"
                    type="text"
                    readOnly
                    tabIndex={-1}
                    className="form-control"
                    value={perfil.rol === 'ODONTOLOGO' ? perfil.nro_Matricula : ''}
                  />
                </Campo>
                <Campo id="perfil-especialidad" label="Especialidad *">
                  <input
                    id="perfil-especialidad"
                    type="text"
                    required
                    minLength={3}
                    maxLength={50}
                    className="form-control"
                    value={form.especialidad}
                    onChange={(e) => setForm({ ...form, especialidad: e.target.value })}
                  />
                </Campo>
              </div>
            )}

            <div className="perfil-actions">
              <button type="button" className="btn btn-secondary" onClick={cancelarEdicion} disabled={saving}>
                <X size={16} />
                <span>Cancelar</span>
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Save size={16} />
                <span>{saving ? 'Guardando...' : 'Guardar cambios'}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── Cambio de contraseña ── */}
      <div className="card perfil-card">
        <div className="card-header">
          <div className="perfil-card-title">
            <span className="perfil-card-icon">
              <KeyRound size={18} />
            </span>
            <h2 className="card-title" style={{ fontSize: '1.1rem' }}>
              Cambiar contraseña
            </h2>
          </div>
        </div>

        <form onSubmit={handleCambiarPassword}>
          {passwordError && (
            <div className="perfil-alert perfil-alert-error" role="alert">
              <AlertCircle size={18} />
              <span>{passwordError}</span>
            </div>
          )}
          {passwordSuccess && (
            <div className="perfil-alert perfil-alert-success" role="status">
              <CheckCircle size={18} />
              <span>{passwordSuccess}</span>
            </div>
          )}

          <Campo id="perfil-pw-actual" label="Contraseña actual *">
            <input
              id="perfil-pw-actual"
              type="password"
              required
              autoComplete="current-password"
              className="form-control"
              value={password.actual}
              onChange={(e) => setPassword({ ...password, actual: e.target.value })}
            />
          </Campo>

          <div className="form-row">
            <Campo id="perfil-pw-nueva" label="Nueva contraseña *" hint="Entre 6 y 72 caracteres.">
              <input
                id="perfil-pw-nueva"
                type="password"
                required
                minLength={6}
                maxLength={72}
                autoComplete="new-password"
                className="form-control"
                value={password.nueva}
                onChange={(e) => setPassword({ ...password, nueva: e.target.value })}
              />
            </Campo>
            <Campo id="perfil-pw-confirmar" label="Repetir nueva contraseña *">
              <input
                id="perfil-pw-confirmar"
                type="password"
                required
                minLength={6}
                maxLength={72}
                autoComplete="new-password"
                className="form-control"
                value={password.confirmar}
                onChange={(e) => setPassword({ ...password, confirmar: e.target.value })}
              />
            </Campo>
          </div>

          <div className="perfil-actions">
            <button type="submit" className="btn btn-primary" disabled={savingPassword}>
              <Lock size={16} />
              <span>{savingPassword ? 'Actualizando...' : 'Actualizar contraseña'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};