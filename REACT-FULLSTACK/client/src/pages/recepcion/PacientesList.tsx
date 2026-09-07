import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, User, Eye, Phone, MapPin, RefreshCw, Calendar } from 'lucide-react';
import { pacientesApi } from '../../services/api';
import { Paciente } from '../../types';
import './Recepcion.css';

export const PacientesList: React.FC = () => {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPacientes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await pacientesApi.getAll();
      setPacientes(data);
    } catch (err: any) {
      setError(err.message || 'Error al obtener pacientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPacientes();
  }, []);

  const filtered = pacientes.filter((p) => {
    const term = searchTerm.toLowerCase();
    const fullName = `${p.usuario?.nombre || ''} ${p.usuario?.apellido || ''}`.toLowerCase();
    const doc = p.nroDocumento || '';
    const nro = p.nro_paciente?.toString() || '';
    return fullName.includes(term) || doc.includes(term) || nro.includes(term);
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header-title">Módulo de Pacientes</h1>
          <p className="page-header-desc">Registro, búsqueda y administración de fichas médicas de pacientes</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={fetchPacientes} title="Recargar lista">
            <RefreshCw size={16} />
          </button>
          <Link to="/recepcion/nuevo" className="btn btn-primary">
            <Plus size={18} />
            <span>Nuevo Paciente</span>
          </Link>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div className="search-input-wrapper" style={{ width: '100%', maxWidth: '480px' }}>
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="form-control search-input"
            placeholder="Buscar por nombre, apellido, DNI o N° de historia clínica..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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
          <span>Cargando padrón de pacientes...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card empty-state">
          <User className="empty-state-icon" />
          <h3>No se encontraron pacientes</h3>
          <p>Puedes registrar un nuevo paciente para comenzar su seguimiento clínico.</p>
          <div style={{ marginTop: '1rem' }}>
            <Link to="/recepcion/nuevo" className="btn btn-primary">
              <Plus size={16} />
              <span>Registrar Paciente</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>N° Ficha</th>
                <th>Paciente</th>
                <th>Documento</th>
                <th>Contacto & Dirección</th>
                <th>Obra Social / Mutual</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const primaryMutual = p.mutuales && p.mutuales.length > 0 ? p.mutuales[0] : null;
                return (
                  <tr key={p.id}>
                    <td>
                      <span className="badge badge-secondary" style={{ fontWeight: 700 }}>
                        HC #{p.nro_paciente}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                        {p.usuario?.apellido}, {p.usuario?.nombre}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {p.usuario?.email}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{p.tipoDoc}: {p.nroDocumento}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
                        <Phone size={13} style={{ color: 'var(--text-subtle)' }} />
                        <span>{p.telefono || 'Sin teléfono'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <MapPin size={13} style={{ color: 'var(--text-subtle)' }} />
                        <span>{p.direccion}</span>
                      </div>
                    </td>
                    <td>
                      {primaryMutual ? (
                        <div>
                          <span className="badge badge-success">
                            {primaryMutual.mutual?.nombre}
                          </span>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            Af: {primaryMutual.nroAfiliado} ({primaryMutual.cubre}% cobertura)
                          </div>
                        </div>
                      ) : (
                        <span className="badge badge-secondary">Particular (Sin Mutual)</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <Link
                          to={`/recepcion/paciente/${p.id}`}
                          className="btn btn-secondary btn-sm"
                          title="Ver Ficha y Odontograma"
                        >
                          <Eye size={14} />
                          <span>Ver Ficha</span>
                        </Link>
                        <Link
                          to={`/agenda/reservar?pacienteId=${p.id}`}
                          className="btn btn-primary btn-sm"
                          title="Agendar Turno"
                        >
                          <Calendar size={14} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
