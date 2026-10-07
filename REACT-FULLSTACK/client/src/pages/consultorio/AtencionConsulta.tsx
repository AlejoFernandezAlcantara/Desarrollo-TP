import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Activity, 
  CheckCircle, 
  Plus, 
  Trash2, 
  User, 
  Shield, 
  Clock, 
  FileText,
  AlertCircle,
  Award
} from 'lucide-react';
import { reservasApi, practicasApi, detallesApi, dientesApi } from '../../services/api';
import { Reserva, Practica, Detalle, Diente, ResultadoReserva } from '../../types';
import { Odontograma } from './Odontograma';
import './Consultorio.css';

export const AtencionConsulta: React.FC = () => {
  const { idReserva } = useParams<{ idReserva: string }>();
  const reservaId = parseInt(idReserva || '0');
  const navigate = useNavigate();

  const [reserva, setReserva] = useState<Reserva | null>(null);
  const [practicas, setPracticas] = useState<Practica[]>([]);
  const [detalles, setDetalles] = useState<Detalle[]>([]);
  const [dientes, setDientes] = useState<Diente[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Practice registration form state (CUU 2)
  const [selectedPracticaId, setSelectedPracticaId] = useState<string>('');
  const [selectedDienteNumero, setSelectedDienteNumero] = useState<number | null>(null);
  const [practicaObservaciones, setPracticaObservaciones] = useState('');
  const [submittingPractica, setSubmittingPractica] = useState(false);

  // Finalize consultation form state
  const [resultado, setResultado] = useState<ResultadoReserva>('exitoso');
  const [cierreObservaciones, setCierreObservaciones] = useState('');
  const [submittingFinalizar, setSubmittingFinalizar] = useState(false);

  const fetchConsultaData = async () => {
    if (!reservaId) return;
    setLoading(true);
    try {
      const [res, pracs, dients, dets] = await Promise.all([
        reservasApi.getById(reservaId),
        practicasApi.getAll(),
        dientesApi.getAll().catch(() => []),
        detallesApi.getAll(reservaId)
      ]);
      setReserva(res);
      setPracticas(pracs);
      setDientes(dients);
      setDetalles(dets);

      if (pracs.length > 0 && !selectedPracticaId) {
        setSelectedPracticaId(pracs[0].id.toString());
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar la consulta');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsultaData();
  }, [reservaId]);

  // Manejar el registro de una práctica (CUU 2)
  const handleAddPractica = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservaId || !selectedPracticaId) return;
    setSubmittingPractica(true);
    setError(null);

    try {
      // Buscar ID del diente correspondiente al número si se seleccionó uno
      let dienteId: number | undefined = undefined;
      if (selectedDienteNumero) {
        const foundDiente = dientes.find(d => d.numero === selectedDienteNumero);
        dienteId = foundDiente ? foundDiente.id : selectedDienteNumero;
      }

      await detallesApi.create({
        reserva_id: reservaId,
        practica_id: parseInt(selectedPracticaId),
        diente_id: dienteId,
        observaciones: practicaObservaciones || undefined
      });

      setPracticaObservaciones('');
      setSelectedDienteNumero(null);
      // Recargar detalles
      const nuevosDetalles = await detallesApi.getAll(reservaId);
      setDetalles(nuevosDetalles);
    } catch (err: any) {
      alert(err.message || 'Error al registrar la práctica');
    } finally {
      setSubmittingPractica(false);
    }
  };

  const handleDeleteDetalle = async (id: number) => {
    if (!window.confirm('¿Eliminar esta práctica de la consulta?')) return;
    try {
      await detallesApi.delete(id);
      const nuevosDetalles = await detallesApi.getAll(reservaId);
      setDetalles(nuevosDetalles);
    } catch (err: any) {
      alert(err.message || 'Error al eliminar práctica');
    }
  };

  // Finalizar Consulta Médica
  const handleFinalizarConsulta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirm('¿Confirmas la finalización de esta atención clínica?')) return;
    setSubmittingFinalizar(true);
    try {
      await reservasApi.finalizar(reservaId, {
        resultado,
        observaciones: cierreObservaciones || undefined
      });
      fetchConsultaData();
    } catch (err: any) {
      alert(err.message || 'Error al finalizar consulta');
    } finally {
      setSubmittingFinalizar(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
        <span>Cargando datos del paciente y odontograma...</span>
      </div>
    );
  }

  if (error || !reserva) {
    return (
      <div className="card empty-state">
        <AlertCircle className="empty-state-icon" style={{ color: 'var(--danger)' }} />
        <h3>No se pudo cargar la consulta</h3>
        <p>{error || 'La reserva especificada no existe.'}</p>
        <Link to="/consultorio" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          Volver al Consultorio
        </Link>
      </div>
    );
  }

  const isFinalizada = reserva.estado === 'realizada';
  const paciente = reserva.paciente;
  const pacienteNombre = `${paciente?.usuario?.apellido}, ${paciente?.usuario?.nombre}`;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <Link to="/consultorio" className="btn btn-ghost btn-sm">
          <ArrowLeft size={16} />
          <span>Volver al Consultorio de Hoy</span>
        </Link>

        <span className={`badge ${isFinalizada ? 'badge-success' : 'badge-primary'}`} style={{ fontSize: '0.85rem' }}>
          Estado: {reserva.estado.toUpperCase()}
        </span>
      </div>

      {/* Banner de Consulta y Paciente */}
      <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(to right, #F9F1E4, #f1f5f9)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Paciente: {pacienteNombre}</h2>
              <span className="badge badge-secondary">HC #{paciente?.nro_paciente}</span>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              <span>{paciente?.tipoDoc}: <strong>{paciente?.nroDocumento}</strong></span>
              <span>•</span>
              <span>Cobertura: <strong>{reserva.mutual?.nombre || 'Particular'}</strong></span>
              <span>•</span>
              <span>Coseguro: <strong>${Number(reserva.coseguro || 0).toLocaleString('es-AR')}</strong></span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
              Dr./Dra. {reserva.odontologo?.usuario?.nombre} {reserva.odontologo?.usuario?.apellido}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>
              {reserva.odontologo?.especialidad} (Mat. {reserva.odontologo?.nro_Matricula})
            </div>
          </div>
        </div>

        {reserva.observaciones && (
          <div style={{ marginTop: '0.85rem', padding: '0.5rem 0.75rem', background: '#ffffff', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', fontSize: '0.85rem' }}>
            <strong>Motivo / Nota de admisión:</strong> {reserva.observaciones}
          </div>
        )}
      </div>

      {/* Odontograma Interactivo */}
      <Odontograma
        selectedDienteNumero={selectedDienteNumero}
        onSelectDiente={setSelectedDienteNumero}
        detalles={detalles}
      />

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Formulario Registrar Práctica (CUU 2) */}
        {!isFinalizada ? (
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title" style={{ fontSize: '1.15rem' }}>
                  Registrar Práctica en la Consulta
                </h3>
                <p className="card-subtitle">
                  Aplica tratamientos y asócialos al odontograma del paciente
                </p>
              </div>
            </div>

            <form onSubmit={handleAddPractica}>
              <div className="form-group">
                <label className="form-label">Pieza Dental Seleccionada</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div className="form-control" style={{ background: '#F9F1E4', fontWeight: 700, color: selectedDienteNumero ? 'var(--primary)' : 'var(--text-muted)' }}>
                    {selectedDienteNumero 
                      ? `Pieza N° ${selectedDienteNumero} (Seleccionada en odontograma)` 
                      : 'Práctica General (Sin diente específico)'}
                  </div>
                  {selectedDienteNumero && (
                    <button 
                      type="button" 
                      className="btn btn-ghost btn-sm"
                      onClick={() => setSelectedDienteNumero(null)}
                    >
                      Deseleccionar
                    </button>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Práctica Odontológica a Realizar *</label>
                <select
                  className="form-control"
                  required
                  value={selectedPracticaId}
                  onChange={(e) => setSelectedPracticaId(e.target.value)}
                >
                  {practicas.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.codigo}] {p.detalle} - ${Number(p.precio).toLocaleString('es-AR')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Observaciones Clínicas del Procedimiento</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Ej: Se aplica anestesia local y remoción de caries oclusal..."
                  value={practicaObservaciones}
                  onChange={(e) => setPracticaObservaciones(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={submittingPractica}
                style={{ width: '100%', marginTop: '0.75rem' }}
              >
                <Plus size={18} />
                <span>{submittingPractica ? 'Registrando...' : 'Registrar Práctica Realizada'}</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="card" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <Award size={28} style={{ color: '#16a34a' }} />
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#166534' }}>
                  Consulta Finalizada con Éxito
                </h3>
                <div style={{ fontSize: '0.85rem', color: '#15803d' }}>
                  Resultado registrado: <strong>{reserva.resultado?.toUpperCase()}</strong>
                </div>
              </div>
            </div>
            {reserva.observaciones && (
              <p style={{ fontSize: '0.9rem', color: '#166534', marginTop: '0.5rem' }}>
                {reserva.observaciones}
              </p>
            )}
          </div>
        )}

        {/* Listado de Prácticas Aplicadas en esta Consulta */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title" style={{ fontSize: '1.15rem' }}>
                Prácticas Aplicadas en Esta Sesión ({detalles.length})
              </h3>
              <p className="card-subtitle">Detalle de prestaciones cargadas a la reserva</p>
            </div>
          </div>

          {detalles.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Activity size={32} style={{ color: 'var(--text-subtle)', marginBottom: '0.5rem' }} />
              <p>Aún no se han registrado prácticas en esta consulta.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {detalles.map((d) => (
                <div
                  key={d.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.85rem',
                    background: '#F9F1E4',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span className="badge badge-primary">{d.practica?.codigo}</span>
                      <strong style={{ fontSize: '0.9rem' }}>{d.practica?.detalle}</strong>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {d.diente ? `Pieza Dental N° ${d.diente.numero}` : 'General / Sin pieza'}
                      {d.observaciones && ` • ${d.observaciones}`}
                    </div>
                  </div>

                  {!isFinalizada && (
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--danger)' }}
                      onClick={() => handleDeleteDetalle(d.id)}
                      title="Quitar práctica"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Botón de Cierre de Consulta */}
          {!isFinalizada && (
            <div style={{ marginTop: '1.75rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Finalizar Atención Médica
              </h4>

              <div className="form-group">
                <label className="form-label">Resultado de la Consulta *</label>
                <select
                  className="form-control"
                  value={resultado}
                  onChange={(e) => setResultado(e.target.value as ResultadoReserva)}
                >
                  <option value="exitoso">Exitoso / Tratamiento Completado</option>
                  <option value="requiere_seguimiento">Requiere Seguimiento / Nueva Cita</option>
                  <option value="no_asistio">Paciente No Asistió</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Conclusiones / Indicaciones al Paciente</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej: Se receta analgésico por 48hs. Control en 15 días."
                  value={cierreObservaciones}
                  onChange={(e) => setCierreObservaciones(e.target.value)}
                />
              </div>

              <button
                type="button"
                className="btn btn-success"
                onClick={handleFinalizarConsulta}
                disabled={submittingFinalizar}
                style={{ width: '100%', marginTop: '0.5rem' }}
              >
                <CheckCircle size={18} />
                <span>{submittingFinalizar ? 'Finalizando...' : 'Finalizar y Cerrar Consulta'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
