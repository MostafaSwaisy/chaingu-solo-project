import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminUsers } from './AdminUsers.jsx';
import { api } from '../../api/axios.js';

vi.mock('../../api/axios.js', () => ({
  api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AdminUsers page', () => {
  it('renders users returned from the API', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        users: [
          { id: 'u1', username: 'alice', email: 'alice@test.com', isAdmin: false, deletedAt: null },
          { id: 'u2', username: 'bob', email: 'bob@test.com', isAdmin: true, deletedAt: null },
        ],
      },
    });
    render(<AdminUsers />);
    expect(await screen.findByText('alice')).toBeInTheDocument();
    expect(screen.getByText('bob')).toBeInTheDocument();
  });

  it('shows a Deleted status for a soft-deleted user and no delete button', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        users: [{ id: 'u1', username: 'alice', email: 'alice@test.com', isAdmin: false, deletedAt: '2026-01-01T00:00:00.000Z' }],
      },
    });
    render(<AdminUsers />);
    await screen.findByText('alice');
    expect(screen.getByText('Deleted')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
  });

  it('creates a user and adds it to the list', async () => {
    api.get.mockResolvedValueOnce({ data: { users: [] } });
    api.post.mockResolvedValueOnce({
      data: { user: { id: 'u3', username: 'carol', email: 'carol@test.com', isAdmin: false, deletedAt: null } },
    });
    render(<AdminUsers />);
    await screen.findByText('No users yet.');
    await userEvent.type(screen.getByLabelText('Username'), 'carol');
    await userEvent.type(screen.getByLabelText('Email'), 'carol@test.com');
    await userEvent.type(screen.getByLabelText('Password'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Create user' }));
    expect(api.post).toHaveBeenCalledWith('/admin/users', {
      username: 'carol',
      email: 'carol@test.com',
      password: 'secret123',
      isAdmin: false,
    });
    expect(await screen.findByText('carol')).toBeInTheDocument();
  });

  it('soft-deletes a user via the delete button', async () => {
    api.get.mockResolvedValueOnce({
      data: { users: [{ id: 'u1', username: 'alice', email: 'alice@test.com', isAdmin: false, deletedAt: null }] },
    });
    api.delete.mockResolvedValueOnce({});
    render(<AdminUsers />);
    await screen.findByText('alice');
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(api.delete).toHaveBeenCalledWith('/admin/users/u1');
    expect(await screen.findByText('Deleted')).toBeInTheDocument();
  });
});
