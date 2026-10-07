import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, 
  Clock, 
  User, 
  Stethoscope, 
  ArrowRight, 
  RefreshCw, 
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { reservasApi, odontologosApi } from '../../services/api';
import { Reserva, Odontologo } from '../../types';
import './Consultorio.css';

export const ConsultorioHoy: React.FC = () => {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [odontologos, setOdontologos] = useState<Odontologo[]>([]);
  const [selectedOdontologoId, setSelectedOdontologoId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConsultas = async () => {
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
      setError(err.message || 'Error al cargar pacientes del consultorio');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsultas();
  }, [selectedOdontologoId]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header-title">Consultorio Clínico & Atención</h1>
          <p className="page-header-desc">
            Panel de atención médica directa, registro de tratamientos en el odontograma y evolución del paciente.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchConsultas} title="Recargar">
          <RefreshCw size={16} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Selector de Profesional Activo */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Stethoscope size={18} style={{ color: 'var(--primary)' }} />
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Atendiendo como:</span>
          </div>

          <select
            className="form-control"
            style={{ maxWidth: '340px' }}
            value={selectedOdontologoId}
            onChange={(e) => setSelectedOdontologoId(e.target.value)}
          >
            <option value="">Todos los Odontólogos del Consultorio</option>
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
          <span>Cargando turnos de hoy...</span>
        </div>
      ) : reservas.length === 0 ? (
        <div className="card empty-state">
          <Clock className="empty-state-icon" />
          <h3>No hay pacientes agendados en espera de atención</h3>
          <p>Puedes reservar un turno desde el módulo de Agenda para comenzar la atención clínica.</p>
          <div style={{ marginTop: '1rem' }}>
            <Link to="/agenda/reservar" className="btn btn-primary">
              <Calendar size={16} />
              <span>Agendar Turno</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid-2">
          {reservas.map((r) => {
            const turno = r.turnos && r.turnos[0];
            const fechaStr = turno 
              ? new Date(turno.fecha_hora_inicio).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
              : '--:--';
            const fechaDia = turno
              ? new Date(turno.fecha_hora_inicio).toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: 'short' })
              : new Date(r.fecha_creacion).toLocaleDateString('es-AR');

            const pacienteNombre = `${r.paciente?.usuario?.apellido}, ${r.paciente?.usuario?.nombre}`;
            const isRealizada = r.estado === 'realizada';

            return (
              <div 
                key={r.id_reserva} 
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderLeft: isRealizada ? '4px solid var(--success)' : '4px solid var(--primary)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={16} style={{ color: 'var(--primary)' }} />
                      <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>
                        {fechaStr} hs ({fechaDia})
                      </strong>
                    </div>

                    <span className={`badge ${
                      isRealizada ? 'badge-success' :
                      r.estado === 'confirmada' ? 'badge-primary' :
                      r.estado === 'cancelada' ? 'badge-danger' : 'badge-warning'
                    }`}>
                      {r.estado}
                    </span>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      {pacienteNombre}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      DNI: {r.paciente?.nroDocumento} • Ficha HC #{r.paciente?.nro_paciente}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '0.25rem', fontWeight: 600 }}>
                      Mutual: {r.mutual?.nombre || 'Particular (Sin cobertura)'}
                    </div>
                  </div>

                  {r.observaciones && (
                    <div style={{ fontSize: '0.85rem', background: '#F9F1E4', padding: '0.5rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                      <strong>Motivo:</strong> {r.observaciones}
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Dr./Dra. {r.odontologo?.usuario?.nombre} {r.odontologo?.usuario?.apellido}
                  </span>

                  <Link
                    to={`/consultorio/atender/${r.id_reserva}`}
                    className={`btn btn-sm ${isRealizada ? 'btn-secondary' : 'btn-primary'}`}
                  >
                    <Activity size={15} />
                    <span>{isRealizada ? 'Ver Ficha / Odontograma' : 'Ingresar a Consulta'}</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
