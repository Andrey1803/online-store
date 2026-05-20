import { useState } from 'react';
import { Link } from 'react-router-dom';
import './SiteNotice.css';

const STORAGE_KEY = 'akvasnab-site-notice-v1';

export function SiteNotice() {
  const [visible, setVisible] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) !== '1';
    } catch {
      return true;
    }
  });

  if (!visible) return null;

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  return (
    <div className="site-notice" role="dialog" aria-label="Уведомление о данных сайта">
      <div className="site-notice__inner">
        <p>
          Сайт использует технические данные в браузере (корзина, настройки, вход в личный кабинет) для
          работы магазина. Отправляя заявку или регистрируясь, вы соглашаетесь с обработкой персональных
          данных. Подробнее — в{' '}
          <Link to="/privacy" onClick={accept}>
            политике конфиденциальности
          </Link>
          .
        </p>
        <button type="button" className="btn btn-primary site-notice__btn" onClick={accept}>
          Понятно
        </button>
      </div>
    </div>
  );
}
