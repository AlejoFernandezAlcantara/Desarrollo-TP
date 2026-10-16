import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Stethoscope,
  Building2,
  CalendarPlus,
  Calendar,
  AlertCircle,
  RefreshCw,
  Info,
  CheckCircle2
} from 'lucide-react';
import { odontologosApi } from '../../services/api';
import { OdontologoMutual } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { BackButton } from '../../components/BackButton';
import './Mutuales.css';

export const MisMutualesOdontologo: React.FC = () => {
  const { user } = useAuth();
  const [mutuales, setMutuales] = useState<OdontologoMutual[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMisMutuales = async () => {
    if (!user?.personaId) {
      setError('No se encontró el identificador del odontólogo asociado a tu cuenta.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await odontologosApi.getMutuales(user.personaId);
      setMutuales(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar las mutuales de tu perfil profesional');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMisMutuales();
  }, [user?.personaId]);

  return (
    <div>
      <BackButton />
      <div className="mutuales-container">
        <div className="page-header">
          <div>
            <h1 className="page-header-title">Mutuales con las que Trabajo</h1>
            <p className="page-header-desc">
              Consulta el listado de obras sociales y mutuales con convenio habilitado para tu atención clínica.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className="btn btn-secondary"
              onClick={fetchMisMutuales}
              title="Recargar mutuales"
            >
              <RefreshCw size={16} />
            </button>
            <Link to="/agenda/turnos" className="btn btn-primary">
              <CalendarPlus size={18} />
              <span>Mis Horarios y Turnos</span>
            </Link>
          </div>
        </div>

        <div className="mutuales-info-banner">
          <Info size={22} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <p>
              <strong>Convenios de atención profesional:</strong> Las mutuales listadas a continuación son aquellas con las que estás habilitado para atender pacientes y emitir liquidaciones de prácticas odontológicas. Para solicitar la adhesión a nuevos convenios o modificar números de prestador, contacta a la administración.
            </p>
          </div>
        </div>

        {error && (
          <div className="badge badge-danger" style={{ padding: '0.85rem 1rem', width: '100%', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            <AlertCircle size={16} style={{ marginRight: '0.5rem', verticalAlign: 'text-bottom' }} />
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner" />
            <span>Cargando convenios con mutuales...</span>
          </div>
        ) : mutuales.length === 0 ? (
          <div className="card empty-state" style={{ padding: '3rem 2rem' }}>
            <Building2 className="empty-state-icon" style={{ width: '3rem', height: '3rem' }} />
            <h3>No tienes mutuales asociadas</h3>
            <p style={{ maxWidth: '460px', margin: '0.5rem auto 1.5rem auto' }}>
              Actualmente tu perfil no registra convenios con obras sociales. Tus pacientes podrán agendar turnos únicamente en modalidad particular.
            </p>
            <Link to="/agenda/turnos" className="btn btn-primary">
              <CalendarPlus size={16} />
              <span>Gestionar mis turnos</span>
            </Link>
          </div>
        ) : (
          <div className="mutuales-grid">
            {mutuales.map((om) => (
              <div key={om.mutual_id} className="mutual-card">
                <div>
                  <div className="mutual-card-header">
                    <div>
                      <h3 className="mutual-card-title">{om.mutual?.nombre}</h3>
                      <div className="mutual-card-cuit">CUIT: {om.mutual?.cuit || 'No registrado'}</div>
                    </div>
                    <div className="mutual-icon-box">
                      <Stethoscope size={24} />
                    </div>
                  </div>

                  <div className="mutual-details-list">
                    <div className="mutual-detail-row">
                      <span className="mutual-detail-label">N° de Prestador / Afiliado</span>
                      <span className="mutual-detail-value">{om.nroAfiliado}</span>
                    </div>
                    <div className="mutual-detail-row">
                      <span className="mutual-detail-label">Estado de Convenio</span>
                      <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <CheckCircle2 size={12} /> Habilitado
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mutual-card-actions">
                  <Link to="/agenda" className="btn btn-secondary btn-sm">
                    <Calendar size={14} />
                    <span>Ver reservas agendadas</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
