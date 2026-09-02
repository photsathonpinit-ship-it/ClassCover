import { db } from "@/lib/db";
import { schoolSettings } from "@/lib/db/schema";
import { DAY_LABELS } from "@/lib/dates";
import { getTeacherName } from "@/lib/teacher-name";

export type LineConfig = { token: string; groupId: string; source: "db" | "env" };

export async function getLineConfig(): Promise<LineConfig | null> {
  // ENV fallback trước — ใช้ได้ทันทีไม่ต้องตั้งค่าหน้าเว็บ
  const envToken = process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim();
  const envGroup = process.env.LINE_GROUP_ID?.trim();

  try {
    const row = await db.query.schoolSettings.findFirst();
    const dbToken = row?.lineChannelToken?.trim();
    const dbGroup = row?.lineGroupId?.trim();
    if (dbToken && dbGroup) return { token: dbToken, groupId: dbGroup, source: "db" };
  } catch {
    // DB ยังไม่ได้ migrate หรือออฟไลน์ — fallback ไป ENV
  }

  if (envToken && envGroup) return { token: envToken, groupId: envGroup, source: "env" };
  return null;
}

export async function sendLinePush(token: string, groupId: string, text: string) {
  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: groupId,
      messages: [{ type: "text", text }],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`LINE push failed ${res.status}: ${body.slice(0, 400)}`);
  }
}

// จัดรูปแบบข้อความสำหรับการลา 1 รายการ (แสดงทุกคาบที่ขาด + ครูแทน)
export function formatLeaveMessage(opts: {
  schoolName: string;
  absentName: string;
  leaveType: string;
  dateRange: string;
  reason?: string | null;
  slots: { date: string; day: string; period: number; subject: string; classLevel: string | null; room: string | null; substituteName: string | null }[];
}) {
  const { schoolName, absentName, leaveType, dateRange, reason, slots } = opts;
  const lines: string[] = [];
  lines.push(`📢 แจ้งจัดสอนแทน`);
  lines.push(schoolName);
  lines.push(`ครูที่ลา: ${absentName} (${leaveType} ${dateRange})`);
  if (reason?.trim()) lines.push(`เหตุผล: ${reason.trim()}`);
  if (slots.length === 0) {
    lines.push(`ไม่มีคาบที่ต้องจัดแทนในช่วงนี้`);
  } else {
    lines.push(`จัดแทน ${slots.length} คาบ:`);
    for (const s of slots) {
      const dayTh = DAY_LABELS[s.day as keyof typeof DAY_LABELS] ?? s.day;
      const cls = s.classLevel ? ` ${s.classLevel}` : "";
      const room = s.room ? ` (${s.room})` : "";
      const sub = s.substituteName ?? "— ยังไม่จัด";
      lines.push(`• ${dayTh} ${s.date} คาบ ${s.period} ${s.subject}${cls}${room} → ${sub}`);
    }
  }
  lines.push(`ฝ่ายวิชาการ`);
  return lines.join("\n");
}

// รวมหลายวัน / กรองตามหน้า Assignments
export function formatAssignmentsMessage(opts: {
  schoolName: string;
  title?: string;
  assignments: { date: string; day: string; period: number; subject: string; classLevel: string | null; room: string | null; absentName: string; substituteName: string | null }[];
}) {
  const { schoolName, title, assignments } = opts;
  const lines: string[] = [];
  lines.push(`📢 ${title ?? "สรุปจัดสอนแทน"} `);
  lines.push(schoolName);
  if (assignments.length === 0) {
    lines.push(`ไม่มีรายการจัดสอนแทนในช่วงที่เลือก`);
  } else {
    // จัดกลุ่มตามวันที่ให้อ่านง่าย
    const byDate = new Map<string, typeof assignments>();
    for (const a of assignments) {
      const arr = byDate.get(a.date) ?? [];
      arr.push(a);
      byDate.set(a.date, arr);
    }
    const dates = [...byDate.keys()].sort();
    lines.push(`รวม ${assignments.length} คาบ:`);
    for (const d of dates) {
      const list = byDate.get(d)!;
      const dayTh = DAY_LABELS[list[0].day as keyof typeof DAY_LABELS] ?? list[0].day;
      lines.push(`— ${dayTh} ${d}`);
      for (const a of list.sort((x, y) => x.period - y.period)) {
        const cls = a.classLevel ? ` ${a.classLevel}` : "";
        const room = a.room ? ` (${a.room})` : "";
        const sub = a.substituteName ?? "— ยังไม่จัด";
        lines.push(`  • คาบ ${a.period} ${a.subject}${cls}${room} ${a.absentName} → ${sub}`);
      }
    }
  }
  lines.push(`ฝ่ายวิชาการ`);
  return lines.join("\n");
}

export function maskToken(token: string | null | undefined) {
  if (!token) return "— ยังไม่ได้ตั้งค่า";
  const t = token.trim();
  if (t.length <= 8) return "••••••••";
  return `${t.slice(0, 4)}…${t.slice(-4)} (${t.length} ตัวอักษร)`;
}
