import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage';
import * as AuthContextModule from '../context/AuthContext';

// Mock GoogleOAuthProvider & GoogleLogin components
vi.mock('@react-oauth/google', () => ({
  GoogleLogin: ({ onSuccess, onError }) => (
    <button
      data-testid="mock-google-login-btn"
      onClick={() => onSuccess({ credential: 'mock_jwt_credential_token' })}
    >
      Sign in with Google
    </button>
  ),
  GoogleOAuthProvider: ({ children }) => <div>{children}</div>,
}));

vi.mock('../components/ui/Toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
  ToastProvider: ({ children }) => <div>{children}</div>,
}));

describe('Google Sign-In UI Integration', () => {
  it('should render Google Sign-In button and invoke googleLogin on credential success', async () => {
    const mockGoogleLogin = vi.fn().mockResolvedValue({
      data: {
        user: { name: 'Google Test User', role: 'patient' },
      },
    });

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      login: vi.fn(),
      googleLogin: mockGoogleLogin,
      isAuthenticated: false,
      loading: false,
      user: null,
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const googleBtn = screen.getByTestId('mock-google-login-btn');
    expect(googleBtn).toBeInTheDocument();
    expect(googleBtn.textContent).toBe('Sign in with Google');

    // Click Google Login Button
    fireEvent.click(googleBtn);

    expect(mockGoogleLogin).toHaveBeenCalledWith('mock_jwt_credential_token');
  });
});
