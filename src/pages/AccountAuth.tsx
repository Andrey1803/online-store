import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { PageMeta } from '../components/PageMeta';
import { STATIC_PAGE_SEO } from '../data/seo';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { ConsentField } from '../components/ConsentField';
import './Account.css';

type Tab = 'login' | 'register';

export function AccountAuth() {
  const { isAuthenticated, login, register } = useCustomerAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>(
    searchParams.get('tab') === 'register' ? 'register' : 'login',
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registerConsent, setRegisterConsent] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    passwordConfirm: '',
  });

  if (isAuthenticated) {
    return <Navigate to="/account" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(loginForm);
    setLoading(false);
    if (result.ok) {
      navigate('/account', { replace: true });
    } else {
      setError(result.error);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (registerForm.password !== registerForm.passwordConfirm) {
      setError('Пароли не совпадают');
      return;
    }
    if (!registerConsent) {
      setError('Необходимо согласие на обработку персональных данных');
      return;
    }
    setLoading(true);
    const result = await register({
      name: registerForm.name,
      email: registerForm.email,
      phone: registerForm.phone,
      password: registerForm.password,
    });
    setLoading(false);
    if (result.ok) {
      navigate('/account', { replace: true });
    } else {
      setError(result.error);
    }
  };

  const seo = STATIC_PAGE_SEO.accountLogin;

  return (
    <div className="account-page">
      <PageMeta title={seo.title} description={seo.description} path={seo.path} noindex />
      <div className="account-card">
        <h1>Личный кабинет</h1>
        <p className="account-lead">
          {tab === 'login'
            ? 'Войдите, чтобы видеть заявки и быстрее оформлять заказы'
            : 'Создайте аккаунт — данные подставятся в корзине автоматически'}
        </p>

        <div className="account-tabs">
          <button
            type="button"
            className={tab === 'login' ? 'active' : ''}
            onClick={() => {
              setTab('login');
              setError('');
            }}
          >
            Вход
          </button>
          <button
            type="button"
            className={tab === 'register' ? 'active' : ''}
            onClick={() => {
              setTab('register');
              setError('');
            }}
          >
            Регистрация
          </button>
        </div>

        {tab === 'login' ? (
          <form className="account-form" onSubmit={handleLogin}>
            <label>
              E-mail
              <input
                type="email"
                required
                autoComplete="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
              />
            </label>
            <label>
              Пароль
              <input
                type="password"
                required
                autoComplete="current-password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              />
            </label>
            {error && <p className="account-error">{error}</p>}
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? 'Вход…' : 'Войти'}
            </button>
          </form>
        ) : (
          <form className="account-form" onSubmit={handleRegister}>
            <label>
              Имя
              <input
                required
                autoComplete="name"
                value={registerForm.name}
                onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
              />
            </label>
            <label>
              E-mail
              <input
                type="email"
                required
                autoComplete="email"
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
              />
            </label>
            <label>
              Телефон
              <input
                type="tel"
                required
                placeholder="+375 29 ..."
                autoComplete="tel"
                value={registerForm.phone}
                onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
              />
            </label>
            <label>
              Пароль
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
              />
            </label>
            <label>
              Повторите пароль
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={registerForm.passwordConfirm}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, passwordConfirm: e.target.value })
                }
              />
            </label>
            <ConsentField
              id="register-consent"
              variant="registration"
              checked={registerConsent}
              onChange={setRegisterConsent}
            />
            {error && <p className="account-error">{error}</p>}
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading || !registerConsent}
            >
              {loading ? 'Регистрация…' : 'Зарегистрироваться'}
            </button>
          </form>
        )}

        <p className="account-footer-link">
          <Link to="/catalog">← В каталог</Link>
        </p>
      </div>
    </div>
  );
}
