import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { calculateResults } from '../utils/calculateResults.js';
import { TallyCount } from '../components/TallyCount.jsx';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion.js';
import './PollDetail.css';

export function PollDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [poll, setPoll] = useState(null);
  const [error, setError] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
  const prefersReducedMotion = usePrefersReducedMotion();

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
      setError(err.response?.data?.error?.message || "Vote didn't go through. Try again.");
    }
  }

  if (error) return <p role="alert" className="poll-detail__status">{error}</p>;
  if (!poll) return <p className="poll-detail__status">Loading…</p>;

  const hasVoted = poll.votedOptionIndex !== null;

  if (!user || !hasVoted) {
    return (
      <div>
        <h1 className="poll-detail__question">{poll.question}</h1>
        {!user && <p className="poll-detail__status">Log in to vote.</p>}
        {user && (
          <form onSubmit={handleVote} className="poll-vote-form">
            {poll.options.map((opt, i) => (
              <label key={i} className="poll-vote-row">
                <input
                  type="radio"
                  name="option"
                  checked={selectedOption === i}
                  onChange={() => setSelectedOption(i)}
                />
                {opt.text}
              </label>
            ))}
            {error && <p role="alert" className="poll-detail__status">{error}</p>}
            <button type="submit" className="poll-vote-form__submit">
              Vote
            </button>
          </form>
        )}
      </div>
    );
  }

  const results = calculateResults(poll.options);
  const leadingVotes = Math.max(...results.map((r) => r.votes));

  return (
    <div>
      <h1 className="poll-detail__question">{poll.question}</h1>
      <ul className="poll-results" aria-live="polite">
        {results.map((opt, i) => {
          const isMine = poll.votedOptionIndex === i;
          const isLeading = opt.votes === leadingVotes && leadingVotes > 0;
          return (
            <li key={opt.text} className="poll-result-row">
              <div className="poll-result-row__label">
                <span>{opt.text}</span>
                {isMine && (
                  <span className="poll-result-row__mine">
                    <span aria-hidden="true" className="poll-result-row__mine-dot" />
                    <span>(your vote)</span>
                  </span>
                )}
              </div>
              <div className="poll-result-row__bar-track">
                <div
                  className={
                    'poll-result-row__bar' +
                    (isLeading ? ' poll-result-row__bar--leading' : '') +
                    (prefersReducedMotion ? ' poll-result-row__bar--static' : '')
                  }
                  style={{ transform: `scaleX(${opt.percentage / 100})` }}
                />
              </div>
              <div className="poll-result-row__meta">
                <TallyCount count={opt.votes} />
                <span className="poll-result-row__percentage">{opt.percentage}%</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
