import React, { useEffect, useState } from 'react';
import { Plus, Search, Stethoscope, Link2, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { odontologosApi, mutualesApi } from '../../services/api';
import { Odontologo, Mutual, TipoDocumento } from '../../types';
import { Modal } from '../../components/Modal';

export const OdontologosPage: React.FC = () => {
  const [odontologos, setOdontologos] = useState<Odontologo[]>([]);
  const [mutuales, setMutuales] = useState<Mutual[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal Nuevo Odontólogo
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    nro_Matricula: '',
    especialidad: '',
    telefono: '',
    nroDocumento: '',
    tipoDoc: 'DNI' as TipoDocumento
  });

  // Modal Vincular Mutual
  const [isMutualModalOpen, setIsMutualModalOpen] = useState(false);
  const [selectedOdontologo, setSelectedOdontologo] = useState<Odontologo | null>(null);
  const [mutualFormData, setMutualFormData] = useState({
    mutual_id: '',
    nroAfiliado: ''
  });

  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [odos, muts] = await Promise.all([
        odontologosApi.getAll(),
        mutualesApi.getAll()
      ]);
      setOdontologos(odos);
      setMutuales(muts);
    } catch (err: any) {
      setError(err.message || 'Error al cargar profesionales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const closeCreateModal = () => {
    setIsModalOpen(false);
    setFormData((prev) => ({ ...prev, password: '' }));
    setShowPassword(false);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await odontologosApi.create({
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email,
        password: formData.password,
        nro_Matricula: parseInt(formData.nro_Matricula) || 0,
        especialidad: formData.especialidad,
        telefono: formData.telefono || undefined,
        nroDocumento: formData.nroDocumento,
        tipoDoc: formData.tipoDoc
      });
      setIsModalOpen(false);
      setFormData({
        nombre: '',
        apellido: '',
        email: '',
        password: '',
        nro_Matricula: '',
        especialidad: '',
        telefono: '',
        nroDocumento: '',
        tipoDoc: 'DNI'
      });
      setShowPassword(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error al registrar odontólogo');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenMutualModal = (odo: Odontologo) => {
    setSelectedOdontologo(odo);
    setMutualFormData({
      mutual_id: mutuales[0]?.id?.toString() || '',
      nroAfiliado: ''
    });
    setIsMutualModalOpen(true);
  };

  const handleMutualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOdontologo) return;
    setSubmitting(true);
    try {
      await odontologosApi.addMutual(selectedOdontologo.id, {
        mutual_id: parseInt(mutualFormData.mutual_id),
        nroAfiliado: mutualFormData.nroAfiliado
      });
      setIsMutualModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error al vincular obra social');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = odontologos.filter((o) => {
    const fullName = `${o.usuario?.nombre || ''} ${o.usuario?.apellido || ''} ${o.nombreCompleto || ''}`.toLowerCase();
    const matricula = o.nro_Matricula?.toString() || '';
    const especialidad = o.especialidad?.toLowerCase() || '';
    const term = searchTerm.toLowerCase();
    return fullName.includes(term) || matricula.includes(term) || especialidad.includes(term);
  });

  return (
    <div>
      <div className="admin-actions-bar">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="form-control search-input"
            placeholder="Buscar por nombre, especialidad o matrícula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={fetchData} title="Recargar">
            <RefreshCw size={16} />
          </button>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} />
            <span>Nuevo Odontólogo</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="badge badge-danger" style={{ padding: '0.75rem 1rem', width: '100%', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner" />
          <span>Cargando Odontólogos...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card empty-state">
          <Stethoscope className="empty-state-icon" />
          <h3>No se encontraron odontólogos</h3>
          <p>Registra profesionales para permitir agendamiento de turnos y atención clínica.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Profesional</th>
                <th>Matrícula</th>
                <th>Especialidad</th>
                <th>Contacto</th>
                <th>Obras Sociales Aceptadas</th>
                <th style={{ textAlign: 'right' }}>Vincular Mutual</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const nombre = o.nombreCompleto || `${o.usuario?.nombre} ${o.usuario?.apellido}`;
                return (
                  <tr key={o.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>Dr./Dra. {nombre}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{o.usuario?.email}</div>
                    </td>
                    <td>
                      <span className="badge badge-secondary">Matrícula: {o.nro_Matricula}</span>
                    </td>
                    <td>
                      <span className="badge badge-primary">{o.especialidad}</span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{o.telefono || 'Sin teléfono'}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Doc: {o.nroDocumento}</div>
                    </td>
                    <td>
                      {o.mutuales && o.mutuales.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                          {o.mutuales.map((om) => (
                            <span key={om.mutual_id} className="badge badge-success">
                              {om.mutual?.nombre} ({om.nroAfiliado})
                            </span>
                          ))}
                        </div>
                      ) : o.mutual ? (
                        <span className="badge badge-success">{o.mutual}</span>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ninguna</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenMutualModal(o)}
                        title="Vincular Obra Social"
                      >
                        <Link2 size={14} />
                        <span>Asignar Mutual</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Registrar Odontólogo */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeCreateModal}
        title="Registrar Nuevo Profesional Odontólogo"
      >
        <form onSubmit={handleCreateSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nombre *</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="Ej: Laura"
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
                placeholder="Ej: Giménez"
                value={formData.apellido}
                onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Correo Electrónico *</label>
            <input
              type="email"
              required
              className="form-control"
              placeholder="profesional@clinica.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="odontologo-password">Contraseña inicial *</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                id="odontologo-password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                maxLength={72}
                autoComplete="new-password"
                className="form-control"
                placeholder="Mínimo 6 caracteres"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nro. Matrícula Profesional *</label>
              <input
                type="number"
                required
                className="form-control"
                placeholder="Ej: 5412"
                value={formData.nro_Matricula}
                onChange={(e) => setFormData({ ...formData, nro_Matricula: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Especialidad *</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="Ej: Ortodoncia, Endodoncia, General"
                value={formData.especialidad}
                onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })}
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
              <label className="form-label">Nro. Documento *</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="Ej: 32456789"
                value={formData.nroDocumento}
                onChange={(e) => setFormData({ ...formData, nroDocumento: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Teléfono de Contacto</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ej: +54 9 351 1234567"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={closeCreateModal}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Guardando...' : 'Registrar Odontólogo'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Vincular Mutual */}
      <Modal
        isOpen={isMutualModalOpen}
        onClose={() => setIsMutualModalOpen(false)}
        title={`Vincular Mutual al Dr./Dra. ${selectedOdontologo?.usuario?.nombre || ''}`}
      >
        <form onSubmit={handleMutualSubmit}>
          <div className="form-group">
            <label className="form-label">Seleccionar Obra Social / Mutual *</label>
            <select
              className="form-control"
              required
              value={mutualFormData.mutual_id}
              onChange={(e) => setMutualFormData({ ...mutualFormData, mutual_id: e.target.value })}
            >
              {mutuales.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre} (CUIT: {m.cuit})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Nro. de Afiliado / Prestador ante la mutual *</label>
            <input
              type="text"
              required
              className="form-control"
              placeholder="Ej: AF-9944-OD"
              value={mutualFormData.nroAfiliado}
              onChange={(e) => setMutualFormData({ ...mutualFormData, nroAfiliado: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsMutualModalOpen(false)}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Guardando...' : 'Asignar Obra Social'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
