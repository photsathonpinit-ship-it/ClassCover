// Date helpers (ทำงานกับ string YYYY-MM-DD เพื่อให้ง่ายกับ SQLite)

export function parseISO(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function format(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

// getDay: 1=จันทร์ ... 5=ศุกร์, 6=เสาร์, 0=อาทิตย์  (มาตรฐาน JS: 0=อาทิตย์)
export function getDay(d: Date): number {
  const jsDow = d.getDay(); // 0=อาทิตย์
  if (jsDow === 0) return 7; // อาทิตย์
  return jsDow;
}

export function todayStr(): string {
  return format(new Date());
}

export const DAY_LABELS: Record<string, string> = {
  MON: "จันทร์",
  TUE: "อังคาร",
  WED: "พุธ",
  THU: "พฤหัสบดี",
  FRI: "ศุกร์",
};
