import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminDashboard } from './AdminDashboard.jsx';
import { api } from '../../api/axios.js';

vi.mock('../../api/axios.js', () => ({
  api: { get: vi.fn().mockResolvedValue({ data: { users: [], polls: [] } }), post: vi.fn(), delete: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
  api.get.mockResolvedValue({ data: { users: [], polls: [] } });
});

describe('AdminDashboard page', () => {
  it('shows the Users panel by default', async () => {
    render(<AdminDashboard />);
    expect(await screen.findByText('No users yet.')).toBeInTheDocument();
  });

  it('switches to the Polls panel when its tab is clicked', async () => {
    render(<AdminDashboard />);
    await screen.findByText('No users yet.');
    await userEvent.click(screen.getByRole('button', { name: 'Polls' }));
    expect(await screen.findByText('No polls yet.')).toBeInTheDocument();
  });
});
