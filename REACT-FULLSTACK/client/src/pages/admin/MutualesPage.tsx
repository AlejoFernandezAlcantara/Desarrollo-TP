import React, { useEffect, useState } from 'react';
import { Plus, Search, Trash2, Edit2, Shield, RefreshCw } from 'lucide-react';
import { mutualesApi } from '../../services/api';
import { Mutual } from '../../types';
import { Modal } from '../../components/Modal';

export const MutualesPage: React.FC = () => {
  const [mutuales, setMutuales] = useState<Mutual[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMutual, setEditingMutual] = useState<Mutual | null>(null);
  const [formData, setFormData] = useState({ cuit: '', nombre: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchMutuales = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await mutualesApi.getAll();
      setMutuales(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar mutuales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMutuales();
  }, []);

  const handleOpenCreate = () => {
    setEditingMutual(null);
    setFormData({ cuit: '', nombre: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m: Mutual) => {
    setEditingMutual(m);
    setFormData({ cuit: m.cuit, nombre: m.nombre });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingMutual) {
        await mutualesApi.update(editingMutual.id, formData);
      } else {
        await mutualesApi.create(formData);
      }
      setIsModalOpen(false);
      fetchMutuales();
    } catch (err: any) {
      alert(err.message || 'Error al guardar la mutual');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar esta obra social / mutual?')) return;
    try {
      await mutualesApi.delete(id);
      fetchMutuales();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar mutual');
    }
  };

  const filtered = mutuales.filter(m =>
    m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.cuit.includes(searchTerm)
  );

  return (
    <div>
      <div className="admin-actions-bar">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="form-control search-input"
            placeholder="Buscar por nombre o CUIT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={fetchMutuales} title="Recargar">
            <RefreshCw size={16} />
          </button>
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={18} />
            <span>Nueva Mutual</span>
          </button>
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
          <span>Cargando Obras Sociales...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card empty-state">
          <Shield className="empty-state-icon" />
          <h3>No se encontraron mutuales</h3>
          <p>Comienza registrando la primera obra social o ajusta tu búsqueda.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre de Mutual / Obra Social</th>
                <th>CUIT</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>#{m.id}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{m.nombre}</div>
                  </td>
                  <td>
                    <span className="badge badge-secondary">{m.cuit}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenEdit(m)}
                        title="Editar mutual"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(m.id)}
                        title="Eliminar mutual"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Crear / Editar */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMutual ? 'Editar Mutual' : 'Registrar Nueva Mutual'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre de la Mutual / Obra Social *</label>
            <input
              type="text"
              required
              className="form-control"
              placeholder="Ej: OSDE, Swiss Medical, IOMA"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">CUIT (11 dígitos con o sin guión) *</label>
            <input
              type="text"
              required
              maxLength={13}
              className="form-control"
              placeholder="Ej: 30-12345678-9 o 30123456789"
              value={formData.cuit}
              onChange={(e) => setFormData({ ...formData, cuit: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Guardando...' : editingMutual ? 'Actualizar' : 'Guardar Mutual'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
