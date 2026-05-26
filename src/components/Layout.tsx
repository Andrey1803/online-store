import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { useStore } from '../context/StoreContext';
import { useCart } from '../context/CartContext';
import { BackButton, getStoreBackFallback, getStoreBackLabel } from './BackButton';
import { SiteNotice } from './SiteNotice';
import { CompanyRequisites } from './CompanyRequisites';
import { COMPANY } from '../data/company';
import './Layout.css';

type BuildInfo = { sha: string; builtAt: string };

export function Layout() {
  const { site } = useStore();
  const { totalCount } = useCart();
  const { user, isAuthenticated } = useCustomerAuth();
  const location = useLocation();
  const showBack = location.pathname !== '/';
  const [buildInfo, setBuildInfo] = useState<BuildInfo | null>(null);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    fetch('/build-info.json', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: BuildInfo | null) => setBuildInfo(data))
      .catch(() => setBuildInfo(null));
  }, []);

  return (
    <div className="app">
      <SiteNotice />
      <header className="header">
        <div className="header-top">
          <span>{site.city}</span>
          <a href={site.phoneHref}>{site.phone}</a>
        </div>
        <div className="header-main">
          {showBack && (
            <BackButton
              className="back-btn--header"
              fallback={getStoreBackFallback(location.pathname)}
              label={getStoreBackLabel(location.pathname)}
            />
          )}
          <Link to="/" className="logo">
            <span className="logo-icon">💧</span>
            <span>
              <strong>{site.name}</strong>
              <small>{site.tagline}</small>
            </span>
          </Link>
          <button
            type="button"
            className="nav-toggle"
            aria-expanded={navOpen}
            aria-controls="site-nav"
            onClick={() => setNavOpen((o) => !o)}
          >
            {navOpen ? '✕' : '☰'}
          </button>
          <nav id="site-nav" className={`nav${navOpen ? ' nav--open' : ''}`}>
            <Link to="/catalog">Каталог</Link>
            <Link to="/delivery">Доставка</Link>
            <Link to="/contacts">Контакты</Link>
            <a href={site.phoneHref} className="nav-call">
              Позвонить
            </a>
          </nav>
          <Link
            to={isAuthenticated ? '/account' : '/account/login'}
            className="account-btn"
            title={isAuthenticated ? user?.name : 'Войти'}
          >
            {isAuthenticated ? `👤 ${user?.name.split(' ')[0] ?? 'Кабинет'}` : 'Войти'}
          </Link>
          <Link to="/cart" className="cart-btn">
            🛒 Корзина
            {totalCount > 0 && <span className="cart-badge">{totalCount}</span>}
          </Link>
        </div>
      </header>
      <a href={site.phoneHref} className="mobile-call-bar">
        📞 {site.phone}
      </a>

      <main className="main">
        <Outlet />
      </main>

      <footer className="footer">
        <div className="footer-grid">
          <div>
            <strong>{site.name}</strong>
            <p>Насосное оборудование, автоматика, баки и комплектующие.</p>
          </div>
          <div>
            <strong>Каталог</strong>
            <Link to="/catalog/nasosy">Насосы</Link>
            <Link to="/catalog/baki">Баки</Link>
            <Link to="/catalog/komplektuyushchie">Комплектующие</Link>
          </div>
          <div>
            <strong>Информация</strong>
            <Link to="/about">О компании</Link>
            <Link to="/delivery">Доставка и оплата</Link>
            <Link to="/contacts">Контакты</Link>
            <Link to="/terms">Условия заявки</Link>
            <Link to="/returns">Возврат и гарантия</Link>
            <Link to="/privacy">Персональные данные</Link>
          </div>
          <div>
            <strong>Контакты</strong>
            <a href={site.phoneHref}>{site.phone}</a>
            <a href={`mailto:${site.email}`}>{site.email}</a>
          </div>
        </div>
        <CompanyRequisites compact />
        <p className="footer-belgie">
          Зарегистрирован в реестре{' '}
          <a href={COMPANY.belgieUrl} target="_blank" rel="noopener noreferrer">
            БелГИЭ
          </a>
          , № {COMPANY.belgieId}
        </p>
        <p className="footer-copy">
          © {new Date().getFullYear()} {site.name}. {site.markupNote}
          {buildInfo && (
            <span className="footer-build" title={buildInfo.builtAt}>
              {' '}
              · сборка {buildInfo.sha}
            </span>
          )}
        </p>
      </footer>
    </div>
  );
}
