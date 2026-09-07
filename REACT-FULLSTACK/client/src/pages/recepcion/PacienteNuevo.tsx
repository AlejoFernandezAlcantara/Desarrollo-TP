import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, UserPlus, Shield, User, FileText } from 'lucide-react';
import { pacientesApi, mutualesApi } from '../../services/api';
import { Mutual, TipoDocumento } from '../../types';
import './Recepcion.css';

export const PacienteNuevo: React.FC = () => {
  const navigate = useNavigate();
  const [mutuales, setMutuales] = useState<Mutual[]>([]);
  const [loadingMutuales, setLoadingMutuales] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    nro_paciente: '',
    direccion: '',
    telefono: '',
    nroDocumento: '',
    tipoDoc: 'DNI' as TipoDocumento,
    hasMutual: false,
    mutual_id: '',
    nroAfiliado: '',
    cubre: '100'
  });

  useEffect(() => {
    const loadMutuales = async () => {
      try {
        const data = await mutualesApi.getAll();
        setMutuales(data);
        if (data.length > 0) {
          setFormData((prev) => ({ ...prev, mutual_id: data[0].id.toString() }));
        }
      } catch (err) {
        console.error('Error cargando mutuales:', err);
      } finally {
        setLoadingMutuales(false);
      }
    };
    loadMutuales();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload: any = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email,
        nro_paciente: parseInt(formData.nro_paciente) || Math.floor(1000 + Math.random() * 9000),
        direccion: formData.direccion,
        telefono: formData.telefono || undefined,
        nroDocumento: formData.nroDocumento,
        tipoDoc: formData.tipoDoc
      };

      if (formData.hasMutual && formData.mutual_id) {
        payload.mutual_id = parseInt(formData.mutual_id);
        payload.nroAfiliado = formData.nroAfiliado;
        payload.cubre = parseInt(formData.cubre) || 100;
      }

      const nuevoPaciente = await pacientesApi.create(payload);
      navigate(`/recepcion/paciente/${nuevoPaciente.id}`);
    } catch (err: any) {
      setError(err.message || 'Error al dar de alta al paciente.');
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/recepcion" className="btn btn-ghost btn-sm" style={{ marginBottom: '0.75rem' }}>
          <ArrowLeft size={16} />
          <span>Volver al Padrón de Pacientes</span>
        </Link>
        <h1 className="page-header-title">Alta de Nuevo Paciente</h1>
        <p className="page-header-desc">
          Registra los datos personales, crea la Historia Clínica y su Odontograma inicial automáticamente.
        </p>
      </div>

      {error && (
        <div className="badge badge-danger" style={{ padding: '0.85rem 1rem', width: '100%', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Datos Personales */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User className="stat-icon-wrapper" size={20} style={{ color: 'var(--primary)', width: 32, height: 32, background: 'var(--primary-light)' }} />
              <h3 className="card-title" style={{ fontSize: '1.1rem' }}>Datos Personales & Contacto</h3>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nombre *</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="Ej: Sofía"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Apellido *</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="Ej: Martínez"
                value={formData.apellido}
                onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tipo Documento *</label>
              <select
                className="form-control"
                value={formData.tipoDoc}
                onChange={(e) => setFormData({ ...formData, tipoDoc: e.target.value as TipoDocumento })}
              >
                <option value="DNI">DNI</option>
                <option value="Pasaporte">Pasaporte</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Número de Documento *</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="Ej: 38765432"
                value={formData.nroDocumento}
                onChange={(e) => setFormData({ ...formData, nroDocumento: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Correo Electrónico *</label>
              <input
                type="email"
                required
                className="form-control"
                placeholder="paciente@correo.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Teléfono de Contacto</label>
              <input
                type="tel"
                className="form-control"
                placeholder="Ej: +54 9 351 987654"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Dirección / Domicilio *</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="Calle y N°, Barrio, Ciudad"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">N° Ficha / HC (Opcional)</label>
              <input
                type="number"
                className="form-control"
                placeholder="Autogenerado"
                value={formData.nro_paciente}
                onChange={(e) => setFormData({ ...formData, nro_paciente: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Cobertura / Mutual */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield className="stat-icon-wrapper" size={20} style={{ color: '#0f766e', width: 32, height: 32, background: '#f0fdfa' }} />
              <h3 className="card-title" style={{ fontSize: '1.1rem' }}>Obra Social & Cobertura</h3>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={formData.hasMutual}
                onChange={(e) => setFormData({ ...formData, hasMutual: e.target.checked })}
              />
              <span>Posee Mutual / Obra Social</span>
            </label>
          </div>

          {formData.hasMutual && (
            <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
              {mutuales.length === 0 ? (
                <div style={{ padding: '1rem', background: '#fffbeb', borderRadius: 'var(--radius-md)', color: '#b45309', fontSize: '0.85rem' }}>
                  No hay mutuales registradas aún en el sistema. Puedes registrarlas previamente en el Módulo de Administración.
                </div>
              ) : (
                <div className="form-row">
                  <div className="form-group" style={{ flex: 1.5 }}>
                    <label className="form-label">Obra Social / Mutual *</label>
                    <select
                      className="form-control"
                      value={formData.mutual_id}
                      onChange={(e) => setFormData({ ...formData, mutual_id: e.target.value })}
                    >
                      {mutuales.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nombre} (CUIT: {m.cuit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ flex: 1.5 }}>
                    <label className="form-label">Nro. de Afiliado *</label>
                    <input
                      type="text"
                      required={formData.hasMutual}
                      className="form-control"
                      placeholder="Ej: 001-998877/2"
                      value={formData.nroAfiliado}
                      onChange={(e) => setFormData({ ...formData, nroAfiliado: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Cobertura (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="form-control"
                      placeholder="Ej: 80"
                      value={formData.cubre}
                      onChange={(e) => setFormData({ ...formData, cubre: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Acciones */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <Link to="/recepcion" className="btn btn-secondary">
            Cancelar
          </Link>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            <UserPlus size={18} />
            <span>{submitting ? 'Creando Paciente...' : 'Guardar y Abrir Ficha'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
