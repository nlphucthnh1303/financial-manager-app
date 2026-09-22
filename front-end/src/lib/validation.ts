export type FormErrors = Record<string, string>;

/** Keeps only the fields that actually failed, e.g. collectErrors({ name: !name && 'Bắt buộc' }). */
export function collectErrors(checks: Record<string, string | false | null | undefined>): FormErrors {
  const errors: FormErrors = {};
  for (const [field, message] of Object.entries(checks)) if (message) errors[field] = message;
  return errors;
}

/** Largest amount accepted by money inputs (the API stores numeric(18,2)). */
export const MAX_AMOUNT = 999_999_999_999;

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export const check = {
  required: (value: string | undefined | null, message: string) => (!value || !String(value).trim() ? message : undefined),
  length: (value: string, min: number, max: number, label: string) => {
    const len = value.trim().length;
    if (len < min) return `${label} phải có ít nhất ${min} ký tự.`;
    if (len > max) return `${label} tối đa ${max} ký tự.`;
    return undefined;
  },
  maxLength: (value: string, max: number, label: string) => (value.trim().length > max ? `${label} tối đa ${max} ký tự.` : undefined),
  email: (value: string) => (!value.trim() ? 'Vui lòng nhập email.' : !EMAIL_RE.test(value.trim()) ? 'Email không đúng định dạng.' : undefined),
  /** Raw digit string from MoneyInput. */
  amount: (raw: string, label: string, { allowZero = false } = {}) => {
    if (!raw) return allowZero ? undefined : `Vui lòng nhập ${label.toLowerCase()}.`;
    const n = Number(raw);
    if (!allowZero && n <= 0) return `${label} phải lớn hơn 0.`;
    if (n > MAX_AMOUNT) return `${label} vượt quá giới hạn cho phép.`;
    return undefined;
  },
  dateOrder: (start: string, end: string) => (start && end && end < start ? 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.' : undefined),
};
