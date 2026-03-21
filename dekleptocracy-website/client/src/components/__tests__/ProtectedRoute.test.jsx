import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import * as auth from '../../utils/auth';

// Mock the auth module
vi.mock('../../utils/auth', () => ({
  isAuthenticated: vi.fn(),
  verifyToken: vi.fn(),
  logout: vi.fn(),
}));

// Mock the CSS import
vi.mock('../ProtectedRoute.css', () => ({}));

const renderWithRouter = (ui, { route = '/protected', initialEntries = [route] } = {}) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/chatbot/login" element={<div>Login Page</div>} />
        <Route path="/protected" element={ui} />
      </Routes>
    </MemoryRouter>,
  );
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    auth.isAuthenticated.mockReturnValue(true);
    // Create a promise that never resolves to keep loading state
    auth.verifyToken.mockReturnValue(new Promise(() => {}));

    renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>,
    );

    expect(screen.getByText('Checking authentication...')).toBeInTheDocument();
  });

  it('renders children when authenticated and verified', async () => {
    auth.isAuthenticated.mockReturnValue(true);
    auth.verifyToken.mockResolvedValue(true);

    renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>,
    );

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  it('redirects to login when not authenticated', async () => {
    auth.isAuthenticated.mockReturnValue(false);

    renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>,
    );

    await waitFor(() => {
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  it('redirects to login when token verification fails', async () => {
    auth.isAuthenticated.mockReturnValue(true);
    auth.verifyToken.mockResolvedValue(false);

    renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>,
    );

    await waitFor(() => {
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    expect(auth.logout).toHaveBeenCalled();
  });

  it('calls logout when verification throws error', async () => {
    auth.isAuthenticated.mockReturnValue(true);
    auth.verifyToken.mockRejectedValue(new Error('Network error'));

    renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>,
    );

    await waitFor(() => {
      expect(auth.logout).toHaveBeenCalled();
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  it('displays spinner during loading', () => {
    auth.isAuthenticated.mockReturnValue(true);
    auth.verifyToken.mockReturnValue(new Promise(() => {}));

    renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>,
    );

    expect(document.querySelector('.protected-route__spinner')).toBeInTheDocument();
  });

  it('skips verifyToken if not authenticated', async () => {
    auth.isAuthenticated.mockReturnValue(false);

    renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>,
    );

    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    expect(auth.verifyToken).not.toHaveBeenCalled();
  });
});
