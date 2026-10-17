import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Plus,
  CalendarPlus,
  Search,
  User,
  Clock,
  XCircle,
  RefreshCw,
  Stethoscope,
  Activity,
  Filter,
  HeartHandshake,
  X
} from 'lucide-react';
import { reservasApi, odontologosApi, mutualesApi } from '../../services/api';
import { Reserva, Odontologo, Mutual } from '../../types';
import { Modal } from '../../components/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { BackButton } from '../../components/BackButton';
import './Agenda.css';
import { formatFecha, formatHora } from '../../utils/fecha';


export const AgendaPage: React.FC = () => {
  const { user } = useAuth();
  const esStaff = user?.rol === 'ODONTOLOGO' || user?.rol === 'ADMINISTRADOR';
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [odontologos, setOdontologos] = useState<Odontologo[]>([]);
  const [mutuales, setMutuales] = useState<Mutual[]>([]);
  const [selectedOdontologoId, setSelectedOdontologoId] = useState<string>('');
  const [selectedMutualId, setSelectedMutualId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal Cancelar Reserva
  const [cancelingReserva, setCancelingReserva] = useState<Reserva | null>(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [submittingCancel, setSubmittingCancel] = useState(false);

  // Cargar catálogo de mutuales
  useEffect(() => {
    mutualesApi.getAll().then(setMutuales).catch((err) => {
      console.error('Error cargando mutuales:', err);
    });
  }, []);

  const fetchAgenda = async () => {
    setLoading(true);
    setError(null);
    try {
      const odoId = selectedOdontologoId ? parseInt(selectedOdontologoId) : undefined;
      // Sólo el personal puede listar odontólogos (el paciente recibiría 403)
      const [resData, odoData] = await Promise.all([
        reservasApi.getAll({ odontologoId: odoId }),
        esStaff
          ? odontologosApi.getAll(
              selectedMutualId && selectedMutualId !== 'particular'
                ? parseInt(selectedMutualId)
                : undefined
            )
          : Promise.resolve([] as Odontologo[])
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

  // Si es staff y cambia la mutual seleccionada, acotar los profesionales a los que atienden esa mutual
  useEffect(() => {
    if (!esStaff) return;
    const mId = selectedMutualId && selectedMutualId !== 'particular' ? parseInt(selectedMutualId) : undefined;
    odontologosApi.getAll(mId).then((odos) => {
      setOdontologos(odos);
      if (selectedOdontologoId && !odos.some((o) => o.id === parseInt(selectedOdontologoId))) {
        setSelectedOdontologoId('');
      }
    }).catch(console.error);
  }, [selectedMutualId, esStaff]);

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

  // Filtrado de reservas en el cliente por mutual
  const reservasFiltradas = reservas.filter((r) => {
    if (selectedMutualId === 'particular') {
      return !r.mutual_id;
    }
    if (selectedMutualId) {
      return r.mutual_id === parseInt(selectedMutualId);
    }
    return true;
  });

  const hayFiltrosActivos = Boolean(selectedOdontologoId) || Boolean(selectedMutualId);

  const limpiarFiltros = () => {
    setSelectedOdontologoId('');
    setSelectedMutualId('');
  };

  return (
    <div>
      <BackButton />
      <div className="page-header">
        <div>
          <h1 className="page-header-title">Agenda de Turnos</h1>
          <p className="page-header-desc">
            Reservas programadas, cancelaciones y derivación a consultorio.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={fetchAgenda} title="Recargar agenda">
            <RefreshCw size={16} />
          </button>
          {esStaff && (
            <Link to="/agenda/turnos" className="btn btn-secondary">
              <CalendarPlus size={16} />
              <span>{user?.rol === 'ODONTOLOGO' ? 'Mis Turnos' : 'Generar Turnos'}</span>
            </Link>
          )}
          <Link to="/agenda/reservar" className="btn btn-primary">
            <Plus size={18} />
            <span>Reservar Turno</span>
          </Link>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          {/* Filtro por Obra Social (Mutual) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HeartHandshake size={18} style={{ color: 'var(--primary)' }} />
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Obra Social:</span>
            <select
              className="form-control"
              style={{ minWidth: '220px' }}
              value={selectedMutualId}
              onChange={(e) => setSelectedMutualId(e.target.value)}
            >
              <option value="">Todas las obras sociales</option>
              <option value="particular">Particular / Sin mutual</option>
              {mutuales.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Profesional (Staff) */}
          {esStaff && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={18} style={{ color: 'var(--primary)' }} />
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Profesional:</span>
              <select
                className="form-control"
                style={{ minWidth: '240px' }}
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
          )}

          {hayFiltrosActivos && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ color: 'var(--danger)', fontSize: '0.85rem' }}
              onClick={limpiarFiltros}
            >
              <X size={15} />
              <span>Limpiar filtros</span>
            </button>
          )}

          <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {reservasFiltradas.length} de {reservas.length} reservas
          </div>
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
          <div style={{ marginTop: '1rem' }}>
            <Link to="/agenda/reservar" className="btn btn-primary">
              <Plus size={16} />
              <span>Iniciar Reserva </span>
            </Link>
          </div>
        </div>
      ) : reservasFiltradas.length === 0 ? (
        <div className="card empty-state" style={{ padding: '3rem 2rem' }}>
          <HeartHandshake className="empty-state-icon" style={{ width: '3rem', height: '3rem' }} />
          <h3>No hay reservas que coincidan con los filtros</h3>
          <p style={{ maxWidth: '460px', margin: '0.5rem auto 1.5rem auto', color: 'var(--text-muted)' }}>
            No se encontraron turnos agendados para la combinación de obra social y profesional seleccionados.
          </p>
          <button type="button" className="btn btn-secondary" onClick={limpiarFiltros}>
            Restablecer filtros
          </button>
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
              {reservasFiltradas.map((r) => {

                const turno = r.turnos && r.turnos[0];
                                const fechaRef = turno ? turno.fecha_hora_inicio : r.fecha_creacion;
                const fechaStr = formatFecha(fechaRef, {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                });
                const horaStr = turno ? formatHora(turno.fecha_hora_inicio) : '--:--';

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
                      <span className={`badge ${r.estado === 'realizada' ? 'badge-success' :
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
