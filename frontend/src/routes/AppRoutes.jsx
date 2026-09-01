import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';

import LandingPage from '../pages/LandingPage';
import HomePage from '../pages/HomePage';
import DesignSystemShowcase from '../pages/DesignSystemShowcase';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';

// Admin Portal Pages
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminDoctorsPage from '../pages/admin/AdminDoctorsPage';
import AdminDoctorCreatePage from '../pages/admin/AdminDoctorCreatePage';
import AdminDoctorDetailsPage from '../pages/admin/AdminDoctorDetailsPage';
import AdminAppointmentsPage from '../pages/admin/AdminAppointmentsPage';
import AdminUsersPage from '../pages/admin/AdminUsersPage';

// Doctor Portal Pages
import DoctorDashboardPage from '../pages/doctor/DoctorDashboardPage';
import DoctorAppointmentsPage from '../pages/doctor/DoctorAppointmentsPage';
import DoctorAppointmentDetailsPage from '../pages/doctor/DoctorAppointmentDetailsPage';
import DoctorSchedulePage from '../pages/doctor/DoctorSchedulePage';
import DoctorProfilePage from '../pages/doctor/DoctorProfilePage';

// Patient Portal Pages
import PatientDashboardPage from '../pages/patient/PatientDashboardPage';
import PatientDoctorsPage from '../pages/patient/PatientDoctorsPage';
import PatientDoctorProfilePage from '../pages/patient/PatientDoctorProfilePage';
import PatientAppointmentsPage from '../pages/patient/PatientAppointmentsPage';
import PatientAppointmentDetailsPage from '../pages/patient/PatientAppointmentDetailsPage';
import PatientMedicationsPage from '../pages/patient/PatientMedicationsPage';
import PatientProfilePage from '../pages/patient/PatientProfilePage';
import PatientBookingPage from '../pages/patient/PatientBookingPage';
import PatientBookingConfirmationPage from '../pages/patient/PatientBookingConfirmationPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* 1. Public Marketing Landing Page at root */}
      <Route path="/" element={<LandingPage />} />

      {/* 2. Public Auth Routes with Split Layout */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
      </Route>

      {/* 3. Protected Dashboard Routes with Shared DashboardLayout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/design-system" element={<DesignSystemShowcase />} />
          <Route path="/settings" element={<HomePage />} />

          {/* Patient Portal Protected Routes (Role: PATIENT or ADMIN) */}
          <Route element={<RoleRoute allowedRoles={['patient', 'admin']} />}>
            <Route path="/dashboard" element={<PatientDashboardPage />} />
            <Route path="/patient" element={<PatientDashboardPage />} />
            <Route path="/patient/dashboard" element={<PatientDashboardPage />} />
            <Route path="/patient/doctors" element={<PatientDoctorsPage />} />
            <Route path="/patient/doctors/:id" element={<PatientDoctorProfilePage />} />
            <Route path="/patient/book" element={<PatientBookingPage />} />
            <Route path="/patient/book/:doctorId" element={<PatientBookingPage />} />
            <Route path="/patient/booking/confirmation/:id" element={<PatientBookingConfirmationPage />} />
            <Route path="/patient/appointments" element={<PatientAppointmentsPage />} />
            <Route path="/patient/appointments/:id" element={<PatientAppointmentDetailsPage />} />
            <Route path="/patient/medications" element={<PatientMedicationsPage />} />
            <Route path="/patient/profile" element={<PatientProfilePage />} />
            <Route path="/appointments" element={<PatientAppointmentsPage />} />
          </Route>

          {/* Doctor Portal Protected Routes (Role: DOCTOR or ADMIN) */}
          <Route element={<RoleRoute allowedRoles={['doctor', 'admin']} />}>
            <Route path="/doctor" element={<DoctorDashboardPage />} />
            <Route path="/doctor/dashboard" element={<DoctorDashboardPage />} />
            <Route path="/doctor/appointments" element={<DoctorAppointmentsPage />} />
            <Route path="/doctor/appointments/:id" element={<DoctorAppointmentDetailsPage />} />
            <Route path="/doctor/schedule" element={<DoctorSchedulePage />} />
            <Route path="/doctor/profile" element={<DoctorProfilePage />} />
          </Route>

          {/* Admin Portal Protected Routes (Role: ADMIN only) */}
          <Route element={<RoleRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/doctors" element={<AdminDoctorsPage />} />
            <Route path="/admin/doctors/create" element={<AdminDoctorCreatePage />} />
            <Route path="/admin/doctors/:id" element={<AdminDoctorDetailsPage />} />
            <Route path="/admin/appointments" element={<AdminAppointmentsPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
          </Route>
        </Route>
      </Route>

      {/* 4. 404 Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
