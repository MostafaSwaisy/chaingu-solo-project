import { useState } from 'react';
import { AdminUsers } from './AdminUsers.jsx';
import { AdminPolls } from './AdminPolls.jsx';
import './Admin.css';

export function AdminDashboard() {
  const [tab, setTab] = useState('users');

  return (
    <div>
      <h1>Admin</h1>
      <div className="admin-tabs">
        <button
          className={`admin-tabs__button${tab === 'users' ? ' admin-tabs__button--active' : ''}`}
          onClick={() => setTab('users')}
        >
          Users
        </button>
        <button
          className={`admin-tabs__button${tab === 'polls' ? ' admin-tabs__button--active' : ''}`}
          onClick={() => setTab('polls')}
        >
          Polls
        </button>
      </div>
      {tab === 'users' ? <AdminUsers /> : <AdminPolls />}
    </div>
  );
}
