import { VAT_PRICE_NOTE } from './data/company';

export interface SiteConfig {
  name: string;
  tagline: string;
  phone: string;
  phoneHref: string;
  email: string;
  city: string;
  markupNote: string;
  heroTitle: string;
  heroText: string;
}

export const DEFAULT_SITE: SiteConfig = {
  name: 'АкваСнаб',
  tagline: 'Насосы и водоснабжение',
  phone: '+375 (29) 147-21-08',
  phoneHref: 'tel:+375291472108',
  email: '1472108@mail.ru',
  city: 'Минск и область',
  markupNote: VAT_PRICE_NOTE,
  heroTitle: 'Насосы и водоснабжение под ключ',
  heroText:
    'Скважинные и дренажные насосы, станции, гидроаккумуляторы, автоматика и комплектующие. Подберём оборудование и доставим по Минску и области.',
};

/** Логин и пароль админки (перед сборкой: VITE_ADMIN_LOGIN / VITE_ADMIN_PASSWORD в .env.domen) */
export const ADMIN = {
  login: import.meta.env.VITE_ADMIN_LOGIN || 'Андрей Емельянов',
  password: import.meta.env.VITE_ADMIN_PASSWORD || '18031981',
};

/** @deprecated use useStore().site */
export const SITE = DEFAULT_SITE;
