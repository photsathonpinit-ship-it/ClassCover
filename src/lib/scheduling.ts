import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "./db";
import { addDays, format, parseISO, getDay } from "./dates";
import {
  DAYS,
  leaveRequests,
  schedules,
  subAssignments,
  teachers,
  type Day,
  type Teacher,
} from "./db/schema";
import { getScheduleForDate, isTeacherAbsentOn } from "./availability";

export interface SubSlot {
  date: string;
  day: Day;
  period: number;
  subject: string;
  room: string | null;
  classLevel: string | null;
  absentTeacher: Teacher;
}

export interface Candidate {
  teacher: Teacher;
  score: number;
  reasons: string[];
}

export interface AssignmentResult {
  slot: SubSlot;
  candidates: Candidate[];
}

// คำนวณว่าวันที่เป็นวันใดของสัปดาห์
function dayFromDate(dateStr: string): Day | null {
  const d = parseISO(dateStr);
  const dow = getDay(d); // 1=จันทร์ ... 5=ศุกร์, 6-0=เสาร์-อาทิตย์
  if (dow >= 1 && dow <= 5) {
    return DAYS[dow - 1];
  }
  return null;
}

/**
 * หาคาบสอนที่ขาดหายของครูที่ลาในช่วงวันนั้น
 * โดยดูจากตารางสอนปกติของครูผู้นั้น
 */
export async function findMissingSlotsForLeave(
  _leaveRequestId: number,
  startDate: string,
  endDate: string,
  absentTeacherId: number
): Promise<SubSlot[]> {
  const slots: SubSlot[] = [];
  const absentTeacher = await db.query.teachers.findFirst({
    where: eq(teachers.id, absentTeacherId),
  });
  if (!absentTeacher) return slots;

  // วนแต่ละวันในช่วงลา
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  let cursor = start;
  while (cursor <= end) {
    const dateStr = format(cursor);
    const day = dayFromDate(dateStr);
    if (day) {
      // ดึงตารางสอนปกติของครูผู้นั้นในวันนั้น
      const daySchedule = await db.query.schedules.findMany({
        where: and(eq(schedules.teacherId, absentTeacherId), eq(schedules.day, day)),
      });
      for (const s of daySchedule) {
        slots.push({
          date: dateStr,
          day,
          period: s.period,
          subject: s.subject,
          room: s.room,
          classLevel: s.classLevel,
          absentTeacher,
        });
      }
    }
    cursor = addDays(cursor, 1);
  }
  return slots;
}

/**
 * หาครูที่ว่างในคาบนั้น (ดูตารางสอนปกติ + ไม่ได้ลา + ยังไม่ได้ถูกจัดแทนในคาบนั้นแล้ว)
 */
async function findAvailableTeachers(
  slot: Pick<SubSlot, "date" | "day" | "period">
): Promise<Teacher[]> {
  const date = slot.date;

  // ครูทั้งหมด
  const allTeachers = await db.query.teachers.findMany();

  // ครูที่ถูกจัดแทนในช่วงวันนั้นๆ แล้ว (คาบเดียว) - กันซ้ำ
  const alreadyAssigned = await db.query.subAssignments.findMany({
    where: and(
      eq(subAssignments.date, date),
      eq(subAssignments.period, slot.period)
    ),
  });
  const alreadyAssignedIds = new Set(
    alreadyAssigned
      .filter((a) => a.substituteTeacherId != null)
      .map((a) => a.substituteTeacherId!)
  );

  const available: Teacher[] = [];
  for (const teacher of allTeachers) {
    if (alreadyAssignedIds.has(teacher.id)) continue; // มีคาบซ้ำแล้ว

    // ครูคนนั้นลาหรือเปล่าในวันนี้
    if (await isTeacherAbsentOn(teacher.id, date)) continue;

    // ดูว่าครูมีคาบว่างในวัน/คาบนี้หรือไม่
    const busy = await getScheduleForDate(teacher.id, slot);
    const alreadySubbedThatPeriod = alreadyAssigned.some(
      (a) => a.substituteTeacherId === teacher.id && a.period === slot.period
    );
    if (busy || alreadySubbedThatPeriod) continue;

    // เช็คไม่เกินจำนวนคาบสูงสุดต่อวันที่จัดได้แล้ว
    const assignedToday = await db.query.subAssignments.findMany({
      where: and(
        eq(subAssignments.date, date),
        eq(subAssignments.substituteTeacherId, teacher.id)
      ),
    });
    if (assignedToday.length >= (teacher.maxPeriodsPerDay ?? 4)) continue;

    available.push(teacher);
  }
  return available;
}

/**
 * ให้คะแนนผู้สมัครตามความเหมาะสม — รวมความเป็นธรรม: คนสอนแทนน้อยได้คะแนนมาก
 */
function scoreCandidate(teacher: Teacher, slot: SubSlot, monthlyCount: number): Candidate {
  let score = 50;
  const reasons: string[] = [];

  // 1. ครูที่สอนวิชาเดียวกัน/ใกล้เคียง ได้คะแนนสูง
  let groups: string[] = [];
  try {
    groups = JSON.parse(teacher.subjectGroups || "[]");
  } catch {
    groups = [];
  }
  if (groups.length > 0 && groups.some((g) => g.trim() === slot.subject.trim())) {
    score += 30;
    reasons.push("สอนวิชาตรงกับคาบที่ขาด");
  }

  // 2. ความเป็นธรรม: ยิ่งเคยสอนแทนน้อย ยิ่งได้คะแนนมาก (นับ 30 วันย้อนหลัง)
  if (monthlyCount === 0) {
    score += 12;
    reasons.push("ยังไม่เคยสอนแทนใน 30 วัน");
  } else if (monthlyCount <= 2) {
    score += 6;
    reasons.push(`สอนแทนน้อย (${monthlyCount} คาบใน 30 วัน)`);
  } else if (monthlyCount >= 8) {
    score -= 15;
    reasons.push(`สอนแทนบ่อยแล้ว (${monthlyCount} คาบใน 30 วัน)`);
  } else if (monthlyCount >= 5) {
    score -= 8;
    reasons.push(`สอนแทน ${monthlyCount} คาบใน 30 วัน`);
  }

  return { teacher, score, reasons };
}

/**
 * จัดสอนแทนอัตโนมัติช่วงเวลาการลาครบทุกวัน
 * คืนค่ารายการช่องว่างที่ "หาแทนได้" แล้ว
 */
export async function autoAssignForLeave(leaveRequestId: number): Promise<{
  slots: SubSlot[];
  results: { slot: SubSlot; chosen?: Teacher; candidates: Candidate[]; note: string }[];
}> {
  const leave = await db.query.leaveRequests.findFirst({
    where: eq(leaveRequests.id, leaveRequestId),
  });
  if (!leave) {
    return { slots: [], results: [] };
  }

  const slots = await findMissingSlotsForLeave(
    leaveRequestId,
    leave.startDate,
    leave.endDate,
    leave.teacherId
  );

  const results: {
    slot: SubSlot;
    chosen?: Teacher;
    candidates: Candidate[];
    note: string;
  }[] = [];

  for (const slot of slots) {
    const pool = await findAvailableTeachers(slot);
    // นับภาระ 30 วันย้อนหลังจากวันของคาบนั้น (เป็นธรรม: คนโดนบ่อยตกไปท้าย)
    const thirtyDaysAgo = format(addDays(parseISO(slot.date), -30));
    const countMap = new Map<number, number>();
    if (pool.length > 0) {
      const ids = pool.map((t) => t.id);
      const rows = await db
        .select({ sid: subAssignments.substituteTeacherId, cnt: sql<number>`count(*)` })
        .from(subAssignments)
        .where(and(sql`${subAssignments.date} >= ${thirtyDaysAgo}`, inArray(subAssignments.substituteTeacherId, ids)))
        .groupBy(subAssignments.substituteTeacherId);
      for (const r of rows) if (r.sid != null) countMap.set(r.sid as number, r.cnt);
    }
    const candidates = pool
      .map((t) => scoreCandidate(t, slot, countMap.get(t.id) ?? 0))
      .sort((a, b) => b.score - a.score);

    if (candidates.length === 0) {
      results.push({
        slot,
        candidates,
        note: "ไม่มีครูว่างในคาบนี้ ต้องจัดการเอง",
      });
    } else {
      const chosen = candidates[0];
      results.push({ slot, chosen: chosen.teacher, candidates, note: "จัดอัตโนมัติ" });
    }
  }

  return { slots, results };
}

/**
 * บันทึกผลการจัดแทนลงฐานข้อมูล (สถานะ assigned)
 */
export async function saveAssignment(
  leaveRequestId: number,
  result: {
    slot: SubSlot;
    chosen?: Teacher;
    note: string;
  }
) {
  if (!result.chosen) return null;
  const { slot, chosen } = result;

  const inserted = await db
    .insert(subAssignments)
    .values({
      leaveRequestId,
      absentTeacherId: slot.absentTeacher.id,
      substituteTeacherId: chosen.id,
      date: slot.date,
      day: slot.day,
      period: slot.period,
      subject: slot.subject,
      room: slot.room,
      classLevel: slot.classLevel,
      status: "assigned",
    })
    .returning();
  return inserted[0];
}
