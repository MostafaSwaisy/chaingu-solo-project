import { useEffect, useState } from 'react';
import { api } from '../../api/axios.js';
import './Admin.css';

export function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');

  function loadUsers() {
    api.get('/admin/users').then(({ data }) => setUsers(data.users));
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/admin/users', { username, email, password, isAdmin });
      setUsers((prev) => [...prev, data.user]);
      setUsername('');
      setEmail('');
      setPassword('');
      setIsAdmin(false);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'failed to create user');
    }
  }

  async function handleDelete(id) {
    await api.delete(`/admin/users/${id}`);
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, deletedAt: new Date().toISOString() } : u)));
  }

  return (
    <section>
      <h2 className="admin-section__heading">Users</h2>
      <form onSubmit={handleCreate} className="admin-create-form">
        <label className="admin-create-form__field">
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>
        <label className="admin-create-form__field">
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="admin-create-form__field">
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <label className="admin-create-form__checkbox">
          <input type="checkbox" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} />
          Admin
        </label>
        {error && <p role="alert" className="admin-create-form__error">{error}</p>}
        <button type="submit" className="admin-create-form__submit">
          Create user
        </button>
      </form>

      {users.length === 0 ? (
        <p className="admin-section__status">No users yet.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td>{u.isAdmin ? 'Admin' : 'User'}</td>
                <td>{u.deletedAt ? 'Deleted' : 'Active'}</td>
                <td>
                  {!u.deletedAt && (
                    <button className="admin-table__action" onClick={() => handleDelete(u.id)}>
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
