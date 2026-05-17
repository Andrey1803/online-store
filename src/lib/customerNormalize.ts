export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Цифры телефона для сравнения (375...) */
export function normalizePhoneKey(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('80') && digits.length === 11) {
    return `375${digits.slice(2)}`;
  }
  return digits;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isValidPhone(phone: string): boolean {
  const key = normalizePhoneKey(phone);
  return key.length >= 9 && key.length <= 15;
}
