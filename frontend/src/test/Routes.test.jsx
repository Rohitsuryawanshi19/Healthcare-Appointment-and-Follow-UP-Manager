import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../routes/ProtectedRoute';
import { RoleRoute } from '../routes/RoleRoute';
import * as AuthContextModule from '../context/AuthContext';

describe('ProtectedRoute & RoleRoute Guards', () => {
  it('should redirect unauthenticated users to /auth/login', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: false,
      loading: false,
      user: null,
      role: null,
    });

    render(
      <MemoryRouter initialEntries={['/patient/dashboard']}>
        <Routes>
          <Route path="/auth/login" element={<div>Login Page Screen</div>} />
          <Route
            path="/patient/dashboard"
            element={
              <ProtectedRoute>
                <div>Private Dashboard Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page Screen')).toBeInTheDocument();
    expect(screen.queryByText('Private Dashboard Content')).not.toBeInTheDocument();
  });

  it('should render protected children when user is authenticated', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: { name: 'Patient Alice', role: 'patient' },
      role: 'patient',
    });

    render(
      <MemoryRouter initialEntries={['/patient/dashboard']}>
        <Routes>
          <Route
            path="/patient/dashboard"
            element={
              <ProtectedRoute>
                <div>Private Dashboard Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Private Dashboard Content')).toBeInTheDocument();
  });

  it('should block unauthorized role in RoleRoute', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: { name: 'Patient Alice', role: 'patient' },
      role: 'patient',
    });

    render(
      <MemoryRouter initialEntries={['/doctor/dashboard']}>
        <Routes>
          <Route
            path="/doctor/dashboard"
            element={
              <RoleRoute allowedRoles={['doctor']}>
                <div>Doctor Only Workspace</div>
              </RoleRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Access Restricted')).toBeInTheDocument();
    expect(screen.queryByText('Doctor Only Workspace')).not.toBeInTheDocument();
  });

  it('should allow authorized role in RoleRoute', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: { name: 'Dr. House', role: 'doctor' },
      role: 'doctor',
    });

    render(
      <MemoryRouter initialEntries={['/doctor/dashboard']}>
        <Routes>
          <Route
            path="/doctor/dashboard"
            element={
              <RoleRoute allowedRoles={['doctor']}>
                <div>Doctor Only Workspace</div>
              </RoleRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Doctor Only Workspace')).toBeInTheDocument();
  });
});
