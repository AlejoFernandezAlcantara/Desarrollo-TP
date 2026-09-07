import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Users, 
  Activity, 
  Settings, 
  CheckCircle2, 
  ArrowRight,
  Clock,
  ShieldCheck,
  Stethoscope
} from 'lucide-react';
import { pacientesApi, reservasApi, odontologosApi, mutualesApi } from '../services/api';
import './Home.css';

export const Home: React.FC = () => {
  const [stats, setStats] = useState({
    pacientesCount: 0,
    odontologosCount: 0,
    reservasHoyCount: 0,
    mutualesCount: 0,
    loading: true
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [pacientes, odontologos, reservas, mutuales] = await Promise.all([
          pacientesApi.getAll().catch(() => []),
          odontologosApi.getAll().catch(() => []),
          reservasApi.getAll().catch(() => []),
          mutualesApi.getAll().catch(() => [])
        ]);

        // Filtrar reservas de hoy aproximadamente o pendientes/confirmadas
        const hoy = new Date().toISOString().split('T')[0];
        const turnosHoy = reservas.filter(r => {
          if (r.turnos && r.turnos.length > 0) {
            return r.turnos[0].fecha_hora_inicio.startsWith(hoy);
          }
          return r.fecha_creacion.startsWith(hoy);
        });

        setStats({
          pacientesCount: pacientes.length,
          odontologosCount: odontologos.length,
          reservasHoyCount: turnosHoy.length > 0 ? turnosHoy.length : reservas.length,
          mutualesCount: mutuales.length,
          loading: false
        });
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="home-container">
      {/* Hero Banner */}
      <section className="home-hero">
        <div className="home-hero-content">
          <div className="home-hero-badge">
            <ShieldCheck size={16} />
            <span>Sistema Integral Odontológico</span>
          </div>
          <h1 className="home-hero-title">Gestión Clínica y Turnos Simplificada</h1>
          <p className="home-hero-desc">
            Plataforma centralizada para odontólogos, recepción y administración. Control integral de historias clínicas, odontograma interactivo y flujo guiado de turnos.
          </p>
          <div className="home-hero-actions">
            <Link to="/agenda/reservar" className="btn btn-hero-primary">
              <Calendar size={18} />
              <span>Reservar Nuevo Turno (CUU 1)</span>
            </Link>
            <Link to="/consultorio" className="btn btn-hero-secondary">
              <Activity size={18} />
              <span>Atención en Consultorio (CUU 2)</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Counter */}
      <section className="grid-4" style={{ marginBottom: '2.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
            <Users size={26} />
          </div>
          <div>
            <div className="stat-value">{stats.loading ? '...' : stats.pacientesCount}</div>
            <div className="stat-label">Pacientes Registrados</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#f0f9ff', color: '#0284c7' }}>
            <Stethoscope size={26} />
          </div>
          <div>
            <div className="stat-value">{stats.loading ? '...' : stats.odontologosCount}</div>
            <div className="stat-label">Odontólogos Activos</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
            <Clock size={26} />
          </div>
          <div>
            <div className="stat-value">{stats.loading ? '...' : stats.reservasHoyCount}</div>
            <div className="stat-label">Turnos Gestionados</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#f5f3ff', color: '#7c3aed' }}>
            <ShieldCheck size={26} />
          </div>
          <div>
            <div className="stat-value">{stats.loading ? '...' : stats.mutualesCount}</div>
            <div className="stat-label">Obras Sociales / Mutuales</div>
          </div>
        </div>
      </section>

      {/* Main Modules Grid */}
      <div className="page-header">
        <div>
          <h2 className="page-header-title" style={{ fontSize: '1.4rem' }}>Módulos del Sistema</h2>
          <p className="page-header-desc">Accede directamente a los flujos operativos requeridos por la cátedra</p>
        </div>
      </div>

      <div className="grid-2">
        {/* Card CUU 1: Agenda y Reservas */}
        <Link to="/agenda/reservar" className="quick-action-card">
          <div className="action-icon-circle" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
            <Calendar size={24} />
          </div>
          <h3 className="quick-action-title">CUU 1: Reservar Turno Odontológico</h3>
          <p className="quick-action-desc">
            Flujo guiado para agendar turnos: filtra por odontólogo, consulta horarios disponibles, vincula al paciente y mutual, y confirma la reserva.
          </p>
          <div className="quick-action-link">
            <span>Iniciar reserva</span>
            <ArrowRight size={16} />
          </div>
        </Link>

        {/* Card CUU 2: Consultorio Clínico */}
        <Link to="/consultorio" className="quick-action-card">
          <div className="action-icon-circle" style={{ backgroundColor: '#f0fdfa', color: '#0f766e' }}>
            <Activity size={24} />
          </div>
          <h3 className="quick-action-title">CUU 2: Atención Clínica & Odontograma</h3>
          <p className="quick-action-desc">
            Vista de pacientes citados para hoy. Permite al odontólogo ingresar a la consulta, registrar prácticas aplicadas en el odontograma y finalizar la sesión.
          </p>
          <div className="quick-action-link">
            <span>Ir a Consultorio</span>
            <ArrowRight size={16} />
          </div>
        </Link>

        {/* Card Recepción */}
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

        {/* Card Administración */}
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
      </div>
    </div>
  );
};
