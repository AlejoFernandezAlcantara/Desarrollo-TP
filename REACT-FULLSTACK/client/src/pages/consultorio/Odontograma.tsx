import React from 'react';
import { Detalle } from '../../types';
import './Consultorio.css';

interface OdontogramaProps {
  selectedDienteNumero: number | null;
  onSelectDiente: (numero: number | null) => void;
  detalles: Detalle[];
}

export const Odontograma: React.FC<OdontogramaProps> = ({
  selectedDienteNumero,
  onSelectDiente,
  detalles
}) => {
  // Cuadrantes FDI
  const q1 = [18, 17, 16, 15, 14, 13, 12, 11];
  const q2 = [21, 22, 23, 24, 25, 26, 27, 28];
  const q4 = [48, 47, 46, 45, 44, 43, 42, 41];
  const q3 = [31, 32, 33, 34, 35, 36, 37, 38];

  const renderTooth = (numero: number) => {
    const isSelected = selectedDienteNumero === numero;
    // Chequear si este diente tiene alguna práctica realizada en los detalles
    const tratamientos = detalles.filter(d => d.diente?.numero === numero || d.diente_id === numero);
    const hasTreatment = tratamientos.length > 0;

    return (
      <div
        key={numero}
        className={`tooth-item ${isSelected ? 'selected' : ''} ${hasTreatment ? 'has-treatment' : ''}`}
        onClick={() => onSelectDiente(isSelected ? null : numero)}
        title={`Pieza dental N° ${numero}${hasTreatment ? ` (${tratamientos.length} práctica(s))` : ''}`}
      >
        {hasTreatment && <div className="tooth-badge" />}
        <span className="tooth-number">{numero}</span>
        
        {/* SVG simplificado que representa una muela o diente */}
        <div className="tooth-icon">
          <svg width="20" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 4C7 2.5 8.5 2 12 2C15.5 2 17 2.5 17 4C17 6 18 10 18 14C18 18 16.5 22 14.5 22C12.5 22 12.5 17 12 17C11.5 17 11.5 22 9.5 22C7.5 22 6 18 6 14C6 10 7 6 7 4Z" 
              fill={hasTreatment ? '#fde68a' : isSelected ? '#bae6fd' : '#ffffff'} 
            />
          </svg>
        </div>

        <span style={{ fontSize: '0.65rem', color: hasTreatment ? '#b45309' : 'var(--text-subtle)', fontWeight: 600 }}>
          {hasTreatment ? `${tratamientos.length}p` : 'Sano'}
        </span>
      </div>
    );
  };

  return (
    <div className="odontograma-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Odontograma Dental Interactivo (FDI)
          </h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Haz clic sobre una pieza dental para seleccionarla y asociarle una práctica odontológica.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', fontWeight: 600 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#f8fafc', border: '1.5px solid #cbd5e1' }} />
            <span>Sin tratamientos</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#fef3c7', border: '1.5px solid #f59e0b' }} />
            <span>Con Práctica Realizada</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#e0f2fe', border: '1.5px solid var(--primary)' }} />
            <span>Seleccionado</span>
          </span>
        </div>
      </div>

      {/* Arcada Superior */}
      <div style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
        Arcada Superior (Maxilar)
      </div>
      <div className="odontograma-arch">
        <div className="odontograma-quadrant">
          {q1.map(renderTooth)}
        </div>
        <div className="odontograma-divider" />
        <div className="odontograma-quadrant">
          {q2.map(renderTooth)}
        </div>
      </div>

      {/* Arcada Inferior */}
      <div style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', margin: '0.8rem 0 0.4rem 0' }}>
        Arcada Inferior (Mandibular)
      </div>
      <div className="odontograma-arch" style={{ marginBottom: 0 }}>
        <div className="odontograma-quadrant">
          {q4.map(renderTooth)}
        </div>
        <div className="odontograma-divider" />
        <div className="odontograma-quadrant">
          {q3.map(renderTooth)}
        </div>
      </div>
    </div>
  );
};
