import { useNavigate } from 'react-router-dom';
import './BackButton.css';

interface BackButtonProps {
  /** Куда перейти, если в истории браузера некуда возвращаться */
  fallback?: string;
  label?: string;
  className?: string;
}

export function BackButton({
  fallback = '/',
  label = 'Назад',
  className = '',
}: BackButtonProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    const idx = window.history.state?.idx as number | undefined;
    if (typeof idx === 'number' && idx > 0) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };

  return (
    <button
      type="button"
      className={`back-btn ${className}`.trim()}
      onClick={handleBack}
      aria-label={label}
    >
      <span className="back-btn-icon" aria-hidden>
        ←
      </span>
      {label}
    </button>
  );
}

export function getStoreBackFallback(pathname: string): string {
  if (pathname === '/cart') return '/catalog';
  if (pathname.startsWith('/account')) return '/';
  if (pathname.startsWith('/product/')) return '/catalog';
  if (/^\/catalog\/[^/]+/.test(pathname)) return '/catalog';
  if (pathname.startsWith('/catalog')) return '/';
  return '/';
}

export function getStoreBackLabel(pathname: string): string {
  if (pathname === '/cart') return 'Вернуться к покупкам';
  return 'Назад';
}

export function getAdminBackFallback(pathname: string): string {
  if (/^\/admin\/products\//.test(pathname)) return '/admin/products';
  if (pathname === '/admin/orders' || pathname === '/admin/customers') return '/admin';
  return '/admin';
}
