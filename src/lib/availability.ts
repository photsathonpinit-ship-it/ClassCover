import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "./db";
import { leaveRequests, schedules } from "./db/schema";
import type { SubSlot } from "./scheduling";

// เช็คว่าครู la อยู่ในช่วงวันนี้หรือไม่ — นับเฉพาะใบลาที่อนุมัติแล้ว (pending ยังไม่ถือว่าขาด)
export async function isTeacherAbsentOn(teacherId: number, date: string): Promise<boolean> {
  const rows = await db
    .select({ id: leaveRequests.id })
    .from(leaveRequests)
    .where(
      and(
        eq(leaveRequests.teacherId, teacherId),
        eq(leaveRequests.status, "approved"),
        lte(leaveRequests.startDate, date),
        gte(leaveRequests.endDate, date)
      )
    );
  return rows.length > 0;
}

// หาครูทั้งหมดที่ลาในวันนี้ (นำไปใช้กันครูที่กำลังลาออกจากการเป็นผู้สอนแทน)
export async function findAbsentTeacherIds(date: string): Promise<number[]> {
  const rows = await db
    .select({ teacherId: leaveRequests.teacherId })
    .from(leaveRequests)
    .where(
      and(
        eq(leaveRequests.status, "approved"),
        lte(leaveRequests.startDate, date),
        gte(leaveRequests.endDate, date)
      )
    );
  return rows.map((r) => r.teacherId);
}

// ดูว่าครูมีตารางสอนปกติในวัน/คาบนั้นหรือไม่ (ว่าง = false)
export async function getScheduleForDate(
  teacherId: number,
  slot: Pick<SubSlot, "day" | "period">
): Promise<boolean> {
  const rows = await db.query.schedules.findMany({
    where: and(
      eq(schedules.teacherId, teacherId),
      eq(schedules.day, slot.day),
      eq(schedules.period, slot.period)
    ),
  });
  return rows.length > 0;
}
