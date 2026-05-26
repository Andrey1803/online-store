import { COMPANY } from './company';
import { absoluteUrl } from '../lib/seo';

export const ORGANIZATION_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: COMPANY.tradeName,
  legalName: COMPANY.legalName,
  url: COMPANY.siteUrl,
  email: COMPANY.email,
  telephone: COMPANY.phone,
  address: {
    '@type': 'PostalAddress',
    streetAddress: COMPANY.legalAddress,
    addressCountry: 'BY',
  },
};

export const WEBSITE_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: COMPANY.tradeName,
  url: COMPANY.siteUrl,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${COMPANY.siteUrl}/catalog?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

export const STATIC_PAGE_SEO = {
  home: {
    title: '',
    description:
      'Купить насосы, насосные станции, гидроаккумуляторы и автоматику в Минске и области. АкваСнаб — подбор, доставка, заявка онлайн. Цены с НДС.',
    path: '/',
  },
  catalog: {
    title: 'Каталог',
    description:
      'Каталог насосного оборудования: скважинные и дренажные насосы, станции, баки, автоматика. Доставка по Минску и Беларуси.',
    path: '/catalog',
  },
  delivery: {
    title: 'Доставка и оплата',
    description: 'Условия доставки насосов и оборудования по Минску и области. Оплата для физлиц и организаций.',
    path: '/delivery',
  },
  contacts: {
    title: 'Контакты',
    description: `Контакты ${COMPANY.tradeName}: телефон ${COMPANY.phone}, ${COMPANY.email}. Минск и область.`,
    path: '/contacts',
  },
  about: {
    title: 'О компании',
    description: `${COMPANY.shortName} — продажа насосов и комплектующих для водоснабжения. Реквизиты, УНП ${COMPANY.unp}.`,
    path: '/about',
  },
  terms: {
    title: 'Условия заявки',
    description: 'Условия оформления заявки и заключения договора купли-продажи в интернет-магазине АкваСнаб.',
    path: '/terms',
  },
  returns: {
    title: 'Возврат и гарантия',
    description: 'Возврат, обмен и гарантия на насосное оборудование. Порядок обращений покупателей.',
    path: '/returns',
  },
  privacy: {
    title: 'Персональные данные',
    description: 'Политика обработки персональных данных интернет-магазина АкваСнаб.',
    path: '/privacy',
  },
  cart: {
    title: 'Корзина',
    description: 'Корзина заказа',
    path: '/cart',
    noindex: true,
  },
  account: {
    title: 'Личный кабинет',
    description: 'Личный кабинет покупателя',
    path: '/account',
    noindex: true,
  },
  accountLogin: {
    title: 'Вход',
    description: 'Вход в личный кабинет',
    path: '/account/login',
    noindex: true,
  },
} as const;

export function productJsonLd(product: {
  name: string;
  slug: string;
  brand: string;
  price: number;
  description?: string;
  image?: string;
  inStock: boolean;
}) {
  const image = product.image
    ? product.image.startsWith('http')
      ? product.image
      : absoluteUrl(product.image)
    : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    brand: { '@type': 'Brand', name: product.brand },
    description: product.description,
    image,
    offers: {
      '@type': 'Offer',
      url: absoluteUrl(`/product/${product.slug}`),
      priceCurrency: 'BYN',
      price: product.price,
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  };
}
