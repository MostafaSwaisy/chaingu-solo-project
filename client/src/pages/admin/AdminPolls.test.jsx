import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminPolls } from './AdminPolls.jsx';
import { api } from '../../api/axios.js';

vi.mock('../../api/axios.js', () => ({
  api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AdminPolls page', () => {
  it('renders polls with their status', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        polls: [
          { id: 'p1', question: 'Best color?', createdAt: '2026-01-01T00:00:00.000Z', expiresAt: null, isEnded: false, deletedAt: null },
          { id: 'p2', question: 'Best food?', createdAt: '2026-01-02T00:00:00.000Z', expiresAt: '2026-01-03T00:00:00.000Z', isEnded: true, deletedAt: null },
        ],
      },
    });
    render(<AdminPolls />);
    expect(await screen.findByText('Best color?')).toBeInTheDocument();
    expect(screen.getByText('Best food?')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Ended')).toBeInTheDocument();
  });

  it('ends a poll immediately via the End now button', async () => {
    api.get.mockResolvedValueOnce({
      data: { polls: [{ id: 'p1', question: 'Best color?', createdAt: '2026-01-01T00:00:00.000Z', expiresAt: null, isEnded: false, deletedAt: null }] },
    });
    api.post.mockResolvedValueOnce({
      data: { poll: { id: 'p1', question: 'Best color?', createdAt: '2026-01-01T00:00:00.000Z', expiresAt: '2026-01-01T01:00:00.000Z', isEnded: true, deletedAt: null } },
    });
    render(<AdminPolls />);
    await screen.findByText('Best color?');
    await userEvent.click(screen.getByRole('button', { name: 'End now' }));
    expect(api.post).toHaveBeenCalledWith('/admin/polls/p1/end');
    expect(await screen.findByText('Ended')).toBeInTheDocument();
  });

  it('soft-deletes a poll via the Delete button', async () => {
    api.get.mockResolvedValueOnce({
      data: { polls: [{ id: 'p1', question: 'Best color?', createdAt: '2026-01-01T00:00:00.000Z', expiresAt: null, isEnded: false, deletedAt: null }] },
    });
    api.delete.mockResolvedValueOnce({});
    render(<AdminPolls />);
    await screen.findByText('Best color?');
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(api.delete).toHaveBeenCalledWith('/admin/polls/p1');
    expect(await screen.findByText('Deleted')).toBeInTheDocument();
  });
});
