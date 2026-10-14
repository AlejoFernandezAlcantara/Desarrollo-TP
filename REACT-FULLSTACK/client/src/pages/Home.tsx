import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  CalendarPlus,
  Users, 
  Activity, 
  Settings, 
  CheckCircle2, 
  ArrowRight,
  Clock,
  ShieldCheck,
  Stethoscope,
  HeartHandshake
} from 'lucide-react';

import { pacientesApi, reservasApi, odontologosApi } from '../services/api';
import './Home.css';
import { useAuth } from '../contexts/AuthContext';
import { diaAR, hoyAR } from '../utils/fecha';

export const Home: React.FC = () => {
  const { user } = useAuth();
  const esStaff = user?.rol === 'ODONTOLOGO' || user?.rol === 'ADMINISTRADOR';

  const [loading, setLoading] = useState(true);
  const [pacienteReservasPendientes, setPacienteReservasPendientes] = useState(0);
  const [turnosPendientesHoy, setTurnosPendientesHoy] = useState(0);
  const [turnosAtendidosHoy, setTurnosAtendidosHoy] = useState(0);

  // Fecha de hoy local en formato YYYY-MM-DD
  const pad = (n: number) => String(n).padStart(2, '0');
  const now = new Date();
  const hoyStr = hoyAR();

  // Fecha legible para mostrar como subtítulo (ej: "12 de octubre")
  const fechaHoyLegible = now.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long'
  });

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        if (!user) {
          setLoading(false);
          return;
        }

        if (user.rol === 'PACIENTE') {
          // PACIENTE: Solo sus reservas pendientes de atención
          const pacienteId = user.personaId;
          const reservas = await reservasApi.getAll({
            pacienteId: pacienteId || undefined
          }).catch(() => []);

          const pendientes = reservas.filter(
            (r) => r.estado === 'pendiente' || r.estado === 'confirmada'
          );
          setPacienteReservasPendientes(pendientes.length);
        } else if (user.rol === 'ODONTOLOGO') {
          // ODONTÓLOGO: Turnos pendientes y atendidos de hoy para este odontólogo
          const odontologoId = user.personaId;
          const reservas = await reservasApi.getAll({
            odontologoId: odontologoId || undefined
          }).catch(() => []);

          const reservasDeHoy = reservas.filter((r) => {
            const fechaInicio = r.turnos && r.turnos[0]?.fecha_hora_inicio;
            return diaAR(fechaInicio || r.fecha_creacion) === hoyStr;
          });

          const pendientes = reservasDeHoy.filter(
            (r) => r.estado === 'pendiente' || r.estado === 'confirmada'
          );
          const atendidos = reservasDeHoy.filter(
            (r) => r.estado === 'realizada'
          );

          setTurnosPendientesHoy(pendientes.length);
          setTurnosAtendidosHoy(atendidos.length);
        } else if (user.rol === 'ADMINISTRADOR') {
          // ADMINISTRADOR: Turnos pendientes y atendidos de hoy en toda la clínica
          const reservas = await reservasApi.getAll().catch(() => []);

          const reservasDeHoy = reservas.filter((r) => {
            const fechaInicio = r.turnos && r.turnos[0]?.fecha_hora_inicio;
             return diaAR(fechaInicio || r.fecha_creacion) === hoyStr;
          });

          const pendientes = reservasDeHoy.filter(
            (r) => r.estado === 'pendiente' || r.estado === 'confirmada'
          );
          const atendidos = reservasDeHoy.filter(
            (r) => r.estado === 'realizada'
          );

          setTurnosPendientesHoy(pendientes.length);
          setTurnosAtendidosHoy(atendidos.length);
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user?.rol, user?.personaId, hoyStr]);

  return (
    <div className="home-container">
      {/* Hero Banner */}
      <section className="home-hero">
        <div className="home-hero-content">
          <div className="home-hero-badge">
            <ShieldCheck size={16} />
            <span>Sistema Integral Odontológico</span>
          </div>
          <h1 className="home-hero-title">Gestión Clínica y Turnos </h1>
          <p className="home-hero-desc">
            Recepción y administración online. Control de historias clínicas, odontograma y turnos.
          </p>
          <div className="home-hero-actions">
            <Link to="/agenda/reservar" className="btn btn-hero-primary">
              <Calendar size={18} />
              <span>Reservar Nuevo Turno</span>
            </Link>
            {esStaff && (
              <Link to="/agenda/turnos" className="btn btn-hero-secondary">
                <CalendarPlus size={18} />
                <span>{user?.rol === 'ODONTOLOGO' ? 'Generar Mis Turnos' : 'Generar Turnos Odontólogo'}</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Stats Counter Condicional según ROL */}
      <section
        className={user?.rol === 'PACIENTE' ? 'grid-1' : 'grid-2'}
        style={{ marginBottom: '2.5rem', maxWidth: user?.rol === 'PACIENTE' ? '360px' : '720px' }}
      >
        {user?.rol === 'PACIENTE' && (
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
              <Clock size={26} />
            </div>
            <div>
              <div className="stat-value">{loading ? '...' : pacienteReservasPendientes}</div>
              <div className="stat-label">Reservas pendientes</div>
            </div>
          </div>
        )}

        {(user?.rol === 'ODONTOLOGO' || user?.rol === 'ADMINISTRADOR') && (
          <>
            <div className="stat-card">
              <div className="stat-icon-wrapper" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
                <Clock size={26} />
              </div>
              <div>
                <div className="stat-value">{loading ? '...' : turnosPendientesHoy}</div>
                <div className="stat-label">Turnos pendientes</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '0.15rem' }}>
                  {fechaHoyLegible}
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
                <CheckCircle2 size={26} />
              </div>
              <div>
                <div className="stat-value">{loading ? '...' : turnosAtendidosHoy}</div>
                <div className="stat-label">Turnos atendidos</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '0.15rem' }}>
                  {fechaHoyLegible}
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Main Modules Grid */}
      <div className="page-header">
        <div>
          <h2 className="page-header-title" style={{ fontSize: '1.4rem' }}>Módulos del Sistema</h2>
          <p className="page-header-desc">Accede directamente a los flujos operativos</p>
        </div>
      </div>

      <div className="grid-2">
        {/* Card Generación de Turnos (Odontólogos y Administradores) */}
        {esStaff && (
          <Link to="/agenda/turnos" className="quick-action-card">
            <div className="action-icon-circle" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
              <CalendarPlus size={24} />
            </div>
            <h3 className="quick-action-title">
              {user?.rol === 'ODONTOLOGO' ? 'Generar Mis Turnos y Horarios' : 'Generar Turnos de Odontólogos'}
            </h3>
            <p className="quick-action-desc">
              {user?.rol === 'ODONTOLOGO'
                ? 'Habilitá y administrá tus horarios y turnos disponibles para que los pacientes puedan agendarlos.'
                : 'Habilitá y generá bloques de turnos disponibles para el plantel de profesionales odontólogos.'}
            </p>
            <div className="quick-action-link">
              <span>{user?.rol === 'ODONTOLOGO' ? 'Generar mis turnos' : 'Generar turnos'}</span>
              <ArrowRight size={16} />
            </div>
          </Link>
        )}

        {/* Card CUU 1: Agenda y Reservas */}
        <Link to="/agenda/reservar" className="quick-action-card">
          <div className="action-icon-circle" style={{ backgroundColor: '#F3E7CC', color: '#B08028' }}>
            <Calendar size={24} />
          </div>
          <h3 className="quick-action-title">Reservar Turno Odontológico</h3>
          <p className="quick-action-desc">
            Flujo guiado para agendar turnos: filtra por odontólogo, consulta horarios disponibles, vincula al paciente y mutual, y confirma la reserva.
          </p>
          <div className="quick-action-link">
            <span>Iniciar reserva</span>
            <ArrowRight size={16} />
          </div>
        </Link>

        {/* Card CUU 2: Consultorio Clínico */}
        {esStaff && (
          <Link to="/consultorio" className="quick-action-card">
            <div className="action-icon-circle" style={{ backgroundColor: '#FBF5E8', color: '#604828' }}>
              <Activity size={24} />
            </div>
            <h3 className="quick-action-title">Atención Clínica & Odontograma</h3>
            <p className="quick-action-desc">
              Vista de pacientes citados para hoy. Permite al odontólogo ingresar a la consulta, registrar prácticas aplicadas en el odontograma y finalizar la sesión.
            </p>
            <div className="quick-action-link">
              <span>Ir a Consultorio</span>
              <ArrowRight size={16} />
            </div>
          </Link>
        )}  

        {/* Card Mis Obras Sociales / Mutuales */}
        {(user?.rol === 'PACIENTE' || user?.rol === 'ODONTOLOGO') && (
          <Link to="/mis-mutuales" className="quick-action-card">
            <div className="action-icon-circle" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
              <HeartHandshake size={24} />
            </div>
            <h3 className="quick-action-title">
              {user?.rol === 'PACIENTE' ? 'Mis Obras Sociales' : 'Mutuales con las que Trabajo'}
            </h3>
            <p className="quick-action-desc">
              {user?.rol === 'PACIENTE'
                ? 'Consultá las mutuales asociadas a tu cuenta, tus números de afiliado y el estado de tu cobertura médica.'
                : 'Consultá el catálogo de mutuales con las que tenés convenio habilitado para atender pacientes en el consultorio.'}
            </p>
            <div className="quick-action-link">
              <span>{user?.rol === 'PACIENTE' ? 'Ver mis obras sociales' : 'Ver convenios'}</span>
              <ArrowRight size={16} />
            </div>
          </Link>
        )}

        {/* Card Recepción */}
        {user?.rol === 'ADMINISTRADOR' && (

          <Link to="/recepcion" className="quick-action-card">
            <div className="action-icon-circle" style={{ backgroundColor: '#f5f3ff', color: '#6366f1' }}>
              <Users size={24} />
            </div>
            <h3 className="quick-action-title">Módulo de Pacientes</h3>
            <p className="quick-action-desc">
              Búsqueda rápida de pacientes, creación de ficha médica completa con mutuales vinculadas y acceso directo al historial clínico.
            </p>
            <div className="quick-action-link">
              <span>Gestionar pacientes</span>
              <ArrowRight size={16} />
            </div>
          </Link>
        )}

        {/* Card Administración */}
        {user?.rol === 'ADMINISTRADOR' && (
          <Link to="/admin" className="quick-action-card">
            <div className="action-icon-circle" style={{ backgroundColor: '#fff7ed', color: '#ea580c' }}>
              <Settings size={24} />
            </div>
            <h3 className="quick-action-title">Módulo de Administración</h3>
            <p className="quick-action-desc">
              ABM de Mutuales (Obras Sociales), catálogo de Prácticas Odontológicas con tarifario en tiempo real y registro de profesionales.
            </p>
            <div className="quick-action-link">
              <span>Abrir administración</span>
              <ArrowRight size={16} />
            </div>
          </Link>
        )}
      </div>
    </div>
  );
};
