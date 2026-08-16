import { Routes, Route, Link } from 'react-router-dom';
import { Login } from './pages/Login.jsx';
import { Register } from './pages/Register.jsx';
import { PollList } from './pages/PollList.jsx';
import { CreatePoll } from './pages/CreatePoll.jsx';
import { PollDetail } from './pages/PollDetail.jsx';
import { AdminDashboard } from './pages/admin/AdminDashboard.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { AdminRoute } from './components/AdminRoute.jsx';
import { useAuth } from './context/AuthContext.jsx';
import './App.css';

export default function App() {
  const { user, logout } = useAuth();
  return (
    <div className="app-shell">
      <header className="nav">
        <Link to="/" className="nav__brand">
          PollHub
        </Link>
        <nav className="nav__links">
          {user ? (
            <>
              <Link to="/polls/new" className="nav__link">
                Create Poll
              </Link>
              {user.isAdmin && (
                <Link to="/admin" className="nav__link">
                  Admin
                </Link>
              )}
              <button className="nav__link nav__link--button" onClick={logout}>
                Log out ({user.username})
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav__link">
                Log in
              </Link>
              <Link to="/register" className="nav__link">
                Register
              </Link>
            </>
          )}
        </nav>
      </header>
      <main className="app-main">
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
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}
