import React, { useState } from 'react';
import { Shield, FileText, Stethoscope, CalendarPlus } from 'lucide-react';
import { MutualesPage } from './MutualesPage';
import { PracticasPage } from './PracticasPage';
import { OdontologosPage } from './OdontologosPage';
import { GestionTurnos } from '../agenda/GestionTurnos';
import './Admin.css';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'mutuales' | 'practicas' | 'odontologos' | 'turnos'>('mutuales');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header-title">Panel de Administración</h1>
          <p className="page-header-desc">Configuración de catálogos base, profesionales médicos y obras sociales</p>
        </div>
      </div>

      <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === 'mutuales' ? 'active' : ''}`}
            onClick={() => setActiveTab('mutuales')}
          >
            <Shield size={18} />
            <span>Obras Sociales & Mutuales</span>
          </button>

          <button
            className={`admin-tab ${activeTab === 'practicas' ? 'active' : ''}`}
            onClick={() => setActiveTab('practicas')}
          >
            <FileText size={18} />
            <span>Tarifario & Prácticas</span>
          </button>

          <button
            className={`admin-tab ${activeTab === 'odontologos' ? 'active' : ''}`}
            onClick={() => setActiveTab('odontologos')}
          >
            <Stethoscope size={18} />
            <span>Plantel de Odontólogos</span>
          </button>

          <button
            className={`admin-tab ${activeTab === 'turnos' ? 'active' : ''}`}
            onClick={() => setActiveTab('turnos')}
          >
            <CalendarPlus size={18} />
            <span>Generar Turnos</span>
          </button>
        </div>

        {activeTab === 'mutuales' && <MutualesPage />}
        {activeTab === 'practicas' && <PracticasPage />}
        {activeTab === 'odontologos' && <OdontologosPage />}
        {activeTab === 'turnos' && <GestionTurnos />}
      </div>
    </div>
  );
};
