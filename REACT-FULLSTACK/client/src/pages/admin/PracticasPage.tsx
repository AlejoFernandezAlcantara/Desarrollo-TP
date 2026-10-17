import React, { useEffect, useState } from 'react';
import { Plus, Search, Trash2, Edit2, FileText, RefreshCw } from 'lucide-react';
import { practicasApi } from '../../services/api';
import { Practica } from '../../types';
import { Modal } from '../../components/Modal';

export const PracticasPage: React.FC = () => {
  const [practicas, setPracticas] = useState<Practica[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPractica, setEditingPractica] = useState<Practica | null>(null);
  const [formData, setFormData] = useState({ codigo: '', detalle: '', precio: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchPracticas = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await practicasApi.getAll();
      setPracticas(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar prácticas odontológicas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPracticas();
  }, []);

  const handleOpenCreate = () => {
    setEditingPractica(null);
    setFormData({ codigo: '', detalle: '', precio: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Practica) => {
    setEditingPractica(p);
    setFormData({ codigo: p.codigo, detalle: p.detalle, precio: p.precio.toString() });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        codigo: formData.codigo,
        detalle: formData.detalle,
        precio: parseFloat(formData.precio) || 0
      };

      if (editingPractica) {
        await practicasApi.update(editingPractica.id, payload);
      } else {
        await practicasApi.create(payload);
      }
      setIsModalOpen(false);
      fetchPracticas();
    } catch (err: any) {
      alert(err.message || 'Error al guardar la práctica');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar esta práctica odontológica del tarifario?')) return;
    try {
      await practicasApi.delete(id);
      fetchPracticas();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar práctica');
    }
  };

  const filtered = practicas.filter(p =>
    p.detalle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="admin-actions-bar">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="form-control search-input"
            placeholder="Buscar por código o detalle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={fetchPracticas} title="Recargar">
            <RefreshCw size={16} />
          </button>
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={18} />
            <span>Nueva Práctica</span>
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
          <span>Cargando Tarifario y Prácticas...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card empty-state">
          <FileText className="empty-state-icon" />
          <h3>No se encontraron prácticas</h3>
          <p>Registra códigos de prácticas odontológicas para utilizarlas en la atención y odontograma.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Detalle de la Práctica</th>
                <th>Precio Base</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>
                    <span className="badge badge-primary">{p.codigo}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{p.detalle}</div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: '#047857' }}>
                      ${Number(p.precio).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenEdit(p)}
                        title="Editar práctica"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(p.id)}
                        title="Eliminar práctica"
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
        title={editingPractica ? 'Editar Práctica Odontológica' : 'Nueva Práctica Odontológica'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Código de Práctica *</label>
            <input
              type="text"
              required
              className="form-control"
              placeholder="Ej: PR-01, EX-10, ODO-22"
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Detalle / Descripción *</label>
            <input
              type="text"
              required
              className="form-control"
              placeholder="Ej: Limpieza profunda y pulido dental"
              value={formData.detalle}
              onChange={(e) => setFormData({ ...formData, detalle: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Precio ($ ARS) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              className="form-control"
              placeholder="Ej: 8500.00"
              value={formData.precio}
              onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
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
              {submitting ? 'Guardando...' : editingPractica ? 'Actualizar' : 'Guardar Práctica'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
