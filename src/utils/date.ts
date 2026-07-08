export function formatDate(date: string): string {
  if (!date) return "-";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) return "-";

  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");

  return `${yy}.${mm}.${dd}`;
}

export function daysSince(date: string): number {
  if (!date) return 0;

  const today = new Date();
  const target = new Date(date);

  if (Number.isNaN(target.getTime())) return 0;

  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  return Math.max(
    0,
    Math.floor((today.getTime() - target.getTime()) / 86400000)
  );
}

export function nextDate(date: string, intervalDays: number): string {
  if (!date) return "-";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) return "-";

  d.setDate(d.getDate() + Number(intervalDays || 0));

  return formatDate(d.toISOString());
}

export function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}