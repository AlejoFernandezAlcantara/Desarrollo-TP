import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Search, 
  User, 
  Clock, 
  XCircle, 
  RefreshCw, 
  Stethoscope, 
  Activity,
  Filter
} from 'lucide-react';
import { reservasApi, odontologosApi } from '../../services/api';
import { Reserva, Odontologo } from '../../types';
import { Modal } from '../../components/Modal';
import './Agenda.css';

export const AgendaPage: React.FC = () => {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [odontologos, setOdontologos] = useState<Odontologo[]>([]);
  const [selectedOdontologoId, setSelectedOdontologoId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal Cancelar Reserva
  const [cancelingReserva, setCancelingReserva] = useState<Reserva | null>(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [submittingCancel, setSubmittingCancel] = useState(false);

  const fetchAgenda = async () => {
    setLoading(true);
    setError(null);
    try {
      const odoId = selectedOdontologoId ? parseInt(selectedOdontologoId) : undefined;
      const [resData, odoData] = await Promise.all([
        reservasApi.getAll({ odontologoId: odoId }),
        odontologosApi.getAll()
      ]);
      setReservas(resData);
      setOdontologos(odoData);
    } catch (err: any) {
      setError(err.message || 'Error al cargar la agenda');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgenda();
  }, [selectedOdontologoId]);

  const handleOpenCancel = (r: Reserva) => {
    setCancelingReserva(r);
    setMotivoCancelacion('');
  };

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelingReserva) return;
    setSubmittingCancel(true);
    try {
      await reservasApi.cancelar(cancelingReserva.id_reserva, motivoCancelacion);
      setCancelingReserva(null);
      fetchAgenda();
    } catch (err: any) {
      alert(err.message || 'Error al cancelar la reserva');
    } finally {
      setSubmittingCancel(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header-title">Agenda General de Turnos</h1>
          <p className="page-header-desc">
            Visualización y control de reservas programadas, cancelaciones y derivación a consultorio.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={fetchAgenda} title="Recargar agenda">
            <RefreshCw size={16} />
          </button>
          <Link to="/agenda/reservar" className="btn btn-primary">
            <Plus size={18} />
            <span>Reservar Turno </span>
          </Link>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={18} style={{ color: 'var(--primary)' }} />
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Filtrar por Profesional:</span>
          </div>

          <select
            className="form-control"
            style={{ maxWidth: '320px' }}
            value={selectedOdontologoId}
            onChange={(e) => setSelectedOdontologoId(e.target.value)}
          >
            <option value="">Todos los profesionales</option>
            {odontologos.map((o) => (
              <option key={o.id} value={o.id}>
                Dr./Dra. {o.nombreCompleto || `${o.usuario?.nombre} ${o.usuario?.apellido}`} ({o.especialidad})
              </option>
            ))}
          </select>
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
          <span>Cargando turnos agendados...</span>
        </div>
      ) : reservas.length === 0 ? (
        <div className="card empty-state">
          <CalendarIcon className="empty-state-icon" />
          <h3>No hay reservas de turnos registradas</h3>
          <p>Utiliza el botón superior para realizar la primera reserva guiada con un paciente.</p>
          <div style={{ marginTop: '1rem' }}>
            <Link to="/agenda/reservar" className="btn btn-primary">
              <Plus size={16} />
              <span>Iniciar Reserva </span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Horario & Fecha</th>
                <th>Paciente</th>
                <th>Odontólogo</th>
                <th>Mutual / Cobertura</th>
                <th>Coseguro</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reservas.map((r) => {
                const turno = r.turnos && r.turnos[0];
                const dateObj = turno ? new Date(turno.fecha_hora_inicio) : new Date(r.fecha_creacion);
                const fechaStr = dateObj.toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                });
                const horaStr = turno ? dateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '--:--';

                const pacienteNombre = `${r.paciente?.usuario?.apellido}, ${r.paciente?.usuario?.nombre}`;
                const odontologoNombre = r.odontologo 
                  ? `${r.odontologo.usuario?.nombre} ${r.odontologo.usuario?.apellido}`
                  : 'No especificado';

                return (
                  <tr key={r.id_reserva}>
                    <td>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                        {horaStr} hs
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {fechaStr}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                        {pacienteNombre}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        DNI: {r.paciente?.nroDocumento} • HC #{r.paciente?.nro_paciente}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>Dr./Dra. {odontologoNombre}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>
                        {r.odontologo?.especialidad}
                      </div>
                    </td>
                    <td>
                      {r.mutual ? (
                        <span className="badge badge-primary">{r.mutual.nombre}</span>
                      ) : (
                        <span className="badge badge-secondary">Particular</span>
                      )}
                    </td>
                    <td>
                      {r.coseguro ? (
                        <span style={{ fontWeight: 700, color: '#047857' }}>
                          ${Number(r.coseguro).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-subtle)' }}>$0.00</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${
                        r.estado === 'realizada' ? 'badge-success' :
                        r.estado === 'confirmada' ? 'badge-primary' :
                        r.estado === 'cancelada' ? 'badge-danger' : 'badge-warning'
                      }`}>
                        {r.estado}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        {r.estado === 'confirmada' && (
                          <>
                            <Link
                              to={`/consultorio/atender/${r.id_reserva}`}
                              className="btn btn-primary btn-sm"
                              title="Ingresar a la Consulta "
                            >
                              <Activity size={14} />
                              <span>Atender</span>
                            </Link>

                            <button
                              className="btn btn-ghost btn-sm"
                              style={{ color: 'var(--danger)' }}
                              onClick={() => handleOpenCancel(r)}
                              title="Cancelar Reserva"
                            >
                              <XCircle size={15} />
                            </button>
                          </>
                        )}

                        {r.estado === 'realizada' && (
                          <Link
                            to={`/consultorio/atender/${r.id_reserva}`}
                            className="btn btn-secondary btn-sm"
                            title="Ver Consulta Finalizada"
                          >
                            <Activity size={14} />
                            <span>Ver Detalles</span>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Cancelar Reserva */}
      <Modal
        isOpen={!!cancelingReserva}
        onClose={() => setCancelingReserva(null)}
        title="Cancelar Cita Odontológica"
      >
        <form onSubmit={handleConfirmCancel}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Al cancelar la reserva, el turno asignado volverá a estar automáticamente <strong>libre</strong> para otros pacientes en el sistema.
          </p>

          <div className="form-group">
            <label className="form-label">Motivo de la Cancelación (Opcional)</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ej: Paciente avisó con anticipación / Reprogramado"
              value={motivoCancelacion}
              onChange={(e) => setMotivoCancelacion(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setCancelingReserva(null)}
            >
              Volver
            </button>
            <button
              type="submit"
              className="btn btn-danger"
              disabled={submittingCancel}
            >
              {submittingCancel ? 'Cancelando...' : 'Confirmar Cancelación'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
