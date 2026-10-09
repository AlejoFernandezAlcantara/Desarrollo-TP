import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { PacientesList } from './pages/recepcion/PacientesList';
import { PacienteNuevo } from './pages/recepcion/PacienteNuevo';
import { PacienteDetalle } from './pages/recepcion/PacienteDetalle';
import { AgendaPage } from './pages/agenda/AgendaPage';
import { ReservarTurno } from './pages/agenda/ReservarTurno';
import { ConsultorioHoy } from './pages/consultorio/ConsultorioHoy';
import { AtencionConsulta } from './pages/consultorio/AtencionConsulta';
import './App.css';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <div className="app-container">
            <Navbar />

            <main className="main-content">
              <Routes>
                {/* Rutas públicas de Autenticación */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

              {/* Inicio / Dashboard */}
              <Route path="/" element={<Home />} />

              {/* Módulo Administración (Solo Administradores) */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['ADMINISTRADOR']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute allowedRoles={['ADMINISTRADOR']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Módulo Recepción & Pacientes (Administrador) */}
              <Route
                path="/recepcion"
                element={
                  <ProtectedRoute allowedRoles={['ADMINISTRADOR']}>
                    <PacientesList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pacientes"
                element={
                  <ProtectedRoute allowedRoles={['ADMINISTRADOR']}>
                    <PacientesList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recepcion/nuevo"
                element={
                  <ProtectedRoute allowedRoles={['ADMINISTRADOR']}>
                    <PacienteNuevo />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pacientes/nuevo"
                element={
                  <ProtectedRoute allowedRoles={['ADMINISTRADOR']}>
                    <PacienteNuevo />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recepcion/paciente/:id"
                element={
                  <ProtectedRoute allowedRoles={['ADMINISTRADOR']}>
                    <PacienteDetalle />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pacientes/:id"
                element={
                  <ProtectedRoute allowedRoles={['ADMINISTRADOR']}>
                    <PacienteDetalle />
                  </ProtectedRoute>
                }
              />
              {/* Agenda: solo personal */}
              <Route
                path="/agenda"
                element={
                  <ProtectedRoute allowedRoles={['ODONTOLOGO', 'ADMINISTRADOR']}>
                    <AgendaPage />
                  </ProtectedRoute>
                }
              />
              {/* Módulo Agenda & Turnos (Pacientes, Odontólogos y Administradores) */}
              <Route
                path="/agenda/reservar"
                element={
                  <ProtectedRoute allowedRoles={['PACIENTE', 'ODONTOLOGO', 'ADMINISTRADOR']}>
                    <ReservarTurno />
                  </ProtectedRoute>
                }
              />

              {/* Módulo Consultorio Clínico & Odontograma (Odontólogos y Administradores) */}
              <Route
                path="/consultorio"
                element={
                  <ProtectedRoute allowedRoles={['ODONTOLOGO', 'ADMINISTRADOR']}>
                    <ConsultorioHoy />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/consultorio/hoy"
                element={
                  <ProtectedRoute allowedRoles={['ODONTOLOGO', 'ADMINISTRADOR']}>
                    <ConsultorioHoy />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/consultorio/atender/:idReserva"
                element={
                  <ProtectedRoute allowedRoles={['ODONTOLOGO', 'ADMINISTRADOR']}>
                    <AtencionConsulta />
                  </ProtectedRoute>
                }
              />

              {/* Ruta por defecto */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <footer className="app-footer">
            <div className="app-footer-inner">
              <div>
                <strong>Consultorio Carestia</strong> — Sistema Integral de Gestión Odontológica
              </div>
            </div>
          </footer>
          </div>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
