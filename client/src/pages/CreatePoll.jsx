import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axios.js';
import './CreatePoll.css';

export function CreatePoll() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [expiresAt, setExpiresAt] = useState('');
  const [error, setError] = useState('');

  function updateOption(index, value) {
    setOptions((prev) => prev.map((opt, i) => (i === index ? value : opt)));
  }

  function addOption() {
    if (options.length < 6) setOptions((prev) => [...prev, '']);
  }

  function removeOption(index) {
    if (options.length > 2) setOptions((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const body = { question, options };
      if (expiresAt) {
        body.expiresAt = new Date(expiresAt).toISOString();
      }
      const { data } = await api.post('/polls', body);
      navigate(`/polls/${data.poll.id}`);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'failed to create poll');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="create-poll">
      <h1 className="create-poll__heading">Create Poll</h1>
      <label className="create-poll__field">
        Question
        <input
          className="create-poll__input"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
      </label>
      {options.map((opt, i) => (
        <div key={i} className="create-poll__option-row">
          <label className="create-poll__field">
            {`Option ${i + 1}`}
            <input
              className="create-poll__input"
              autoComplete="off"
              value={opt}
              onChange={(e) => updateOption(i, e.target.value)}
            />
          </label>
          {options.length > 2 && (
            <button
              type="button"
              className="create-poll__remove"
              onClick={() => removeOption(i)}
            >
              Remove
            </button>
          )}
        </div>
      ))}
      {options.length < 6 && (
        <button type="button" className="create-poll__add" onClick={addOption}>
          Add option
        </button>
      )}
      <label className="create-poll__field">
        Ends at (optional)
        <input
          className="create-poll__input"
          type="datetime-local"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
        />
      </label>
      {error && <p role="alert" className="create-poll__error">{error}</p>}
      <button type="submit" className="create-poll__submit">
        Create poll
      </button>
    </form>
  );
}
