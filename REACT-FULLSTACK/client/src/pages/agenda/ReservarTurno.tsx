import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Calendar, 
  User, 
  Clock, 
  Shield, 
  Stethoscope, 
  CheckCircle2, 
  Plus, 
  AlertCircle 
} from 'lucide-react';
import { odontologosApi, turnosApi, pacientesApi, reservasApi } from '../../services/api';
import { Odontologo, Turno, Paciente } from '../../types';
import { Modal } from '../../components/Modal';
import './Agenda.css';

export const ReservarTurno: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPacienteId = searchParams.get('pacienteId');

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Data State
  const [odontologos, setOdontologos] = useState<Odontologo[]>([]);
  const [turnosDisponibles, setTurnosDisponibles] = useState<Turno[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  
  // Selection State
  const [selectedOdontologo, setSelectedOdontologo] = useState<Odontologo | null>(null);
  const [selectedTurno, setSelectedTurno] = useState<Turno | null>(null);
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);
  
  // Confirmation form
  const [selectedMutualId, setSelectedMutualId] = useState<string>('');
  const [observaciones, setObservaciones] = useState('');
  const [coseguro, setCoseguro] = useState('');

  // Aux & UI State
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pacienteSearch, setPacienteSearch] = useState('');

  // Modal para habilitar nuevos turnos libres en caso de que no haya
  const [isGenerarTurnoModalOpen, setIsGenerarTurnoModalOpen] = useState(false);
  const [nuevoTurnoData, setNuevoTurnoData] = useState({
    fecha_hora_inicio: '',
    duracion: '30'
  });

  // 1. Cargar odontólogos y pacientes inicialmente
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        const [odos, pacs] = await Promise.all([
          odontologosApi.getAll(),
          pacientesApi.getAll()
        ]);
        setOdontologos(odos);
        setPacientes(pacs);

        // Si vino un paciente preseleccionado desde la ficha o url
        if (preselectedPacienteId) {
          const found = pacs.find(p => p.id === parseInt(preselectedPacienteId));
          if (found) {
            setSelectedPaciente(found);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Error al inicializar datos para reserva');
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [preselectedPacienteId]);

  // 2. Al seleccionar un odontólogo, buscar sus turnos libres
  const handleSelectOdontologo = async (odo: Odontologo) => {
    setSelectedOdontologo(odo);
    setSelectedTurno(null);
    setLoading(true);
    try {
      const turnos = await turnosApi.getDisponibles(odo.id);
      setTurnosDisponibles(turnos);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Error al obtener turnos disponibles');
    } finally {
      setLoading(false);
    }
  };

  // 3. Crear un bloque de turno libre si no hay turnos
  const handleCrearTurnoLibre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOdontologo) return;
    try {
      await turnosApi.create({
        odontologo_id: selectedOdontologo.id,
        fecha_hora_inicio: new Date(nuevoTurnoData.fecha_hora_inicio).toISOString(),
        duracion: parseInt(nuevoTurnoData.duracion) || 30
      });
      setIsGenerarTurnoModalOpen(false);
      // Recargar turnos
      const turnos = await turnosApi.getDisponibles(selectedOdontologo.id);
      setTurnosDisponibles(turnos);
    } catch (err: any) {
      alert(err.message || 'Error al crear turno libre');
    }
  };

  // 4. Seleccionar Turno
  const handleSelectTurno = (t: Turno) => {
    setSelectedTurno(t);
    // Si ya teníamos un paciente seleccionado de antemano, pasamos a confirmación
    if (selectedPaciente) {
      setStep(4);
    } else {
      setStep(3);
    }
  };

  // 5. Seleccionar Paciente
  const handleSelectPaciente = (p: Paciente) => {
    setSelectedPaciente(p);
    if (p.mutuales && p.mutuales.length > 0) {
      setSelectedMutualId(p.mutuales[0].mutual_id.toString());
    } else {
      setSelectedMutualId('');
    }
    setStep(4);
  };

  // 6. Confirmar Reserva Final (CUU 1)
  const handleConfirmarReserva = async () => {
    if (!selectedPaciente || !selectedTurno) return;
    setSubmitting(true);
    setError(null);

    try {
      await reservasApi.create({
        paciente_id: selectedPaciente.id,
        turno_codigo: selectedTurno.codigo,
        mutual_id: selectedMutualId ? parseInt(selectedMutualId) : undefined,
        observaciones: observaciones || undefined,
        coseguro: coseguro ? parseFloat(coseguro) : undefined
      });

      navigate('/agenda');
    } catch (err: any) {
      setError(err.message || 'Error al confirmar la reserva.');
      setSubmitting(false);
    }
  };

  const filteredPacientes = pacientes.filter(p => {
    const term = pacienteSearch.toLowerCase();
    const fullName = `${p.usuario?.nombre} ${p.usuario?.apellido}`.toLowerCase();
    const doc = p.nroDocumento || '';
    return fullName.includes(term) || doc.includes(term);
  });

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-header-title">Reservar Turno Odontológico</h1>
          <p className="page-header-desc">
            Flujo guiado para asignar un turno disponible con un profesional odontólogo y confirmar la cita médica.
          </p>
        </div>
        <Link to="/agenda" className="btn btn-secondary btn-sm">
          Ver Agenda Completa
        </Link>
      </div>

      {/* Stepper Indicator */}
      <div className="card" style={{ marginBottom: '2rem', padding: '1.25rem 1.5rem' }}>
        <div className="stepper">
          <div 
            className={`step-item ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}`}
            onClick={() => setStep(1)}
          >
            <div className="step-circle">
              {step > 1 ? <Check size={18} /> : '1'}
            </div>
            <span className="step-label">Odontólogo</span>
          </div>

          <div 
            className={`step-item ${step === 2 ? 'active' : step > 2 ? 'completed' : ''}`}
            onClick={() => selectedOdontologo && setStep(2)}
          >
            <div className="step-circle">
              {step > 2 ? <Check size={18} /> : '2'}
            </div>
            <span className="step-label">Turno Libre</span>
          </div>

          <div 
            className={`step-item ${step === 3 ? 'active' : step > 3 ? 'completed' : ''}`}
            onClick={() => selectedTurno && setStep(3)}
          >
            <div className="step-circle">
              {step > 3 ? <Check size={18} /> : '3'}
            </div>
            <span className="step-label">Paciente</span>
          </div>

          <div className={`step-item ${step === 4 ? 'active' : ''}`}>
            <div className="step-circle">4</div>
            <span className="step-label">Confirmación</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="badge badge-danger" style={{ padding: '0.85rem 1rem', width: '100%', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {/* PASO 1: SELECCIONAR ODONTÓLOGO */}
      {step === 1 && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Paso 1: Selecciona el Profesional</h3>
              <p className="card-subtitle">Elige el odontólogo con quien se realizará la consulta</p>
            </div>
          </div>

          {loading ? (
            <div className="loading-spinner">
              <div className="spinner" />
              <span>Cargando profesionales...</span>
            </div>
          ) : odontologos.length === 0 ? (
            <div className="empty-state">
              <Stethoscope className="empty-state-icon" />
              <h3>No hay odontólogos registrados</h3>
              <p>Debes registrar al menos un profesional en el panel de administración.</p>
            </div>
          ) : (
            <div className="selection-grid">
              {odontologos.map((odo) => {
                const nombre = odo.nombreCompleto || `${odo.usuario?.nombre} ${odo.usuario?.apellido}`;
                const isSelected = selectedOdontologo?.id === odo.id;
                return (
                  <div
                    key={odo.id}
                    className={`selectable-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectOdontologo(odo)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <Stethoscope size={18} style={{ color: 'var(--primary)' }} />
                      <span className="badge badge-primary">{odo.especialidad}</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                      Dr./Dra. {nombre}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Matrícula: {odo.nro_Matricula}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* PASO 2: SELECCIONAR TURNO LIBRE */}
      {step === 2 && selectedOdontologo && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Paso 2: Turnos Libres Disponibles</h3>
              <p className="card-subtitle">
                Profesional: <strong>Dr./Dra. {selectedOdontologo.nombreCompleto || selectedOdontologo.usuario?.nombre}</strong> ({selectedOdontologo.especialidad})
              </p>
            </div>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setIsGenerarTurnoModalOpen(true)}
            >
              <Plus size={16} />
              <span>Habilitar Nuevo Horario</span>
            </button>
          </div>

          {turnosDisponibles.length === 0 ? (
            <div className="empty-state">
              <Clock className="empty-state-icon" />
              <h3>No hay turnos libres actualmente para este profesional</h3>
              <p>Puedes crear un nuevo bloque de turno disponible ahora mismo.</p>
              <button 
                className="btn btn-primary" 
                style={{ marginTop: '1rem' }}
                onClick={() => setIsGenerarTurnoModalOpen(true)}
              >
                <Plus size={16} />
                <span>Generar Turno Libre</span>
              </button>
            </div>
          ) : (
            <div className="selection-grid">
              {turnosDisponibles.map((t) => {
                const dateObj = new Date(t.fecha_hora_inicio);
                const fecha = dateObj.toLocaleDateString('es-AR', {
                  weekday: 'short',
                  day: '2-digit',
                  month: 'short'
                });
                const hora = dateObj.toLocaleTimeString('es-AR', {
                  hour: '2-digit',
                  minute: '2-digit'
                });
                const isSelected = selectedTurno?.codigo === t.codigo;

                return (
                  <div
                    key={t.codigo}
                    className={`selectable-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectTurno(t)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="badge badge-success">Libre</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.duracion} min</span>
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                      {hora} hs
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                      {fecha}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-start' }}>
            <button className="btn btn-ghost" onClick={() => setStep(1)}>
              <ChevronLeft size={16} />
              <span>Cambiar Odontólogo</span>
            </button>
          </div>
        </div>
      )}

      {/* PASO 3: SELECCIONAR PACIENTE */}
      {step === 3 && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Paso 3: Selecciona el Paciente</h3>
              <p className="card-subtitle">Busca el paciente en el padrón o da de alta uno nuevo</p>
            </div>
            <Link to="/recepcion/nuevo" className="btn btn-secondary btn-sm" target="_blank">
              <Plus size={16} />
              <span>Alta Rápida de Paciente</span>
            </Link>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Escribe el nombre o documento para filtrar..."
              value={pacienteSearch}
              onChange={(e) => setPacienteSearch(e.target.value)}
            />
          </div>

          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {filteredPacientes.map((p) => {
              const isSelected = selectedPaciente?.id === p.id;
              const primaryMutual = p.mutuales && p.mutuales[0];
              return (
                <div
                  key={p.id}
                  className={`selectable-card ${isSelected ? 'selected' : ''}`}
                  style={{ marginBottom: '0.5rem', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                  onClick={() => handleSelectPaciente(p)}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                      {p.usuario?.apellido}, {p.usuario?.nombre}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {p.tipoDoc}: {p.nroDocumento} • HC #{p.nro_paciente}
                    </div>
                  </div>

                  {primaryMutual ? (
                    <span className="badge badge-primary">{primaryMutual.mutual?.nombre}</span>
                  ) : (
                    <span className="badge badge-secondary">Particular</span>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-start' }}>
            <button className="btn btn-ghost" onClick={() => setStep(2)}>
              <ChevronLeft size={16} />
              <span>Cambiar Turno</span>
            </button>
          </div>
        </div>
      )}

      {/* PASO 4: CONFIRMACIÓN Y RESERVA */}
      {step === 4 && selectedOdontologo && selectedTurno && selectedPaciente && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Paso 4: Confirmar y Registrar Reserva</h3>
              <p className="card-subtitle">Verifica los datos antes de emitir la cita médica</p>
            </div>
          </div>

          <div className="grid-2" style={{ marginBottom: '1.5rem', background: '#F9F1E4', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Profesional Odontólogo
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', marginTop: '0.2rem' }}>
                Dr./Dra. {selectedOdontologo.nombreCompleto || selectedOdontologo.usuario?.nombre}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
                {selectedOdontologo.especialidad} (Mat. {selectedOdontologo.nro_Matricula})
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Fecha y Hora Cita
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', marginTop: '0.2rem' }}>
                {new Date(selectedTurno.fecha_hora_inicio).toLocaleDateString('es-AR', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 700 }}>
                {new Date(selectedTurno.fecha_hora_inicio).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs ({selectedTurno.duracion} min)
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Paciente Citado
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', marginTop: '0.2rem' }}>
                {selectedPaciente.usuario?.apellido}, {selectedPaciente.usuario?.nombre}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {selectedPaciente.tipoDoc}: {selectedPaciente.nroDocumento} • HC #{selectedPaciente.nro_paciente}
              </div>
            </div>

            <div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>
                  Mutual a Imputar
                </label>
                <select
                  className="form-control"
                  value={selectedMutualId}
                  onChange={(e) => setSelectedMutualId(e.target.value)}
                >
                  <option value="">Particular / Sin Mutual</option>
                  {selectedPaciente.mutuales?.map((pm) => (
                    <option key={pm.mutual_id} value={pm.mutual_id}>
                      {pm.mutual?.nombre} (Af: {pm.nroAfiliado})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Coseguro a Cobrar ($ Opcional)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-control"
                placeholder="Ej: 1500.00"
                value={coseguro}
                onChange={(e) => setCoseguro(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Motivo de la consulta / Observaciones</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej: Limpieza general, dolor en molar superior, etc."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem' }}>
            <button className="btn btn-ghost" onClick={() => setStep(3)}>
              <ChevronLeft size={16} />
              <span>Modificar Paciente</span>
            </button>

            <button
              className="btn btn-success"
              onClick={handleConfirmarReserva}
              disabled={submitting}
              style={{ padding: '0.75rem 1.75rem', fontSize: '1rem' }}
            >
              <CheckCircle2 size={18} />
              <span>{submitting ? 'Emitiendo Reserva...' : 'Confirmar Reserva de Turno'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal Habilitar Turno Libre */}
      <Modal
        isOpen={isGenerarTurnoModalOpen}
        onClose={() => setIsGenerarTurnoModalOpen(false)}
        title={`Habilitar Nuevo Turno Libre con Dr./Dra. ${selectedOdontologo?.usuario?.nombre || ''}`}
      >
        <form onSubmit={handleCrearTurnoLibre}>
          <div className="form-group">
            <label className="form-label">Fecha y Hora de Inicio *</label>
            <input
              type="datetime-local"
              required
              className="form-control"
              value={nuevoTurnoData.fecha_hora_inicio}
              onChange={(e) => setNuevoTurnoData({ ...nuevoTurnoData, fecha_hora_inicio: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Duración del Turno (Minutos) *</label>
            <select
              className="form-control"
              value={nuevoTurnoData.duracion}
              onChange={(e) => setNuevoTurnoData({ ...nuevoTurnoData, duracion: e.target.value })}
            >
              <option value="15">15 minutos</option>
              <option value="30">30 minutos (Estándar)</option>
              <option value="45">45 minutos</option>
              <option value="60">60 minutos (1 hora)</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsGenerarTurnoModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Crear Horario Libre
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
