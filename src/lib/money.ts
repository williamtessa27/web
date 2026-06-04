function moneyIntegerDigits(value: string | number | null | undefined): string {
  const raw = String(value ?? '').trim().replace(/\s/g, '');
  if (!raw) return '';

  const withoutDecimalPart = /[.,]\d{1,2}$/.test(raw)
    ? raw.replace(/[.,]\d{1,2}$/, '')
    : raw;

  return withoutDecimalPart.replace(/\D/g, '');
}

export function formatMoneyAmount(value: string | number | null | undefined): string {
  const digits = moneyIntegerDigits(value);
  if (!digits) return '';

  const numeric = Number(digits);
  if (!Number.isFinite(numeric)) return '';

  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numeric);
}

export function formatXaf(value: string | number | null | undefined): string {
  const amount = formatMoneyAmount(value);
  return amount ? `${amount} XAF` : '—';
}

export function formatMoneyInput(value: string | number | null | undefined): string {
  const digits = moneyIntegerDigits(value);
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function parseMoneyInput(value: string | number | null | undefined): number | undefined {
  const digits = moneyIntegerDigits(value);
  return digits ? Number(digits) : undefined;
}
