import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PollDetail } from './PollDetail.jsx';
import { api } from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';

vi.mock('../api/axios.js', () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));
vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: vi.fn(),
}));

function renderPollDetail() {
  return render(
    <MemoryRouter initialEntries={['/polls/p1']}>
      <Routes>
        <Route path="/polls/:id" element={<PollDetail />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PollDetail page', () => {
  it('shows a vote form when the user has not voted yet', async () => {
    useAuth.mockReturnValue({ user: { id: 'u1', username: 'alice' } });
    api.get.mockResolvedValueOnce({
      data: {
        poll: {
          id: 'p1',
          question: 'Best color?',
          options: [{ text: 'Red', votes: 0 }, { text: 'Blue', votes: 0 }],
          totalVotes: 0,
          votedOptionIndex: null,
        },
      },
    });
    renderPollDetail();
    expect(await screen.findByText('Best color?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Vote' })).toBeInTheDocument();
  });

  it('shows results as percentages after the user has voted', async () => {
    useAuth.mockReturnValue({ user: { id: 'u1', username: 'alice' } });
    api.get.mockResolvedValueOnce({
      data: {
        poll: {
          id: 'p1',
          question: 'Best color?',
          options: [{ text: 'Red', votes: 3 }, { text: 'Blue', votes: 1 }],
          totalVotes: 4,
          votedOptionIndex: 0,
        },
      },
    });
    renderPollDetail();
    expect(await screen.findByText(/Red: 75%/)).toBeInTheDocument();
    expect(screen.getByText(/Blue: 25%/)).toBeInTheDocument();
  });

  it('casts a vote and re-renders with results', async () => {
    useAuth.mockReturnValue({ user: { id: 'u1', username: 'alice' } });
    api.get.mockResolvedValueOnce({
      data: {
        poll: {
          id: 'p1',
          question: 'Best color?',
          options: [{ text: 'Red', votes: 0 }, { text: 'Blue', votes: 0 }],
          totalVotes: 0,
          votedOptionIndex: null,
        },
      },
    });
    api.post.mockResolvedValueOnce({
      data: {
        poll: {
          id: 'p1',
          question: 'Best color?',
          options: [{ text: 'Red', votes: 1 }, { text: 'Blue', votes: 0 }],
          totalVotes: 1,
          votedOptionIndex: 0,
        },
      },
    });
    renderPollDetail();
    await screen.findByText('Best color?');
    await userEvent.click(screen.getAllByRole('radio')[0]);
    await userEvent.click(screen.getByRole('button', { name: 'Vote' }));
    expect(api.post).toHaveBeenCalledWith('/polls/p1/vote', { optionIndex: 0 });
    expect(await screen.findByText(/Red: 100%/)).toBeInTheDocument();
  });
});
