import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowRight, Calendar, Clock, RefreshCw } from 'lucide-react';
import { reservasApi } from '../../services/api';
import { Reserva } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { BackButton } from '../../components/BackButton';
import { diaAR, hoyAR, formatFecha, formatHora } from '../../utils/fecha';

// Inicio del turno asociado a la reserva (una reserva confirmada siempre tiene turno)
const inicioDeReserva = (r: Reserva): string | undefined => r.turnos?.[0]?.fecha_hora_inicio;

export const AtenderTurnos: React.FC = () => {
  const { user } = useAuth();
  const [turnosHoy, setTurnosHoy] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTurnos = async () => {
    setLoading(true);
    setError(null);
    try {
      // "Sin atender" = reserva confirmada (al atenderla pasa a "realizada", al cancelarla a "cancelada").
      // Solo las del propio odontólogo: se filtra acá y además lo fuerza el backend.
      const reservas = await reservasApi.getAll({
        odontologoId: user?.personaId,
        estado: 'confirmada'
      });

      const hoy = hoyAR();
      const deHoy = reservas
        .filter((r) => {
          const inicio = inicioDeReserva(r);
          return inicio !== undefined && diaAR(inicio) === hoy;
        })
        .sort(
          (a, b) =>
            new Date(inicioDeReserva(a) as string).getTime() -
            new Date(inicioDeReserva(b) as string).getTime()
        );

      setTurnosHoy(deHoy);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los turnos de hoy');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTurnos();
  }, [user?.personaId]);

  return (
    <div>
      <BackButton />
      <div className="page-header">
        <div>
          <h1 className="page-header-title">Atender Turnos</h1>
          <p className="page-header-desc">
            Turnos de hoy ({formatFecha(new Date(), { weekday: 'long', day: '2-digit', month: 'long' })}) pendientes de atención.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchTurnos} title="Recargar turnos">
          <RefreshCw size={16} />
          <span>Actualizar</span>
        </button>
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
      ) : turnosHoy.length === 0 ? (
        <div className="card empty-state">
          <Clock className="empty-state-icon" />
          <h3>No hay turnos sin atender para hoy</h3>
          <p>Los turnos que reserven los pacientes para hoy van a aparecer acá hasta que se atiendan.</p>
          <div style={{ marginTop: '1rem' }}>
            <Link to="/agenda" className="btn btn-secondary">
              <Calendar size={16} />
              <span>Ver Agenda</span>
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {turnosHoy.length} {turnosHoy.length === 1 ? 'turno sin atender' : 'turnos sin atender'}
          </div>

          <div className="grid-2">
            {turnosHoy.map((r) => {
              const inicio = inicioDeReserva(r) as string;
              const pacienteNombre = `${r.paciente?.usuario?.apellido}, ${r.paciente?.usuario?.nombre}`;

              return (
                <div
                  key={r.id_reserva}
                  className="card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderLeft: '4px solid var(--primary)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <Clock size={16} style={{ color: 'var(--primary)' }} />
                      <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>
                        {formatHora(inicio)} hs
                      </strong>
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

                  <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <Link to={`/consultorio/atender/${r.id_reserva}`} className="btn btn-primary btn-sm">
                      <Activity size={15} />
                      <span>Atender</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
