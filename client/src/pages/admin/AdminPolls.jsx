import { useEffect, useState } from 'react';
import { api } from '../../api/axios.js';
import './Admin.css';

function statusFor(poll) {
  if (poll.deletedAt) return 'Deleted';
  if (poll.isEnded) return 'Ended';
  return 'Active';
}

export function AdminPolls() {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/polls').then(({ data }) => {
      setPolls(data.polls);
      setLoading(false);
    });
  }, []);

  async function handleEnd(id) {
    const { data } = await api.post(`/admin/polls/${id}/end`);
    setPolls((prev) => prev.map((p) => (p.id === id ? data.poll : p)));
  }

  async function handleDelete(id) {
    await api.delete(`/admin/polls/${id}`);
    setPolls((prev) => prev.map((p) => (p.id === id ? { ...p, deletedAt: new Date().toISOString() } : p)));
  }

  return (
    <section>
      <h2 className="admin-section__heading">Polls</h2>
      {loading ? (
        <p className="admin-section__status">Loading polls…</p>
      ) : polls.length === 0 ? (
        <p className="admin-section__status">No polls yet.</p>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Question</th>
                <th>Created</th>
                <th>Ends</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {polls.map((poll) => (
                <tr key={poll.id}>
                  <td>{poll.question}</td>
                  <td>{new Date(poll.createdAt).toLocaleString()}</td>
                  <td>{poll.expiresAt ? new Date(poll.expiresAt).toLocaleString() : '—'}</td>
                  <td>{statusFor(poll)}</td>
                  <td>
                    {!poll.deletedAt && !poll.isEnded && (
                      <button className="admin-table__action" onClick={() => handleEnd(poll.id)}>
                        End now
                      </button>
                    )}
                    {!poll.deletedAt && (
                      <button className="admin-table__action" onClick={() => handleDelete(poll.id)}>
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
