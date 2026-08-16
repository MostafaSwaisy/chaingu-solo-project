import { Routes, Route, Link } from 'react-router-dom';
import { Login } from './pages/Login.jsx';
import { Register } from './pages/Register.jsx';
import { PollList } from './pages/PollList.jsx';
import { CreatePoll } from './pages/CreatePoll.jsx';
import { PollDetail } from './pages/PollDetail.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { useAuth } from './context/AuthContext.jsx';

export default function App() {
  const { user, logout } = useAuth();
  return (
    <div>
      <nav>
        <Link to="/">Polls</Link>
        {user ? (
          <>
            <Link to="/polls/new">Create Poll</Link>
            <button onClick={logout}>Log out ({user.username})</button>
          </>
        ) : (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </nav>
      <Routes>
        <Route path="/" element={<PollList />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/polls/new"
          element={
            <ProtectedRoute>
              <CreatePoll />
            </ProtectedRoute>
          }
        />
        <Route path="/polls/:id" element={<PollDetail />} />
      </Routes>
    </div>
  );
}
