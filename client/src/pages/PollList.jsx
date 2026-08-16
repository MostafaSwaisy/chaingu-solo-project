import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/axios.js';

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

  if (loading) return <p>Loading polls...</p>;
  if (error) return <p role="alert">{error}</p>;

  return (
    <div>
      <h1>Polls</h1>
      <ul>
        {polls.map((poll) => (
          <li key={poll.id}>
            <Link to={`/polls/${poll.id}`}>{poll.question}</Link> ({poll.totalVotes} votes)
          </li>
        ))}
      </ul>
    </div>
  );
}
