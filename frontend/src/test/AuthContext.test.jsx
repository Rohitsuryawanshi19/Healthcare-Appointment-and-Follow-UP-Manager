import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

vi.mock('../services/authService', () => ({
  authService: {
    getMe: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    googleAuth: vi.fn(),
    logout: vi.fn(),
  },
}));

function TestConsumer() {
  const { user, isAuthenticated, loading, login, logout, googleLogin } = useAuth();

  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="auth">{String(isAuthenticated)}</span>
      <span data-testid="user-email">{user?.email || 'none'}</span>
      <button onClick={() => login({ email: 'test@demo.com', password: 'Password123!' })}>
        Trigger Login
      </button>
      <button onClick={() => googleLogin('mock_google_id_token')}>
        Trigger Google Login
      </button>
      <button onClick={() => logout()}>Trigger Logout</button>
    </div>
  );
}

describe('AuthContext Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should restore existing session on mount when getMe returns user', async () => {
    authService.getMe.mockResolvedValueOnce({
      data: {
        user: {
          _id: 'user_123',
          name: 'Existing Patient',
          email: 'patient@demo.com',
          role: 'patient',
        },
      },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('loading').textContent).toBe('true');

    // Wait for session check
    await screen.findByText('patient@demo.com');
    expect(screen.getByTestId('loading').textContent).toBe('false');
    expect(screen.getByTestId('auth').textContent).toBe('true');
    expect(screen.getByTestId('user-email').textContent).toBe('patient@demo.com');
  });

  it('should handle unauthenticated session on mount gracefully', async () => {
    authService.getMe.mockRejectedValueOnce(new Error('Unauthorized'));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await screen.findByText('none');
    expect(screen.getByTestId('loading').textContent).toBe('false');
    expect(screen.getByTestId('auth').textContent).toBe('false');
  });

  it('should update user state on login and clear on logout', async () => {
    authService.getMe.mockRejectedValueOnce(new Error('Unauthorized'));
    authService.login.mockResolvedValueOnce({
      data: {
        user: {
          _id: 'user_login',
          name: 'Logged In User',
          email: 'test@demo.com',
          role: 'patient',
        },
      },
    });
    authService.logout.mockResolvedValueOnce({ data: { success: true } });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await screen.findByText('none');

    // Perform Login
    await act(async () => {
      screen.getByText('Trigger Login').click();
    });

    expect(screen.getByTestId('user-email').textContent).toBe('test@demo.com');
    expect(screen.getByTestId('auth').textContent).toBe('true');

    // Perform Logout
    await act(async () => {
      screen.getByText('Trigger Logout').click();
    });

    expect(screen.getByTestId('user-email').textContent).toBe('none');
    expect(screen.getByTestId('auth').textContent).toBe('false');
  });

  it('should update user state on Google login', async () => {
    authService.getMe.mockRejectedValueOnce(new Error('Unauthorized'));
    authService.googleAuth.mockResolvedValueOnce({
      data: {
        user: {
          _id: 'google_user_1',
          name: 'Google Auth User',
          email: 'google@demo.com',
          role: 'patient',
          authProvider: 'google',
        },
      },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await screen.findByText('none');

    await act(async () => {
      screen.getByText('Trigger Google Login').click();
    });

    expect(screen.getByTestId('user-email').textContent).toBe('google@demo.com');
    expect(screen.getByTestId('auth').textContent).toBe('true');
  });
});
