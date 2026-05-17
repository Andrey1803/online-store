import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { ADMIN } from '../config';
import {
  clearRememberedCredentials,
  loadRememberedCredentials,
  saveRememberedCredentials,
} from '../lib/adminCredentials';
import './admin.css';

const remembered = loadRememberedCredentials();

export function AdminLogin() {
  const { isAuthenticated, login } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? '/admin';

  const [username, setUsername] = useState(remembered?.login ?? '');
  const [password, setPassword] = useState(remembered?.password ?? '');
  const [remember, setRemember] = useState(Boolean(remembered));
  const [error, setError] = useState('');

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(username, password)) {
      if (remember) {
        saveRememberedCredentials({ login: username, password });
      } else {
        clearRememberedCredentials();
      }
      navigate(from, { replace: true });
    } else {
      setError('Неверный логин или пароль');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Вход в админку</h1>
        <p className="hint">
          По умолчанию: логин <code>{ADMIN.login}</code>, пароль <code>{ADMIN.password}</code>
          <br />
          Смените в файле <code>src/config.ts</code>
        </p>
        <form onSubmit={handleSubmit} className="admin-form">
          <label>
            Логин
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label>
            Пароль
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <label className="admin-form-row" style={{ marginTop: '0.25rem' }}>
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            Запомнить логин и пароль
          </label>
          {error && <p className="admin-error">{error}</p>}
          <button type="submit" className="admin-btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
            Войти
          </button>
        </form>
      </div>
    </div>
  );
}
