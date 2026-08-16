import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axios.js';

export function CreatePoll() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
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
      const { data } = await api.post('/polls', { question, options });
      navigate(`/polls/${data.poll.id}`);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'failed to create poll');
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Create Poll</h1>
      <label>
        Question
        <input value={question} onChange={(e) => setQuestion(e.target.value)} />
      </label>
      {options.map((opt, i) => (
        <div key={i}>
          <label>
            {`Option ${i + 1}`}
            <input value={opt} onChange={(e) => updateOption(i, e.target.value)} />
          </label>
          {options.length > 2 && (
            <button type="button" onClick={() => removeOption(i)}>
              Remove
            </button>
          )}
        </div>
      ))}
      {options.length < 6 && (
        <button type="button" onClick={addOption}>
          Add option
        </button>
      )}
      {error && <p role="alert">{error}</p>}
      <button type="submit">Create poll</button>
    </form>
  );
}
