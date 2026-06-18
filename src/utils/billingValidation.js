/** Strip non-digits and cap at 10 characters. */
export function sanitizePhone(value) {
  return value.replace(/\D/g, '').slice(0, 10);
}

/** Alphanumeric only, uppercased. */
export function sanitizeVehicleNumber(value) {
  return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

/**
 * Append @gmail.com when the user entered a username without an @ symbol.
 * Leaves full emails (with any domain) unchanged.
 */
export function normalizeEmail(value) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.includes('@')) return trimmed;
  return `${trimmed}@gmail.com`;
}

export function isValidPhone(value) {
  return !value || value.length === 10;
}
