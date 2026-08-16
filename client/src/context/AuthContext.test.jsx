import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext.jsx';
import { api } from '../api/axios.js';

vi.mock('../api/axios.js', () => ({
  api: { post: vi.fn() },
}));

function TestConsumer() {
  const { user, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="user">{user ? user.username : 'none'}</span>
      <button onClick={() => login('alice', 'secret123')}>login</button>
      <button onClick={logout}>logout</button>
    </div>
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('AuthContext', () => {
  it('stores the user after a successful login', async () => {
    api.post.mockResolvedValueOnce({ data: { token: 'tok', user: { id: '1', username: 'alice' } } });
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    await userEvent.click(screen.getByText('login'));
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('alice'));
    expect(localStorage.getItem('pollhub_token')).toBe('tok');
  });

  it('sends the login value as the identifier field, so it works for a username or an email', async () => {
    api.post.mockResolvedValueOnce({ data: { token: 'tok', user: { id: '1', username: 'alice' } } });
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    await userEvent.click(screen.getByText('login'));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/auth/login', { identifier: 'alice', password: 'secret123' }));
  });

  it('clears the user on logout', async () => {
    api.post.mockResolvedValueOnce({ data: { token: 'tok', user: { id: '1', username: 'alice' } } });
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    await userEvent.click(screen.getByText('login'));
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('alice'));
    await userEvent.click(screen.getByText('logout'));
    expect(screen.getByTestId('user')).toHaveTextContent('none');
    expect(localStorage.getItem('pollhub_token')).toBeNull();
  });
});
