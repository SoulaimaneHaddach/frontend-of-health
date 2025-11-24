// src/shared/utils/validation.ts
import { Translations } from '../../i18n/translations';

export const validateMoroccanPhone = (
  phone: string,
  t?: ((key: string) => string) | Translations
) => {
  const cleaned = (phone || '').trim();

  // Must be exactly 10 digits, start with 0, second digit 5-8, only digits
  const re = /^0[5-8]\d{8}$/;

  if (!re.test(cleaned)) {
    const errorKey = 'invalidPhone';
    let localized: string | undefined;
    if (t) {
      if (typeof t === 'function') localized = (t as (k: string) => string)(errorKey);
      else localized = (t as Translations)[errorKey as keyof Translations] as string | undefined;
    }

    return {
      valid: false,
      error: localized || "رقم الهاتف غير صالح. يجب أن يكون 10 أرقام ويبدأ بـ 05 أو 06 أو 07 أو 08 بدون مسافات.",
      errorKey,
    } as { valid: boolean; error?: string; errorKey?: string };
  }

  return { valid: true } as { valid: boolean; error?: string };
};

export const validateDoctorName = (
  name: string,
  t?: ((key: string) => string) | Translations
) => {
  const trimmed = (name || '').trim();

  const errorKey = 'invalidDoctorName';

  if (!trimmed) {
    let localized: string | undefined;
    if (t) {
      if (typeof t === 'function') localized = (t as (k: string) => string)(errorKey);
      else localized = (t as Translations)[errorKey as keyof Translations] as string | undefined;
    }

    return {
      valid: false,
      error: localized || "الاسم يجب أن يبدأ بـ 'Dr.' مثال: Dr. Ahmed",
      errorKey,
    } as { valid: boolean; error?: string; errorKey?: string };
  }

  if (!(trimmed.startsWith('Dr.') || trimmed.startsWith('dr.'))) {
    let localized: string | undefined;
    if (t) {
      if (typeof t === 'function') localized = (t as (k: string) => string)(errorKey);
      else localized = (t as Translations)[errorKey as keyof Translations] as string | undefined;
    }

    return {
      valid: false,
      error: localized || "الاسم يجب أن يبدأ بـ 'Dr.' مثال: Dr. Ahmed",
      errorKey,
    } as { valid: boolean; error?: string; errorKey?: string };
  }

  return { valid: true };
};

export default { validateMoroccanPhone, validateDoctorName };
