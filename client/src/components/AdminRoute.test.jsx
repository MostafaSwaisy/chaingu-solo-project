import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AdminRoute } from './AdminRoute.jsx';
import { useAuth } from '../context/AuthContext.jsx';

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: vi.fn(),
}));

function renderWithRoute(initialPath) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/" element={<div>home page</div>} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <div>admin content</div>
            </AdminRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('AdminRoute', () => {
  it('renders children when the user is an admin', () => {
    useAuth.mockReturnValue({ user: { id: '1', username: 'alice', isAdmin: true } });
    renderWithRoute('/admin');
    expect(screen.getByText('admin content')).toBeInTheDocument();
  });

  it('redirects to / when the user is not an admin', () => {
    useAuth.mockReturnValue({ user: { id: '1', username: 'alice', isAdmin: false } });
    renderWithRoute('/admin');
    expect(screen.getByText('home page')).toBeInTheDocument();
  });

  it('redirects to / when there is no user', () => {
    useAuth.mockReturnValue({ user: null });
    renderWithRoute('/admin');
    expect(screen.getByText('home page')).toBeInTheDocument();
  });
});
