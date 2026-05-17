import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  CustomerProfile,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
} from '../data/customer';
import {
  createCustomerId,
  loadCustomers,
  loadSessionUserId,
  saveCustomers,
  saveSessionUserId,
  toProfile,
} from '../lib/customerStore';
import {
  isValidEmail,
  isValidPhone,
  normalizeEmail,
  normalizePhoneKey,
} from '../lib/customerNormalize';
import { hashPassword } from '../lib/passwordHash';

type AuthResult = { ok: true } | { ok: false; error: string };

interface CustomerAuthContextValue {
  user: CustomerProfile | null;
  isAuthenticated: boolean;
  register: (input: RegisterInput) => Promise<AuthResult>;
  login: (input: LoginInput) => Promise<AuthResult>;
  logout: () => void;
  updateProfile: (input: UpdateProfileInput) => AuthResult;
}

const CustomerAuthContext = createContext<CustomerAuthContextValue | null>(null);

function findUserById(users: ReturnType<typeof loadCustomers>, id: string | null) {
  if (!id) return undefined;
  return users.find((u) => u.id === id);
}

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState(loadCustomers);
  const [sessionUserId, setSessionUserId] = useState<string | null>(loadSessionUserId);

  useEffect(() => {
    saveCustomers(users);
  }, [users]);

  useEffect(() => {
    saveSessionUserId(sessionUserId);
  }, [sessionUserId]);

  const user = useMemo(() => {
    const record = findUserById(users, sessionUserId);
    return record ? toProfile(record) : null;
  }, [users, sessionUserId]);

  const register = useCallback(async (input: RegisterInput): Promise<AuthResult> => {
    const email = normalizeEmail(input.email);
    const name = input.name.trim();
    const phone = input.phone.trim();
    const password = input.password;

    if (!isValidEmail(email)) {
      return { ok: false, error: 'Укажите корректный e-mail' };
    }
    if (!name) {
      return { ok: false, error: 'Укажите имя' };
    }
    if (!isValidPhone(phone)) {
      return { ok: false, error: 'Укажите корректный телефон' };
    }
    if (password.length < 6) {
      return { ok: false, error: 'Пароль не менее 6 символов' };
    }

    const phoneKey = normalizePhoneKey(phone);
    if (users.some((u) => normalizeEmail(u.email) === email)) {
      return { ok: false, error: 'Этот e-mail уже зарегистрирован' };
    }
    if (users.some((u) => normalizePhoneKey(u.phone) === phoneKey)) {
      return { ok: false, error: 'Этот телефон уже зарегистрирован' };
    }

    const passwordHash = await hashPassword(password);
    const record = {
      id: createCustomerId(),
      email,
      name,
      phone,
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    setUsers((prev) => [...prev, record]);
    setSessionUserId(record.id);
    return { ok: true };
  }, [users]);

  const login = useCallback(async (input: LoginInput): Promise<AuthResult> => {
    const email = normalizeEmail(input.email);
    const record = users.find((u) => normalizeEmail(u.email) === email);
    if (!record) {
      return { ok: false, error: 'Неверный e-mail или пароль' };
    }

    const passwordHash = await hashPassword(input.password);
    if (record.passwordHash !== passwordHash) {
      return { ok: false, error: 'Неверный e-mail или пароль' };
    }

    setSessionUserId(record.id);
    return { ok: true };
  }, [users]);

  const logout = useCallback(() => {
    setSessionUserId(null);
  }, []);

  const updateProfile = useCallback(
    (input: UpdateProfileInput): AuthResult => {
      if (!sessionUserId) {
        return { ok: false, error: 'Войдите в аккаунт' };
      }

      const name = input.name.trim();
      const phone = input.phone.trim();
      if (!name) return { ok: false, error: 'Укажите имя' };
      if (!isValidPhone(phone)) {
        return { ok: false, error: 'Укажите корректный телефон' };
      }

      const phoneKey = normalizePhoneKey(phone);
      const taken = users.some(
        (u) => u.id !== sessionUserId && normalizePhoneKey(u.phone) === phoneKey,
      );
      if (taken) {
        return { ok: false, error: 'Этот телефон уже используется' };
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === sessionUserId ? { ...u, name, phone } : u)),
      );
      return { ok: true };
    },
    [sessionUserId, users],
  );

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user != null,
      register,
      login,
      logout,
      updateProfile,
    }),
    [user, register, login, logout, updateProfile],
  );

  return (
    <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error('useCustomerAuth must be used within CustomerAuthProvider');
  return ctx;
}
