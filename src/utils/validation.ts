export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export function isValidGhanaPhone(phone: string): boolean {
  const digits = phone.replace(/[\s\-()]/g, '');
  // Accepts local 10-digit Ghanaian numbers (e.g. 0247401641) or +233 / 233 international format
  return /^(0[235][0-9]{8}|\+?233[235][0-9]{8})$/.test(digits);
}

export function isNonEmpty(value: string, minLength = 2): boolean {
  return value.trim().length >= minLength;
}

export function isPastDate(dateStr: string): boolean {
  if (!dateStr) return false;
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return false;
  const today = new Date();
  return parsed < today && parsed.getFullYear() >= 2005;
}
