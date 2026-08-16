import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PollList } from './PollList.jsx';
import { api } from '../api/axios.js';

vi.mock('../api/axios.js', () => ({
  api: { get: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PollList page', () => {
  it('renders polls returned from the API', async () => {
    api.get.mockResolvedValueOnce({ data: { polls: [{ id: '1', question: 'Best color?', totalVotes: 3 }] } });
    render(
      <MemoryRouter>
        <PollList />
      </MemoryRouter>
    );
    expect(await screen.findByText('Best color?')).toBeInTheDocument();
  });

  it('shows an error message when the request fails', async () => {
    api.get.mockRejectedValueOnce(new Error('network error'));
    render(
      <MemoryRouter>
        <PollList />
      </MemoryRouter>
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('failed to load polls');
  });

  it('shows an empty-state message when there are no polls', async () => {
    api.get.mockResolvedValueOnce({ data: { polls: [] } });
    render(
      <MemoryRouter>
        <PollList />
      </MemoryRouter>
    );
    expect(await screen.findByText('No polls yet. Start one.')).toBeInTheDocument();
  });
});
