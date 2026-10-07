import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Shield, 
  Phone, 
  Mail, 
  MapPin, 
  Plus, 
  Trash2, 
  Activity, 
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { pacientesApi, mutualesApi, reservasApi } from '../../services/api';
import { Paciente, Mutual, Reserva } from '../../types';
import { Modal } from '../../components/Modal';
import './Recepcion.css';

export const PacienteDetalle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const pacienteId = parseInt(id || '0');

  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [mutuales, setMutuales] = useState<Mutual[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal para agregar otra mutual
  const [isMutualModalOpen, setIsMutualModalOpen] = useState(false);
  const [mutualFormData, setMutualFormData] = useState({
    mutual_id: '',
    nroAfiliado: '',
    cubre: '100'
  });
  const [submittingMutual, setSubmittingMutual] = useState(false);

  const fetchPacienteData = async () => {
    if (!pacienteId) return;
    setLoading(true);
    try {
      const [pacData, resData, mutData] = await Promise.all([
        pacientesApi.getById(pacienteId),
        reservasApi.getAll({ pacienteId }),
        mutualesApi.getAll()
      ]);
      setPaciente(pacData);
      setReservas(resData);
      setMutuales(mutData);
      if (mutData.length > 0) {
        setMutualFormData(prev => ({ ...prev, mutual_id: mutData[0].id.toString() }));
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar la ficha del paciente');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPacienteData();
  }, [pacienteId]);

  const handleAddMutual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteId) return;
    setSubmittingMutual(true);
    try {
      await pacientesApi.addMutual(pacienteId, {
        mutual_id: parseInt(mutualFormData.mutual_id),
        nroAfiliado: mutualFormData.nroAfiliado,
        cubre: parseInt(mutualFormData.cubre) || 0
      });
      setIsMutualModalOpen(false);
      setMutualFormData({ mutual_id: mutuales[0]?.id?.toString() || '', nroAfiliado: '', cubre: '100' });
      fetchPacienteData();
    } catch (err: any) {
      alert(err.message || 'Error al vincular obra social');
    } finally {
      setSubmittingMutual(false);
    }
  };

  const handleRemoveMutual = async (mutualId: number) => {
    if (!window.confirm('¿Desvincular esta obra social del paciente?')) return;
    try {
      await pacientesApi.removeMutual(pacienteId, mutualId);
      fetchPacienteData();
    } catch (err: any) {
      alert(err.message || 'Error al desvincular mutual');
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
        <span>Cargando Ficha Médica...</span>
      </div>
    );
  }

  if (error || !paciente) {
    return (
      <div className="card empty-state">
        <AlertTriangle className="empty-state-icon" style={{ color: 'var(--danger)' }} />
        <h3>Error al cargar ficha</h3>
        <p>{error || 'El paciente solicitado no existe.'}</p>
        <Link to="/recepcion" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          Volver al listado
        </Link>
      </div>
    );
  }

  const fullName = `${paciente.usuario?.nombre} ${paciente.usuario?.apellido}`;
  const initials = `${paciente.usuario?.nombre?.charAt(0) || ''}${paciente.usuario?.apellido?.charAt(0) || ''}`.toUpperCase();

  return (
    <div>
      <Link to="/recepcion" className="btn btn-ghost btn-sm" style={{ marginBottom: '1rem' }}>
        <ArrowLeft size={16} />
        <span>Volver a Pacientes</span>
      </Link>

      {/* Header Ficha Paciente */}
      <div className="card patient-detail-header">
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <div className="patient-avatar">{initials}</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{fullName}</h1>
              <span className="badge badge-secondary" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                Historia Clínica #{paciente.nro_paciente}
              </span>
            </div>
            <div className="patient-info-meta">
              <div className="patient-meta-item">
                <User size={15} />
                <span>{paciente.tipoDoc}: {paciente.nroDocumento}</span>
              </div>
              <div className="patient-meta-item">
                <Mail size={15} />
                <span>{paciente.usuario?.email}</span>
              </div>
              <div className="patient-meta-item">
                <Phone size={15} />
                <span>{paciente.telefono || 'Sin teléfono'}</span>
              </div>
              <div className="patient-meta-item">
                <MapPin size={15} />
                <span>{paciente.direccion}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to={`/agenda/reservar?pacienteId=${paciente.id}`} className="btn btn-primary">
            <Calendar size={18} />
            <span>Agendar Turno</span>
          </Link>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Panel Mutuales */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title" style={{ fontSize: '1.15rem' }}>Coberturas & Mutuales</h3>
              <p className="card-subtitle">Obras sociales asociadas a este paciente</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setIsMutualModalOpen(true)}>
              <Plus size={14} />
              <span>Vincular Mutual</span>
            </button>
          </div>

          {!paciente.mutuales || paciente.mutuales.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p>El paciente actualmente es particular (sin cobertura activa).</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {paciente.mutuales.map((pm) => (
                <div 
                  key={pm.mutual_id} 
                  style={{
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '0.85rem 1rem',
                    background: '#F9F1E4',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                      {pm.mutual?.nombre}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Afiliado: <strong>{pm.nroAfiliado}</strong> • Cobertura: <strong>{pm.cubre}%</strong>
                    </div>
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--danger)' }}
                    onClick={() => handleRemoveMutual(pm.mutual_id)}
                    title="Desvincular mutual"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel Historial de Turnos y Consultas */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title" style={{ fontSize: '1.15rem' }}>Historial Clínico de Consultas</h3>
              <p className="card-subtitle">Registro de turnos, atenciones y tratamientos realizados</p>
            </div>
          </div>

          {reservas.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Clock size={28} style={{ color: 'var(--text-subtle)', marginBottom: '0.5rem' }} />
              <p>No registra atenciones ni turnos agendados hasta la fecha.</p>
              <Link 
                to={`/agenda/reservar?pacienteId=${paciente.id}`} 
                className="btn btn-primary btn-sm" 
                style={{ marginTop: '0.75rem' }}
              >
                Crear primer turno
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {reservas.map((r) => {
                const odontologoNombre = r.odontologo 
                  ? `${r.odontologo.usuario?.nombre} ${r.odontologo.usuario?.apellido}`
                  : 'Profesional asignado';
                const fecha = new Date(r.fecha_creacion).toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                });

                return (
                  <div key={r.id_reserva} className="timeline-item">
                    <div className="timeline-dot" />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                          Consulta con Dr./Dra. {odontologoNombre}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {fecha} {r.turnos && r.turnos[0] && `• Turno N° ${r.turnos[0].codigo}`}
                        </div>
                      </div>

                      <span className={`badge ${
                        r.estado === 'realizada' ? 'badge-success' :
                        r.estado === 'confirmada' ? 'badge-primary' :
                        r.estado === 'cancelada' ? 'badge-danger' : 'badge-warning'
                      }`}>
                        {r.estado}
                      </span>
                    </div>

                    {r.observaciones && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem', background: '#F9F1E4', padding: '0.4rem 0.6rem', borderRadius: '4px' }}>
                        {r.observaciones}
                      </div>
                    )}

                    {r.detalles && r.detalles.length > 0 && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          Prácticas Realizadas:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.25rem' }}>
                          {r.detalles.map((d) => (
                            <span key={d.id} className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>
                              {d.practica?.codigo}: {d.practica?.detalle} {d.diente ? `(Diente #${d.diente.numero})` : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal Vincular Mutual */}
      <Modal
        isOpen={isMutualModalOpen}
        onClose={() => setIsMutualModalOpen(false)}
        title="Vincular Obra Social / Mutual al Paciente"
      >
        <form onSubmit={handleAddMutual}>
          <div className="form-group">
            <label className="form-label">Seleccionar Mutual *</label>
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

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nro. de Afiliado *</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="Ej: 9944-1234-88"
                value={mutualFormData.nroAfiliado}
                onChange={(e) => setMutualFormData({ ...mutualFormData, nroAfiliado: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Porcentaje Cobertura (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                className="form-control"
                placeholder="Ej: 80"
                value={mutualFormData.cubre}
                onChange={(e) => setMutualFormData({ ...mutualFormData, cubre: e.target.value })}
              />
            </div>
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
              disabled={submittingMutual}
            >
              {submittingMutual ? 'Guardando...' : 'Asignar Cobertura'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
