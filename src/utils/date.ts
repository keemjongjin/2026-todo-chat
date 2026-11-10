// 로컬 타임존 기준 YYYY-MM-DD (toISOString은 UTC라 KST 오전 9시 전에는 하루 전 날짜가 됨)
export function toLocalDateString(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
