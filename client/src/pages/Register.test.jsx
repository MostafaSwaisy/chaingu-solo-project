import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Register } from './Register.jsx';
import { useAuth } from '../context/AuthContext.jsx';

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Register page', () => {
  it('calls register with the entered fields', async () => {
    const register = vi.fn().mockResolvedValue(undefined);
    useAuth.mockReturnValue({ register });
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    await userEvent.type(screen.getByLabelText('Username'), 'alice');
    await userEvent.type(screen.getByLabelText('Email'), 'alice@test.com');
    await userEvent.type(screen.getByLabelText('Password'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Register' }));
    expect(register).toHaveBeenCalledWith('alice', 'alice@test.com', 'secret123');
  });

  it('shows an error message when registration fails', async () => {
    const register = vi.fn().mockRejectedValue({ response: { data: { error: { message: 'username or email already in use' } } } });
    useAuth.mockReturnValue({ register });
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    await userEvent.type(screen.getByLabelText('Username'), 'alice');
    await userEvent.type(screen.getByLabelText('Email'), 'alice@test.com');
    await userEvent.type(screen.getByLabelText('Password'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Register' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('username or email already in use');
  });

  it('shows a loading label while the request is in flight', async () => {
    let resolveRegister;
    const register = vi.fn(() => new Promise((resolve) => { resolveRegister = resolve; }));
    useAuth.mockReturnValue({ register });
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    await userEvent.type(screen.getByLabelText('Username'), 'alice');
    await userEvent.type(screen.getByLabelText('Email'), 'alice@test.com');
    await userEvent.type(screen.getByLabelText('Password'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Register' }));
    expect(screen.getByRole('button', { name: 'Creating account…' })).toBeInTheDocument();
    resolveRegister();
  });
});
