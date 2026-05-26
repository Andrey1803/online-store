import { COMPANY } from '../data/company';

export const SITE_ORIGIN = COMPANY.siteUrl.replace(/\/$/, '');
export const SITE_NAME = COMPANY.tradeName;
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/favicon.svg`;

export function absoluteUrl(path = ''): string {
  if (!path || path === '/') return `${SITE_ORIGIN}/`;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_ORIGIN}${p}`;
}

export function truncate(text: string, max = 160): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export function formatPageTitle(pageTitle: string): string {
  if (!pageTitle) return `${SITE_NAME} — насосы и водоснабжение | Минск`;
  return `${pageTitle} | ${SITE_NAME}`;
}
