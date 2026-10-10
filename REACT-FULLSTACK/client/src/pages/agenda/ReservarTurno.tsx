import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Check,
  ChevronLeft,
  Clock,
  Stethoscope,
  CheckCircle2,
  Plus
} from 'lucide-react';
import { odontologosApi, turnosApi, pacientesApi, reservasApi } from '../../services/api';
import { Odontologo, Turno, Paciente } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Modal } from '../../components/Modal';
import './Agenda.css';

type Step = 'odontologo' | 'turno' | 'paciente' | 'confirmacion';

// El paciente se reserva a sí mismo: no necesita el paso "Paciente".
const STEPS_PACIENTE: { key: Step; label: string }[] = [
  { key: 'odontologo', label: 'Odontólogo' },
  { key: 'turno', label: 'Turno' },
  { key: 'confirmacion', label: 'Confirmación' }
];

// El personal (admin) reserva en nombre de un paciente.
const STEPS_STAFF: { key: Step; label: string }[] = [
  { key: 'odontologo', label: 'Odontólogo' },
  { key: 'turno', label: 'Turno Libre' },
  { key: 'paciente', label: 'Paciente' },
  { key: 'confirmacion', label: 'Confirmación' }
];

export const ReservarTurno: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPacienteId = searchParams.get('pacienteId');

  const { user } = useAuth();
  const rol = user?.rol;
  const personaId = user?.personaId;
  const esPaciente = rol === 'PACIENTE';
  const esAdmin = rol === 'ADMINISTRADOR';

  const steps = esPaciente ? STEPS_PACIENTE : STEPS_STAFF;
  const [step, setStep] = useState<Step>('odontologo');

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

  // Modal para habilitar nuevos turnos libres (solo administrador)
  const [isGenerarTurnoModalOpen, setIsGenerarTurnoModalOpen] = useState(false);
  const [nuevoTurnoData, setNuevoTurnoData] = useState({
    fecha_hora_inicio: '',
    duracion: '30'
  });

  // Fija el paciente de la reserva y preselecciona su primera mutual
  const aplicarPaciente = (p: Paciente) => {
    setSelectedPaciente(p);
    setSelectedMutualId(p.mutuales && p.mutuales.length > 0 ? p.mutuales[0].mutual_id.toString() : '');
  };

  // 1. Carga inicial según el rol
  useEffect(() => {
    if (!rol) return;

    const initData = async () => {
      setLoading(true);
      setError(null);
      try {
        const odos = await odontologosApi.getAll();
        setOdontologos(odos);

        if (rol === 'PACIENTE') {
          // El paciente solo necesita sus propios datos (mutuales incluidas)
          if (personaId == null) {
            throw new Error('Tu usuario no tiene un perfil de paciente asociado.');
          }
          aplicarPaciente(await pacientesApi.getById(personaId));
        } else {
          // El personal necesita el padrón para elegir a quién reservarle
          const pacs = await pacientesApi.getAll();
          setPacientes(pacs);

          if (preselectedPacienteId) {
            const found = pacs.find((p) => p.id === parseInt(preselectedPacienteId));
            if (found) aplicarPaciente(found);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Error al inicializar datos para la reserva');
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [rol, personaId, preselectedPacienteId]);

  // 2. Al seleccionar un odontólogo, buscar sus turnos libres
  const handleSelectOdontologo = async (odo: Odontologo) => {
    setSelectedOdontologo(odo);
    setSelectedTurno(null);
    setError(null);
    setLoading(true);
    try {
      const turnos = await turnosApi.getDisponibles(odo.id);
      setTurnosDisponibles(turnos);
      setStep('turno');
    } catch (err: any) {
      setError(err.message || 'Error al obtener turnos disponibles');
    } finally {
      setLoading(false);
    }
  };

  const getMinDateTimeLocal = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  };

  // 3. Crear un bloque de turno libre (solo administrador)
  const handleCrearTurnoLibre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOdontologo) return;
    try {
      const fechaHora = new Date(nuevoTurnoData.fecha_hora_inicio);
      if (isNaN(fechaHora.getTime())) {
        alert('Fecha u hora inválida');
        return;
      }
      if (fechaHora.getTime() <= Date.now()) {
        alert('No se puede crear un turno con fecha u hora en el pasado. Seleccioná una fecha y hora futura.');
        return;
      }

      const duracion = parseInt(nuevoTurnoData.duracion) || 30;
      const fechaFin = new Date(fechaHora.getTime() + duracion * 60 * 1000);
      const superpuesto = turnosDisponibles.find((t) => {
        const tStart = new Date(t.fecha_hora_inicio);
        const tEnd = new Date(tStart.getTime() + t.duracion * 60 * 1000);
        return fechaHora < tEnd && fechaFin > tStart;
      });
      if (superpuesto) {
        alert('Ya existe un turno en ese horario para este odontólogo. No se permiten turnos superpuestos.');
        return;
      }

      await turnosApi.create({
        odontologo_id: selectedOdontologo.id,
        fecha_hora_inicio: fechaHora.toISOString(),
        duracion
      });
      setIsGenerarTurnoModalOpen(false);
      setTurnosDisponibles(await turnosApi.getDisponibles(selectedOdontologo.id));
    } catch (err: any) {
      alert(err.message || 'Error al crear turno libre');
    }
  };

  // 4. Seleccionar turno: el paciente (o un paciente ya elegido) va directo a confirmar
  const handleSelectTurno = (t: Turno) => {
    setSelectedTurno(t);
    setError(null);
    setStep(esPaciente || selectedPaciente ? 'confirmacion' : 'paciente');
  };

  // 5. Seleccionar paciente (solo personal)
  const handleSelectPaciente = (p: Paciente) => {
    aplicarPaciente(p);
    setStep('confirmacion');
  };

  // 6. Confirmar reserva final (CUU 1)
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
        // El coseguro lo define el consultorio, el paciente no lo informa
        coseguro: !esPaciente && coseguro ? parseFloat(coseguro) : undefined
      });

      navigate('/agenda');
    } catch (err: any) {
      setError(err.message || 'Error al confirmar la reserva.');
      setSubmitting(false);

      // Si el turno se ocupó mientras el usuario elegía (409), refrescar la lista
      if (selectedOdontologo) {
        try {
          const turnos = await turnosApi.getDisponibles(selectedOdontologo.id);
          setTurnosDisponibles(turnos);
          if (!turnos.some((t) => t.codigo === selectedTurno.codigo)) {
            setSelectedTurno(null);
            setStep('turno');
          }
        } catch {
          // si falla el refresco, queda el mensaje de error original
        }
      }
    }
  };

  const filteredPacientes = pacientes.filter((p) => {
    const term = pacienteSearch.toLowerCase();
    const fullName = `${p.usuario?.nombre} ${p.usuario?.apellido}`.toLowerCase();
    const doc = p.nroDocumento || '';
    return fullName.includes(term) || doc.includes(term);
  });

  // Navegación del stepper: solo hacia pasos cuyos requisitos ya están cumplidos
  const canGoTo = (key: Step): boolean => {
    switch (key) {
      case 'odontologo':
        return true;
      case 'turno':
        return !!selectedOdontologo;
      case 'paciente':
        return !!selectedTurno;
      case 'confirmacion':
        return !!selectedTurno && !!selectedPaciente;
    }
  };

  const currentIndex = steps.findIndex((s) => s.key === step);
  const nombreOdo = (odo: Odontologo) =>
    odo.nombreCompleto || `${odo.usuario?.nombre ?? ''} ${odo.usuario?.apellido ?? ''}`.trim();

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-header-title">Reservar Turno Odontológico</h1>
          <p className="page-header-desc">
            {esPaciente
              ? 'Elige un profesional, selecciona un horario disponible y confirma tu turno.'
              : 'Flujo guiado para asignar un turno disponible con un profesional odontólogo y confirmar la cita médica.'}
          </p>
        </div>
        <Link to="/agenda" className="btn btn-secondary btn-sm">
          {esPaciente ? 'Mis Turnos' : 'Ver Agenda Completa'}
        </Link>
      </div>

      {/* Stepper Indicator */}
      <div className="card" style={{ marginBottom: '2rem', padding: '1.25rem 1.5rem' }}>
        <div className="stepper">
          {steps.map((s, i) => (
            <div
              key={s.key}
              className={`step-item ${i === currentIndex ? 'active' : i < currentIndex ? 'completed' : ''}`}
              onClick={() => canGoTo(s.key) && setStep(s.key)}
            >
              <div className="step-circle">{i < currentIndex ? <Check size={18} /> : i + 1}</div>
              <span className="step-label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="badge badge-danger" style={{ padding: '0.85rem 1rem', width: '100%', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {/* PASO: SELECCIONAR ODONTÓLOGO */}
      {step === 'odontologo' && (
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
              <p>Todavía no hay profesionales disponibles para reservar.</p>
            </div>
          ) : (
            <div className="selection-grid">
              {odontologos.map((odo) => {
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
                      Dr./Dra. {nombreOdo(odo)}
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

      {/* PASO: SELECCIONAR TURNO LIBRE */}
      {step === 'turno' && selectedOdontologo && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Paso 2: Turnos Libres Disponibles</h3>
              <p className="card-subtitle">
                Profesional: <strong>Dr./Dra. {nombreOdo(selectedOdontologo)}</strong> ({selectedOdontologo.especialidad})
              </p>
            </div>
            {esAdmin && (
              <button className="btn btn-secondary btn-sm" onClick={() => setIsGenerarTurnoModalOpen(true)}>
                <Plus size={16} />
                <span>Habilitar Nuevo Horario</span>
              </button>
            )}
          </div>

          {turnosDisponibles.length === 0 ? (
            <div className="empty-state">
              <Clock className="empty-state-icon" />
              <h3>No hay turnos libres actualmente para este profesional</h3>
              {esAdmin ? (
                <>
                  <p>Puedes crear un nuevo bloque de turno disponible ahora mismo.</p>
                  <button
                    className="btn btn-primary"
                    style={{ marginTop: '1rem' }}
                    onClick={() => setIsGenerarTurnoModalOpen(true)}
                  >
                    <Plus size={16} />
                    <span>Generar Turno Libre</span>
                  </button>
                </>
              ) : (
                <p>Prueba con otro profesional o vuelve a intentarlo más tarde.</p>
              )}
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
            <button className="btn btn-ghost" onClick={() => setStep('odontologo')}>
              <ChevronLeft size={16} />
              <span>Cambiar Odontólogo</span>
            </button>
          </div>
        </div>
      )}

      {/* PASO: SELECCIONAR PACIENTE (solo personal) */}
      {step === 'paciente' && !esPaciente && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Paso 3: Selecciona el Paciente</h3>
              <p className="card-subtitle">Busca el paciente en el padrón o da de alta uno nuevo</p>
            </div>
            {esAdmin && (
              <Link to="/recepcion/nuevo" className="btn btn-secondary btn-sm" target="_blank">
                <Plus size={16} />
                <span>Alta Rápida de Paciente</span>
              </Link>
            )}
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
            <button className="btn btn-ghost" onClick={() => setStep('turno')}>
              <ChevronLeft size={16} />
              <span>Cambiar Turno</span>
            </button>
          </div>
        </div>
      )}

      {/* PASO: CONFIRMACIÓN Y RESERVA */}
      {step === 'confirmacion' && selectedOdontologo && selectedTurno && selectedPaciente && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                Paso {steps.length}: {esPaciente ? 'Confirma tu Turno' : 'Confirmar y Registrar Reserva'}
              </h3>
              <p className="card-subtitle">Verifica los datos antes de confirmar la cita</p>
            </div>
          </div>

          <div className="grid-2" style={{ marginBottom: '1.5rem', background: '#F9F1E4', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Profesional Odontólogo
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', marginTop: '0.2rem' }}>
                Dr./Dra. {nombreOdo(selectedOdontologo)}
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
                {esPaciente ? 'Paciente' : 'Paciente Citado'}
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
                  {esPaciente ? 'Obra Social / Mutual' : 'Mutual a Imputar'}
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
            {!esPaciente && (
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
            )}
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Motivo de la consulta / Observaciones</label>
              <input
                type="text"
                className="form-control"
                maxLength={255}
                placeholder="Ej: Limpieza general, dolor en molar superior, etc."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem' }}>
            <button
              className="btn btn-ghost"
              onClick={() => setStep(esPaciente ? 'turno' : 'paciente')}
            >
              <ChevronLeft size={16} />
              <span>{esPaciente ? 'Cambiar Turno' : 'Modificar Paciente'}</span>
            </button>

            <button
              className="btn btn-success"
              onClick={handleConfirmarReserva}
              disabled={submitting}
              style={{ padding: '0.75rem 1.75rem', fontSize: '1rem' }}
            >
              <CheckCircle2 size={18} />
              <span>{submitting ? 'Reservando...' : 'Confirmar Reserva de Turno'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal Habilitar Turno Libre (solo administrador) */}
      {esAdmin && (
        <Modal
          isOpen={isGenerarTurnoModalOpen}
          onClose={() => setIsGenerarTurnoModalOpen(false)}
          title={`Habilitar Nuevo Turno Libre con Dr./Dra. ${selectedOdontologo ? nombreOdo(selectedOdontologo) : ''}`}
        >
          <form onSubmit={handleCrearTurnoLibre}>
            <div className="form-group">
              <label className="form-label">Fecha y Hora de Inicio *</label>
              <input
                type="datetime-local"
                required
                min={getMinDateTimeLocal()}
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
      )}
    </div>
  );
};
