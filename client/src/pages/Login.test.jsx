import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Login } from './Login.jsx';
import { useAuth } from '../context/AuthContext.jsx';

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Login page', () => {
  it('calls login with the entered credentials', async () => {
    const login = vi.fn().mockResolvedValue(undefined);
    useAuth.mockReturnValue({ login });
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    await userEvent.type(screen.getByLabelText('Username'), 'alice');
    await userEvent.type(screen.getByLabelText('Password'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(login).toHaveBeenCalledWith('alice', 'secret123');
  });

  it('shows an error message when login fails', async () => {
    const login = vi.fn().mockRejectedValue({ response: { data: { error: { message: 'invalid credentials' } } } });
    useAuth.mockReturnValue({ login });
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    await userEvent.type(screen.getByLabelText('Username'), 'alice');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('invalid credentials');
  });

  it('shows a loading label while the request is in flight', async () => {
    let resolveLogin;
    const login = vi.fn(() => new Promise((resolve) => { resolveLogin = resolve; }));
    useAuth.mockReturnValue({ login });
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    await userEvent.type(screen.getByLabelText('Username'), 'alice');
    await userEvent.type(screen.getByLabelText('Password'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(screen.getByRole('button', { name: 'Logging in…' })).toBeInTheDocument();
    resolveLogin();
  });
});
