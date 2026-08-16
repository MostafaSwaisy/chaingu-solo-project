import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { calculateResults } from '../utils/calculateResults.js';

export function PollDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [poll, setPoll] = useState(null);
  const [error, setError] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);

  useEffect(() => {
    api
      .get(`/polls/${id}`)
      .then(({ data }) => setPoll(data.poll))
      .catch(() => setError('failed to load poll'));
  }, [id]);

  async function handleVote(e) {
    e.preventDefault();
    if (selectedOption === null) return;
    try {
      const { data } = await api.post(`/polls/${id}/vote`, { optionIndex: selectedOption });
      setPoll(data.poll);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'failed to vote');
    }
  }

  if (error) return <p role="alert">{error}</p>;
  if (!poll) return <p>Loading...</p>;

  const hasVoted = poll.votedOptionIndex !== null;

  if (!user || !hasVoted) {
    return (
      <div>
        <h1>{poll.question}</h1>
        {!user && <p>Log in to vote.</p>}
        {user && (
          <form onSubmit={handleVote}>
            {poll.options.map((opt, i) => (
              <label key={i}>
                <input
                  type="radio"
                  name="option"
                  checked={selectedOption === i}
                  onChange={() => setSelectedOption(i)}
                />
                {opt.text}
              </label>
            ))}
            <button type="submit">Vote</button>
          </form>
        )}
      </div>
    );
  }

  const results = calculateResults(poll.options);
  return (
    <div>
      <h1>{poll.question}</h1>
      <ul>
        {results.map((opt) => (
          <li key={opt.text}>
            {opt.text}: {opt.percentage}% ({opt.votes} votes)
          </li>
        ))}
      </ul>
    </div>
  );
}
