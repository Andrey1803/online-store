const STORAGE_KEY = 'akvasnab-admin-remember';

export interface RememberedAdminCredentials {
  login: string;
  password: string;
}

export function loadRememberedCredentials(): RememberedAdminCredentials | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as RememberedAdminCredentials;
    if (!data.login && !data.password) return null;
    return { login: data.login ?? '', password: data.password ?? '' };
  } catch {
    return null;
  }
}

export function saveRememberedCredentials(credentials: RememberedAdminCredentials): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
}

export function clearRememberedCredentials(): void {
  localStorage.removeItem(STORAGE_KEY);
}
