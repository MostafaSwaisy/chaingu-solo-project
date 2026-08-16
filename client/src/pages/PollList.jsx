import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/axios.js';
import { TallyCount } from '../components/TallyCount.jsx';
import './PollList.css';

export function PollList() {
  const [polls, setPolls] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/polls')
      .then(({ data }) => {
        if (!cancelled) setPolls(data.polls);
      })
      .catch(() => {
        if (!cancelled) setError('failed to load polls');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <p className="poll-list__status">Loading polls…</p>;
  if (error) return <p role="alert" className="poll-list__status">{error}</p>;

  if (polls.length === 0) {
    return <p className="poll-list__status">No polls yet. Start one.</p>;
  }

  return (
    <div>
      <h1 className="poll-list__heading">Polls</h1>
      <ul className="poll-list">
        {polls.map((poll) => (
          <li key={poll.id} className="poll-card">
            <Link to={`/polls/${poll.id}`} className="poll-card__link">
              <span className="poll-card__question">{poll.question}</span>
              <TallyCount count={poll.totalVotes} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
