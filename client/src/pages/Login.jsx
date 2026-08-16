import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './Auth.css';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(identifier, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h1 className="auth-form__heading">Log in</h1>
      <label className="auth-form__field">
        Username or email
        <input
          className="auth-form__input"
          autoComplete="username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />
      </label>
      <label className="auth-form__field">
        Password
        <input
          className="auth-form__input"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {error && <p role="alert" className="auth-form__error">{error}</p>}
      <button type="submit" className="auth-form__submit" disabled={submitting}>
        {submitting ? 'Logging in…' : 'Log in'}
      </button>
      <p className="auth-form__switch">
        No account? <Link to="/register">Register</Link>
      </p>
    </form>
  );
}
