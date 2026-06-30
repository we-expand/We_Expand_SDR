import dns from 'node:dns';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function verifyEmail(email) {
  if (!email) return { valid: null, domainHasMx: null };

  const formatValid = EMAIL_REGEX.test(email);
  if (!formatValid) return { valid: false, domainHasMx: null };

  const domain = email.split('@')[1];
  try {
    const records = await dns.promises.resolveMx(domain);
    return { valid: true, domainHasMx: records.length > 0 };
  } catch {
    return { valid: true, domainHasMx: false };
  }
}

export function verifyPhone(phone, defaultCountry = 'BR') {
  if (!phone) return { valid: null };
  try {
    const parsed = parsePhoneNumberFromString(phone, defaultCountry);
    return { valid: parsed ? parsed.isValid() : false };
  } catch {
    return { valid: false };
  }
}
