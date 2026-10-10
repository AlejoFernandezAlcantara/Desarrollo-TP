import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    CalendarPlus,
    Trash2,
    Clock,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    Filter,
    Layers,
    Calendar as CalendarIcon
} from 'lucide-react';
import { turnosApi, odontologosApi } from '../../services/api';
import { Turno, Odontologo } from '../../types';
import { Modal } from '../../components/Modal';
import { useAuth } from '../../contexts/AuthContext';
import './Agenda.css';

export const GestionTurnos: React.FC = () => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const queryOdontologoId = searchParams.get('odontologoId');

    const esOdontologo = user?.rol === 'ODONTOLOGO';
    const esAdmin = user?.rol === 'ADMINISTRADOR';

    const [turnos, setTurnos] = useState<Turno[]>([]);
    const [odontologos, setOdontologos] = useState<Odontologo[]>([]);
    const [selectedOdontologoId, setSelectedOdontologoId] = useState<string>(
        esOdontologo && user?.personaId ? user.personaId.toString() : (queryOdontologoId || '')
    );
    const [estadoFiltro, setEstadoFiltro] = useState<string>('libre');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Modal crear turno
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modoCreacion, setModoCreacion] = useState<'individual' | 'rango'>('individual');
    const [submitting, setSubmitting] = useState(false);

    // Formulario turno individual
    const [nuevoTurno, setNuevoTurno] = useState({
        fecha_hora_inicio: '',
        duracion: '30',
        odontologo_id: esOdontologo && user?.personaId ? user.personaId.toString() : (queryOdontologoId || '')
    });

    // Formulario generación por rango (múltiples turnos)
    const [rangoTurnos, setRangoTurnos] = useState({
        fecha: '',
        hora_inicio: '09:00',
        hora_fin: '13:00',
        duracion: '30',
        odontologo_id: esOdontologo && user?.personaId ? user.personaId.toString() : (queryOdontologoId || '')
    });

    // Modal confirmar borrado
    const [deletingTurno, setDeletingTurno] = useState<Turno | null>(null);

    // Sincronizar personaId si es odontólogo
    useEffect(() => {
        if (esOdontologo && user?.personaId) {
            const myId = user.personaId.toString();
            setSelectedOdontologoId(myId);
            setNuevoTurno(prev => ({ ...prev, odontologo_id: myId }));
            setRangoTurnos(prev => ({ ...prev, odontologo_id: myId }));
        } else if (esAdmin && queryOdontologoId) {
            setSelectedOdontologoId(queryOdontologoId);
            setNuevoTurno(prev => ({ ...prev, odontologo_id: queryOdontologoId }));
            setRangoTurnos(prev => ({ ...prev, odontologo_id: queryOdontologoId }));
        }
    }, [esOdontologo, esAdmin, user?.personaId, queryOdontologoId]);

    const fetchTurnos = async () => {
        setLoading(true);
        setError(null);
        try {
            const odoId = esOdontologo && user?.personaId
                ? user.personaId
                : (selectedOdontologoId ? parseInt(selectedOdontologoId) : undefined);

            const [turnosData, odosData] = await Promise.all([
                turnosApi.getAll(odoId, estadoFiltro || undefined),
                esAdmin ? odontologosApi.getAll() : Promise.resolve([])
            ]);
            setTurnos(turnosData);
            if (esAdmin) setOdontologos(odosData);
        } catch (err: any) {
            setError(err.message || 'Error al cargar los turnos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTurnos();
    }, [selectedOdontologoId, estadoFiltro]);

    const getMinDateTimeLocal = () => {
        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    };

    const getTodayString = () => {
        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    };

    const handleCrearTurnoIndividual = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setSuccessMsg(null);
        try {
            const targetOdontologoId = esOdontologo
                ? user?.personaId
                : parseInt(nuevoTurno.odontologo_id);

            if (!targetOdontologoId) {
                throw new Error('Debes seleccionar un profesional odontólogo');
            }

            const fechaHora = new Date(nuevoTurno.fecha_hora_inicio);
            if (isNaN(fechaHora.getTime())) {
                throw new Error('Fecha u hora inválida');
            }

            if (fechaHora.getTime() <= Date.now()) {
                throw new Error('No se puede crear un turno con fecha u hora en el pasado. Por favor seleccioná un horario futuro.');
            }

            const duracionMinIndividual = parseInt(nuevoTurno.duracion);
            const fechaFinIndividual = new Date(fechaHora.getTime() + duracionMinIndividual * 60 * 1000);

            // Validar que no se superponga con otro turno del odontólogo
            const superpuestoIndividual = turnos.find((t) => {
                if (t.odontologo_id !== targetOdontologoId) return false;
                const tStart = new Date(t.fecha_hora_inicio);
                const tEnd = new Date(tStart.getTime() + t.duracion * 60 * 1000);
                return fechaHora < tEnd && fechaFinIndividual > tStart;
            });

            if (superpuestoIndividual) {
                const tStart = new Date(superpuestoIndividual.fecha_hora_inicio);
                const tEnd = new Date(tStart.getTime() + superpuestoIndividual.duracion * 60 * 1000);
                const hIniStr = tStart.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
                const hFinStr = tEnd.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
                throw new Error(`El odontólogo ya tiene un turno en ese horario (${hIniStr} a ${hFinStr} hs). No se permiten turnos superpuestos para el mismo día.`);
            }

            await turnosApi.create({
                odontologo_id: targetOdontologoId,
                fecha_hora_inicio: fechaHora.toISOString(),
                duracion: duracionMinIndividual
            });

            setSuccessMsg('Turno habilitado exitosamente');
            setIsModalOpen(false);
            setNuevoTurno(prev => ({
                ...prev,
                fecha_hora_inicio: '',
                duracion: '30'
            }));
            fetchTurnos();
        } catch (err: any) {
            setError(err.message || 'Error al crear el turno');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCrearTurnosRango = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setSuccessMsg(null);
        try {
            const targetOdontologoId = esOdontologo
                ? user?.personaId
                : parseInt(rangoTurnos.odontologo_id);

            if (!targetOdontologoId) {
                throw new Error('Debes seleccionar un profesional odontólogo');
            }

            const { fecha, hora_inicio, hora_fin, duracion } = rangoTurnos;
            if (!fecha || !hora_inicio || !hora_fin) {
                throw new Error('Completá la fecha y los horarios de inicio y fin');
            }

            const hoyStr = getTodayString();
            if (fecha < hoyStr) {
                throw new Error('La fecha seleccionada no puede ser en el pasado');
            }

            const duracionMin = parseInt(duracion);
            const [hIni, mIni] = hora_inicio.split(':').map(Number);
            const [hFin, mFin] = hora_fin.split(':').map(Number);

            const startMinutes = hIni * 60 + mIni;
            const endMinutes = hFin * 60 + mFin;

            if (endMinutes <= startMinutes) {
                throw new Error('La hora de fin debe ser posterior a la hora de inicio');
            }

            const dtInicio = new Date(`${fecha}T${hora_inicio}:00`);
            if (dtInicio.getTime() <= Date.now()) {
                throw new Error('La hora de inicio seleccionada ya pasó. Seleccioná un horario posterior al actual.');
            }

            const totalMin = endMinutes - startMinutes;
            const cantidadTurnos = Math.floor(totalMin / duracionMin);

            if (cantidadTurnos <= 0) {
                throw new Error('El intervalo de tiempo es menor que la duración de un turno');
            }

            if (cantidadTurnos > 30) {
                throw new Error('No es posible generar más de 30 turnos simultáneamente');
            }

            // Generar cada turno validando que no quede en el pasado ni se superponga
            const promesas = [];
            for (let i = 0; i < cantidadTurnos; i++) {
                const minOffset = startMinutes + (i * duracionMin);
                const h = Math.floor(minOffset / 60);
                const m = minOffset % 60;
                const hh = h.toString().padStart(2, '0');
                const mm = m.toString().padStart(2, '0');

                // Formato local para Date
                const dt = new Date(`${fecha}T${hh}:${mm}:00`);
                if (dt.getTime() <= Date.now()) {
                    throw new Error(`El turno de las ${hh}:${mm} hs es en el pasado. No se pueden generar turnos pasados.`);
                }
                const dtEnd = new Date(dt.getTime() + duracionMin * 60 * 1000);

                const superpuesto = turnos.find((t) => {
                    if (t.odontologo_id !== targetOdontologoId) return false;
                    const tStart = new Date(t.fecha_hora_inicio);
                    const tEnd = new Date(tStart.getTime() + t.duracion * 60 * 1000);
                    return dt < tEnd && dtEnd > tStart;
                });

                if (superpuesto) {
                    throw new Error(`El turno de las ${hh}:${mm} hs se superpone con un turno ya existente. No se permiten turnos superpuestos para el mismo día.`);
                }

                promesas.push(
                    turnosApi.create({
                        odontologo_id: targetOdontologoId,
                        fecha_hora_inicio: dt.toISOString(),
                        duracion: duracionMin
                    })
                );
            }

            await Promise.all(promesas);

            setSuccessMsg(`Se generaron correctamente ${cantidadTurnos} turnos`);
            setIsModalOpen(false);
            setRangoTurnos(prev => ({
                ...prev,
                fecha: '',
                hora_inicio: '09:00',
                hora_fin: '13:00'
            }));
            fetchTurnos();
        } catch (err: any) {
            setError(err.message || 'Error al generar los turnos');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEliminarTurno = async () => {
        if (!deletingTurno) return;
        try {
            if (esOdontologo && user?.personaId && deletingTurno.odontologo_id !== user.personaId) {
                throw new Error('Solo podés eliminar tus propios turnos');
            }

            await turnosApi.delete(deletingTurno.codigo);
            setDeletingTurno(null);
            setSuccessMsg('Turno eliminado correctamente');
            fetchTurnos();
        } catch (err: any) {
            setError(err.message || 'Error al eliminar el turno');
            setDeletingTurno(null);
        }
    };

    const estadoBadge = (estado: string) => {
        if (estado === 'libre') return 'badge-success';
        if (estado === 'ocupado') return 'badge-primary';
        return 'badge-secondary';
    };

    // Previsualización de cantidad de turnos en rango
    const calcularPrevisualizacionRango = () => {
        const { fecha, hora_inicio, hora_fin, duracion } = rangoTurnos;
        if (!fecha || !hora_inicio || !hora_fin || !duracion) return 0;

        const hoyStr = getTodayString();
        if (fecha < hoyStr) return 0;

        const dtInicio = new Date(`${fecha}T${hora_inicio}:00`);
        if (dtInicio.getTime() <= Date.now()) return 0;

        const [hIni, mIni] = hora_inicio.split(':').map(Number);
        const [hFin, mFin] = hora_fin.split(':').map(Number);
        const start = hIni * 60 + mIni;
        const end = hFin * 60 + mFin;
        if (end <= start) return 0;
        return Math.floor((end - start) / parseInt(duracion));
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-header-title">
                        {esOdontologo ? 'Mis Turnos y Horarios' : 'Gestión y Generación de Turnos'}
                    </h1>
                    <p className="page-header-desc">
                        {esOdontologo
                            ? 'Habilitá y administrá tus bloques de horario de atención para los pacientes.'
                            : 'Generá y administrá bloques de horarios de turnos por odontólogo.'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-secondary" onClick={fetchTurnos} title="Recargar">
                        <RefreshCw size={16} />
                    </button>
                    <button className="btn btn-primary" onClick={() => {
                        setError(null);
                        setSuccessMsg(null);
                        setIsModalOpen(true);
                    }}>
                        <CalendarPlus size={18} />
                        <span>{esOdontologo ? 'Habilitar Mis Horarios' : 'Generar Turnos'}</span>
                    </button>
                </div>
            </div>

            {/* Filtros */}
            <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Filter size={18} style={{ color: 'var(--primary)' }} />
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Filtros:</span>
                    </div>

                    {esAdmin && (
                        <select
                            className="form-control"
                            style={{ maxWidth: '300px' }}
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
                    )}

                    {esOdontologo && (
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 600 }}>
                            Dr./Dra. {user?.nombre} {user?.apellido} (Tu agenda)
                        </div>
                    )}

                    <select
                        className="form-control"
                        style={{ maxWidth: '180px' }}
                        value={estadoFiltro}
                        onChange={(e) => setEstadoFiltro(e.target.value)}
                    >
                        <option value="">Todos los estados</option>
                        <option value="libre">Libres</option>
                        <option value="ocupado">Ocupados</option>
                    </select>
                </div>
            </div>

            {successMsg && (
                <div
                    className="badge badge-success"
                    style={{ padding: '0.75rem 1rem', width: '100%', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}
                >
                    <CheckCircle2 size={16} />
                    {successMsg}
                </div>
            )}

            {error && (
                <div
                    className="badge badge-danger"
                    style={{ padding: '0.75rem 1rem', width: '100%', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {loading ? (
                <div className="loading-spinner">
                    <div className="spinner" />
                    <span>Cargando turnos...</span>
                </div>
            ) : turnos.length === 0 ? (
                <div className="card empty-state">
                    <Clock className="empty-state-icon" />
                    <h3>No hay turnos con ese filtro</h3>
                    <p>Podés habilitar nuevos bloques de horario haciendo clic en el botón.</p>
                    <button
                        className="btn btn-primary"
                        style={{ marginTop: '1rem' }}
                        onClick={() => setIsModalOpen(true)}
                    >
                        <CalendarPlus size={16} />
                        <span>{esOdontologo ? 'Habilitar Primer Horario' : 'Generar Turnos'}</span>
                    </button>
                </div>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Fecha y Hora</th>
                                <th>Duración</th>
                                {esAdmin && <th>Profesional</th>}
                                <th>Estado</th>
                                <th style={{ textAlign: 'right' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {turnos.map((t) => {
                                const dateObj = new Date(t.fecha_hora_inicio);
                                const fechaStr = dateObj.toLocaleDateString('es-AR', {
                                    weekday: 'long',
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric'
                                });
                                const horaStr = dateObj.toLocaleTimeString('es-AR', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                });
                                const esLibre = t.estado === 'libre';

                                return (
                                    <tr key={t.codigo}>
                                        <td>
                                            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                                                {horaStr} hs
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                                                {fechaStr}
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ fontWeight: 600 }}>{t.duracion} min</span>
                                        </td>
                                        {esAdmin && (
                                            <td>
                                                <div style={{ fontWeight: 600 }}>
                                                    Dr./Dra. {t.odontologo?.usuario?.nombre} {t.odontologo?.usuario?.apellido}
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>
                                                    {t.odontologo?.especialidad}
                                                </div>
                                            </td>
                                        )}
                                        <td>
                                            <span className={`badge ${estadoBadge(t.estado)}`}>
                                                {t.estado}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            {esLibre ? (
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    style={{ color: 'var(--danger)' }}
                                                    onClick={() => setDeletingTurno(t)}
                                                    title="Eliminar turno libre"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            ) : (
                                                <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
                                                    Con reserva
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal Crear / Generar Turnos */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={esOdontologo ? 'Habilitar Mis Horarios de Atención' : 'Generar Turnos para Odontólogo'}
            >
                <div>
                    {/* Selector de modo */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                        <button
                            type="button"
                            className={`btn ${modoCreacion === 'individual' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                            onClick={() => setModoCreacion('individual')}
                        >
                            <CalendarIcon size={14} />
                            <span>Turno Individual</span>
                        </button>
                        <button
                            type="button"
                            className={`btn ${modoCreacion === 'rango' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                            onClick={() => setModoCreacion('rango')}
                        >
                            <Layers size={14} />
                            <span>Generar Bloque de Turnos</span>
                        </button>
                    </div>

                    {esOdontologo && (
                        <div
                            style={{
                                background: 'var(--primary-light)',
                                border: '1px solid var(--primary-border)',
                                borderRadius: 'var(--radius-md)',
                                padding: '0.75rem 1rem',
                                marginBottom: '1rem',
                                fontSize: '0.875rem',
                                color: 'var(--primary)',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <CheckCircle2 size={15} />
                            Habilitando turnos en tu agenda personal: Dr./Dra. {user?.nombre} {user?.apellido}
                        </div>
                    )}

                    {modoCreacion === 'individual' ? (
                        /* Formulario Individual */
                        <form onSubmit={handleCrearTurnoIndividual}>
                            {esAdmin && (
                                <div className="form-group">
                                    <label className="form-label">Profesional Odontólogo *</label>
                                    <select
                                        className="form-control"
                                        required
                                        value={nuevoTurno.odontologo_id}
                                        onChange={(e) => setNuevoTurno({ ...nuevoTurno, odontologo_id: e.target.value })}
                                    >
                                        <option value="">Seleccioná un odontólogo...</option>
                                        {odontologos.map((o) => (
                                            <option key={o.id} value={o.id}>
                                                Dr./Dra. {o.nombreCompleto || `${o.usuario?.nombre} ${o.usuario?.apellido}`} ({o.especialidad})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">Fecha y Hora de Inicio *</label>
                                <input
                                    type="datetime-local"
                                    required
                                    min={getMinDateTimeLocal()}
                                    className="form-control"
                                    value={nuevoTurno.fecha_hora_inicio}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val && new Date(val).getTime() <= Date.now()) {
                                            setError('No podés seleccionar una fecha u hora en el pasado.');
                                        } else {
                                            setError(null);
                                        }
                                        setNuevoTurno({ ...nuevoTurno, fecha_hora_inicio: val });
                                    }}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Duración del Turno *</label>
                                <select
                                    className="form-control"
                                    value={nuevoTurno.duracion}
                                    onChange={(e) => setNuevoTurno({ ...nuevoTurno, duracion: e.target.value })}
                                >
                                    <option value="15">15 minutos</option>
                                    <option value="30">30 minutos (Estándar)</option>
                                    <option value="45">45 minutos</option>
                                    <option value="60">60 minutos (1 hora)</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    <CalendarPlus size={16} />
                                    <span>{submitting ? 'Habilitando...' : 'Habilitar Horario'}</span>
                                </button>
                            </div>
                        </form>
                    ) : (
                        /* Formulario por Rango / Bloque */
                        <form onSubmit={handleCrearTurnosRango}>
                            {esAdmin && (
                                <div className="form-group">
                                    <label className="form-label">Profesional Odontólogo *</label>
                                    <select
                                        className="form-control"
                                        required
                                        value={rangoTurnos.odontologo_id}
                                        onChange={(e) => setRangoTurnos({ ...rangoTurnos, odontologo_id: e.target.value })}
                                    >
                                        <option value="">Seleccioná un odontólogo...</option>
                                        {odontologos.map((o) => (
                                            <option key={o.id} value={o.id}>
                                                Dr./Dra. {o.nombreCompleto || `${o.usuario?.nombre} ${o.usuario?.apellido}`} ({o.especialidad})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">Fecha de Atención *</label>
                                <input
                                    type="date"
                                    required
                                    min={getTodayString()}
                                    className="form-control"
                                    value={rangoTurnos.fecha}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val && val < getTodayString()) {
                                            setError('No podés seleccionar una fecha en el pasado.');
                                        } else {
                                            setError(null);
                                        }
                                        setRangoTurnos({ ...rangoTurnos, fecha: val });
                                    }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Hora Desde *</label>
                                    <input
                                        type="time"
                                        required
                                        className="form-control"
                                        value={rangoTurnos.hora_inicio}
                                        onChange={(e) => setRangoTurnos({ ...rangoTurnos, hora_inicio: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Hora Hasta *</label>
                                    <input
                                        type="time"
                                        required
                                        className="form-control"
                                        value={rangoTurnos.hora_fin}
                                        onChange={(e) => setRangoTurnos({ ...rangoTurnos, hora_fin: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Duración de Cada Turno *</label>
                                <select
                                    className="form-control"
                                    value={rangoTurnos.duracion}
                                    onChange={(e) => setRangoTurnos({ ...rangoTurnos, duracion: e.target.value })}
                                >
                                    <option value="15">15 minutos</option>
                                    <option value="30">30 minutos (Estándar)</option>
                                    <option value="45">45 minutos</option>
                                    <option value="60">60 minutos (1 hora)</option>
                                </select>
                            </div>

                            {calcularPrevisualizacionRango() > 0 && (
                                <div style={{
                                    backgroundColor: 'var(--bg-muted)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '0.75rem 1rem',
                                    fontSize: '0.85rem',
                                    color: 'var(--text-main)',
                                    marginBottom: '1rem',
                                    border: '1px solid var(--border)'
                                }}>
                                    ✨ Se generarán <strong>{calcularPrevisualizacionRango()} turnos</strong> consecutivos de {rangoTurnos.duracion} minutos entre las {rangoTurnos.hora_inicio} hs y las {rangoTurnos.hora_fin} hs.
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={submitting || calcularPrevisualizacionRango() <= 0}>
                                    <Layers size={16} />
                                    <span>{submitting ? 'Generando...' : `Generar ${calcularPrevisualizacionRango() > 0 ? `${calcularPrevisualizacionRango()} ` : ''}Turnos`}</span>
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </Modal>

            {/* Modal Confirmar Borrado */}
            <Modal
                isOpen={!!deletingTurno}
                onClose={() => setDeletingTurno(null)}
                title="Eliminar Turno Libre"
            >
                {deletingTurno && (
                    <div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            ¿Estás seguro de que querés eliminar este bloque de horario?
                        </p>
                        <div
                            style={{
                                background: 'var(--bg-muted)',
                                borderRadius: 'var(--radius-md)',
                                padding: '1rem',
                                marginBottom: '1.5rem'
                            }}
                        >
                            <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                                {new Date(deletingTurno.fecha_hora_inicio).toLocaleTimeString('es-AR', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })} hs
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                                {new Date(deletingTurno.fecha_hora_inicio).toLocaleDateString('es-AR', {
                                    weekday: 'long',
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric'
                                })}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                Duración: {deletingTurno.duracion} min
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <button className="btn btn-secondary" onClick={() => setDeletingTurno(null)}>
                                Cancelar
                            </button>
                            <button className="btn btn-danger" onClick={handleEliminarTurno}>
                                <Trash2 size={15} />
                                <span>Sí, eliminar</span>
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};
