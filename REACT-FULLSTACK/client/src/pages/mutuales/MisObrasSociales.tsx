import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Building2,
  Calendar,
  CreditCard,
  AlertCircle,
  RefreshCw,
  Info
} from 'lucide-react';
import { pacientesApi } from '../../services/api';
import { PacienteMutual } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import './Mutuales.css';

export const MisObrasSociales: React.FC = () => {
  const { user } = useAuth();
  const [mutuales, setMutuales] = useState<PacienteMutual[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMisObrasSociales = async () => {
    if (!user?.personaId) {
      setError('No se encontró el identificador del paciente asociado a tu cuenta.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await pacientesApi.getMutuales(user.personaId);
      setMutuales(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar tus obras sociales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMisObrasSociales();
  }, [user?.personaId]);

  return (
    <div className="mutuales-container">
      <div className="page-header">
        <div>
          <h1 className="page-header-title">Mis Obras Sociales</h1>
          <p className="page-header-desc">
            Consulta las mutuales y obras sociales a las que te encuentras afiliado en el consultorio.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn btn-secondary"
            onClick={fetchMisObrasSociales}
            title="Recargar obras sociales"
          >
            <RefreshCw size={16} />
          </button>
          <Link to="/agenda/reservar" className="btn btn-primary">
            <Calendar size={18} />
            <span>Reservar Turno</span>
          </Link>
        </div>
      </div>

      <div className="mutuales-info-banner">
        <Info size={22} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <p>
            <strong>Información sobre tus coberturas:</strong> En este apartado podés verificar los datos de tus mutuales registradas. Si necesitas vincular una nueva obra social, actualizar tu número de credencial o consultar coberturas odontológicas específicas, por favor acércate a la recepción del consultorio.
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
          <span>Cargando tus obras sociales...</span>
        </div>
      ) : mutuales.length === 0 ? (
        <div className="card empty-state" style={{ padding: '3rem 2rem' }}>
          <Building2 className="empty-state-icon" style={{ width: '3rem', height: '3rem' }} />
          <h3>No tienes obras sociales registradas</h3>
          <p style={{ maxWidth: '460px', margin: '0.5rem auto 1.5rem auto' }}>
            Actualmente figuras como paciente particular. Puedes solicitar en recepción vincular tu obra social para gozar de los convenios arancelarios.
          </p>
          <Link to="/agenda/reservar" className="btn btn-primary">
            <Calendar size={16} />
            <span>Reservar Turno como Particular</span>
          </Link>
        </div>
      ) : (
        <div className="mutuales-grid">
          {mutuales.map((pm) => (
            <div key={pm.mutual_id} className="mutual-card">
              <div>
                <div className="mutual-card-header">
                  <div>
                    <h3 className="mutual-card-title">{pm.mutual?.nombre}</h3>
                    <div className="mutual-card-cuit">CUIT: {pm.mutual?.cuit || 'No registrado'}</div>
                  </div>
                  <div className="mutual-icon-box">
                    <ShieldCheck size={24} />
                  </div>
                </div>

                <div className="mutual-details-list">
                  <div className="mutual-detail-row">
                    <span className="mutual-detail-label">N° de Afiliado</span>
                    <span className="mutual-detail-value">{pm.nroAfiliado}</span>
                  </div>
                  <div className="mutual-detail-row">
                    <span className="mutual-detail-label">Estado de Cobertura</span>
                    <span>
                      {pm.cubre > 0 ? (
                        <span className="badge badge-success">Cubre ({pm.cubre}%)</span>
                      ) : (
                        <span className="badge badge-secondary">Sin cobertura directa</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mutual-card-actions">
                <Link to="/agenda/reservar" className="btn btn-secondary btn-sm">
                  <Calendar size={14} />
                  <span>Reservar con esta mutual</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
