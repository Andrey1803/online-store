import type { CustomerProfile, CustomerRecord } from '../data/customer';

const USERS_KEY = 'akvasnab-customers';
const SESSION_KEY = 'akvasnab-customer-session';

export function loadCustomers(): CustomerRecord[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CustomerRecord[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* ignore */
  }
  return [];
}

export function saveCustomers(users: CustomerRecord[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function loadSessionUserId(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export function saveSessionUserId(userId: string | null): void {
  if (userId) localStorage.setItem(SESSION_KEY, userId);
  else localStorage.removeItem(SESSION_KEY);
}

export function toProfile(user: CustomerRecord): CustomerProfile {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    createdAt: user.createdAt,
  };
}

export function listCustomerProfiles(): CustomerProfile[] {
  return loadCustomers()
    .map(toProfile)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function createCustomerId(): string {
  return `usr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
