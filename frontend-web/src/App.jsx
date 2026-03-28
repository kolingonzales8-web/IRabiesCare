import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Welcome from './pages/Welcome';
import Cases from './pages/Cases';
import AddCase from './pages/AddCase';
import ViewCase from './pages/ViewCase';
import EditCase from './pages/EditCase';
import MainLayout from './layouts/MainLayout';
import Patient from './pages/Patient';
import AddPatient from './pages/AddPatient';
import ViewPatient from './pages/ViewPatient';
import EditPatient from './pages/EditPatient';
import Vaccination     from './pages/Vaccination';
import AddVaccination  from './pages/AddVaccination';
import ViewVaccination from './pages/ViewVaccination';
import EditVaccination from './pages/EditVaccination';
import Animal    from './pages/Animal';
import AddAnimal from './pages/AddAnimal';
import VaccinationCoverage from './pages/VaccinationCoverage';

import ReportAndAnalytics from './pages/ReportAndAnalytics';  
import UserManagement from './pages/UserManagement';
import ForgotPassword from './pages/ForgotPassword';
import Settings from './pages/Settings';
import ResetPassword from './pages/ResetPassword';
import ActivityLogs from './pages/Activitylogs';
import useAuthStore from './store/authStore';


function PrivateRoute({ children }) {
  const { token } = useAuthStore();
  return token ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/welcome" />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ✅ Public route — no PrivateRoute or MainLayout */}
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/dashboard" element={
          <PrivateRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </PrivateRoute>
        } />

        {/* Cases */}
        <Route path="/cases" element={
          <PrivateRoute><MainLayout><Cases /></MainLayout></PrivateRoute>
        } />
        <Route path="/cases/add" element={
          <PrivateRoute><MainLayout><AddCase /></MainLayout></PrivateRoute>
        } />
        <Route path="/cases/view/:id" element={
          <PrivateRoute><MainLayout><ViewCase /></MainLayout></PrivateRoute>
        } />
        <Route path="/cases/edit/:id" element={
          <PrivateRoute><MainLayout><EditCase /></MainLayout></PrivateRoute>
        } />

        {/* Patients */}
        <Route path="/patients" element={
          <PrivateRoute><MainLayout><Patient /></MainLayout></PrivateRoute>
        } />
        <Route path="/patients/add" element={
          <PrivateRoute><MainLayout><AddPatient /></MainLayout></PrivateRoute>
        } />
        <Route path="/patients/view/:id" element={
          <PrivateRoute><MainLayout><ViewPatient /></MainLayout></PrivateRoute>
        } />
        <Route path="/patients/edit/:id" element={
          <PrivateRoute><MainLayout><EditPatient /></MainLayout></PrivateRoute>
        } />

        {/* Vaccinations */}
        <Route path="/vaccinations" element={
          <PrivateRoute><MainLayout><Vaccination /></MainLayout></PrivateRoute>
        } />
        <Route path="/vaccinations/add" element={
          <PrivateRoute><MainLayout><AddVaccination /></MainLayout></PrivateRoute>
        } />
        <Route path="/vaccinations/view/:id" element={
          <PrivateRoute><MainLayout><ViewVaccination /></MainLayout></PrivateRoute>
        } />
        <Route path="/vaccinations/edit/:id" element={
          <PrivateRoute><MainLayout><EditVaccination /></MainLayout></PrivateRoute>
        } />

        {/* Animals */}
        <Route path="/animals" element={
          <PrivateRoute><MainLayout><Animal /></MainLayout></PrivateRoute>
        } />
        <Route path="/animals/add" element={
          <PrivateRoute><MainLayout><AddAnimal /></MainLayout></PrivateRoute>
        } />

      
        {/* Vaccination Coverage Monitoring */}
        <Route path="/coverage" element={
          <PrivateRoute><MainLayout><VaccinationCoverage /></MainLayout></PrivateRoute>
        } />

        {/* Reports & Analytics */}
        <Route path="/reports" element={
          <PrivateRoute><MainLayout><ReportAndAnalytics /></MainLayout></PrivateRoute>
        } />

        {/* User Management */}
        <Route path="/users" element={
          <PrivateRoute><MainLayout><UserManagement /></MainLayout></PrivateRoute>
        } />

        <Route path="/settings" element={
          <PrivateRoute><MainLayout><Settings /></MainLayout></PrivateRoute>
         } />

        <Route path="/activity" element={
          <PrivateRoute><MainLayout><ActivityLogs /></MainLayout></PrivateRoute>
         } /> 
        </Routes>
          
    </BrowserRouter>
  );
}