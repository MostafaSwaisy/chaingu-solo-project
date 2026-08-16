import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './Auth.css';

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(username, email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h1 className="auth-form__heading">Register</h1>
      <label className="auth-form__field">
        Username
        <input
          className="auth-form__input"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </label>
      <label className="auth-form__field">
        Email
        <input
          className="auth-form__input"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label className="auth-form__field">
        Password
        <input
          className="auth-form__input"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {error && <p role="alert" className="auth-form__error">{error}</p>}
      <button type="submit" className="auth-form__submit" disabled={submitting}>
        {submitting ? 'Creating account…' : 'Register'}
      </button>
      <p className="auth-form__switch">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </form>
  );
}
