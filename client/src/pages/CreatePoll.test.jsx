import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { CreatePoll } from './CreatePoll.jsx';
import { api } from '../api/axios.js';

vi.mock('../api/axios.js', () => ({
  api: { post: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('CreatePoll page', () => {
  it('starts with two option inputs and can add a third', async () => {
    render(
      <MemoryRouter>
        <CreatePoll />
      </MemoryRouter>
    );
    expect(screen.getByLabelText('Option 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Option 2')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Add option'));
    expect(screen.getByLabelText('Option 3')).toBeInTheDocument();
  });

  it('submits the question and options', async () => {
    api.post.mockResolvedValueOnce({ data: { poll: { id: 'p1' } } });
    render(
      <MemoryRouter>
        <CreatePoll />
      </MemoryRouter>
    );
    await userEvent.type(screen.getByLabelText('Question'), 'Best color?');
    await userEvent.type(screen.getByLabelText('Option 1'), 'Red');
    await userEvent.type(screen.getByLabelText('Option 2'), 'Blue');
    await userEvent.click(screen.getByRole('button', { name: 'Create poll' }));
    expect(api.post).toHaveBeenCalledWith('/polls', { question: 'Best color?', options: ['Red', 'Blue'] });
  });

  it('includes expiresAt as an ISO string when an end time is set', async () => {
    api.post.mockResolvedValueOnce({ data: { poll: { id: 'p1' } } });
    render(
      <MemoryRouter>
        <CreatePoll />
      </MemoryRouter>
    );
    await userEvent.type(screen.getByLabelText('Question'), 'Best color?');
    await userEvent.type(screen.getByLabelText('Option 1'), 'Red');
    await userEvent.type(screen.getByLabelText('Option 2'), 'Blue');
    await userEvent.type(screen.getByLabelText('Ends at (optional)'), '2030-01-01T10:00');
    await userEvent.click(screen.getByRole('button', { name: 'Create poll' }));
    expect(api.post).toHaveBeenCalledWith('/polls', {
      question: 'Best color?',
      options: ['Red', 'Blue'],
      expiresAt: new Date('2030-01-01T10:00').toISOString(),
    });
  });

  it('shows an error message when creation fails', async () => {
    api.post.mockRejectedValueOnce({ response: { data: { error: { message: 'a poll must have between 2 and 6 options' } } } });
    render(
      <MemoryRouter>
        <CreatePoll />
      </MemoryRouter>
    );
    await userEvent.type(screen.getByLabelText('Question'), 'Best color?');
    await userEvent.type(screen.getByLabelText('Option 1'), 'Red');
    await userEvent.type(screen.getByLabelText('Option 2'), 'Blue');
    await userEvent.click(screen.getByRole('button', { name: 'Create poll' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('a poll must have between 2 and 6 options');
  });
});
