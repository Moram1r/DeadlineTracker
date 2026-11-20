export function todayLocal() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDate(yyyyMMdd, locale = 'ru-RU') {
  if (!yyyyMMdd) return '';
  const [y, m, d] = yyyyMMdd.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  if (Number.isNaN(dt.getTime())) return yyyyMMdd;
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(dt);
}

export function isOverdue(yyyyMMdd, today = todayLocal()) {
  if (!yyyyMMdd) return false;
  return yyyyMMdd < today;
}