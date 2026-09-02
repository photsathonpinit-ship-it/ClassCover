"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { leaveRequests, subAssignments, teachers } from "@/lib/db/schema";
import {
  autoAssignForLeave,
  findMissingSlotsForLeave,
} from "@/lib/scheduling";
import { getTeacherName } from "@/lib/teacher-name";
import { getSchoolName } from "@/lib/school";
import { formatLeaveMessage, getLineConfig, sendLinePush } from "@/lib/line";
import { alias } from "drizzle-orm/sqlite-core";

export interface PreviewSlot {
  key: string;
  date: string;
  day: string;
  period: number;
  subject: string;
  room: string | null;
  classLevel: string | null;
  absent: string;
  candidates: { id: number; name: string; score: number; reasons: string[]; subjectGroups: string[] }[];
  chosenId?: number;
}

// หาช่องว่างคาบสอนที่ขาด (แสดงผลแบบเตรียมข้อมูล)
export async function previewLeaveSlots(leaveId: number): Promise<PreviewSlot[]> {
  const leave = await db.query.leaveRequests.findFirst({
    where: eq(leaveRequests.id, leaveId),
  });
  if (!leave) return [];

  const { results } = await autoAssignForLeave(leaveId);

  // แปลงผลมาเป็น preview
  return results.map((r) => ({
    key: `${r.slot.date}-${r.slot.period}`,
    date: r.slot.date,
    day: r.slot.day,
    period: r.slot.period,
    subject: r.slot.subject,
    room: r.slot.room,
    classLevel: r.slot.classLevel,
    absent: getTeacherName(r.slot.absentTeacher),
    candidates: r.candidates.map((c) => ({
      id: c.teacher.id,
      name: getTeacherName(c.teacher),
      score: c.score,
      reasons: c.reasons,
      subjectGroups: safeParse(c.teacher.subjectGroups),
    })),
    chosenId: r.chosen?.id,
  }));
}

// บันทึกการจัดแทนทั้งชุด (จาก preview ที่ผู้จัดเลือก/ยืนยัน)
export async function confirmAssignments(formData: FormData) {
  const leaveId = Number(formData.get("leaveId"));
  if (!Number.isFinite(leaveId) || leaveId <= 0) return { error: "รหัสการลาไม่ถูกต้อง" };
  const leave = await db.query.leaveRequests.findFirst({ where: eq(leaveRequests.id, leaveId) });
  if (!leave) return { error: "ไม่พบข้อมูลการลา" };

  // วน slot ทั้งหมด
  const slots = await findMissingSlotsForLeave(leaveId, leave.startDate, leave.endDate, leave.teacherId);

  for (const slot of slots) {
    const chosenIdRaw = formData.get(`slot-${slot.date}-${slot.period}`);
    if (!chosenIdRaw) {
      // ยังไม่ได้เลือกหรือไม่ต้องการจัด
      continue;
    }
    const chosenId = Number(chosenIdRaw);
    const chosenTeacher = await db.query.teachers.findFirst({ where: eq(teachers.id, chosenId) });
    if (!chosenTeacher) continue;

    // ตรวจว่ามีคาบนี้จัดแทนไปแล้วหรือยัง
    const existing = await db.query.subAssignments.findMany({
      where: and(
        eq(subAssignments.date, slot.date),
        eq(subAssignments.period, slot.period),
        eq(subAssignments.leaveRequestId, leaveId)
      ),
    });
    if (existing.length > 0) {
      await db.update(subAssignments).set({
        substituteTeacherId: chosenId,
        status: "assigned",
      }).where(eq(subAssignments.id, existing[0].id));
    } else {
      await db.insert(subAssignments).values({
        leaveRequestId: leaveId,
        absentTeacherId: slot.absentTeacher.id,
        substituteTeacherId: chosenId,
        date: slot.date,
        day: slot.day,
        period: slot.period,
        subject: slot.subject,
        room: slot.room,
        classLevel: slot.classLevel,
        status: "assigned",
      });
    }
  }

  await db.update(leaveRequests).set({ status: "approved" }).where(eq(leaveRequests.id, leaveId));
  revalidatePath(`/leaves/${leaveId}`);
  revalidatePath("/leaves");
  revalidatePath("/assignments");

  // ส่ง LINE อัตโนมัติแบบเงียบ — ไม่ตั้งค่า = ข้าม, ล้มเหลว = ไม่ทำให้บันทึกพัง
  try {
    const cfg = await getLineConfig();
    if (cfg) {
      const schoolName = await getSchoolName();
      const absent = await db.query.teachers.findFirst({ where: eq(teachers.id, leave.teacherId) });
      const absentName = absent ? getTeacherName(absent) : `ครู #${leave.teacherId}`;
      const subAlias = alias(teachers, "subAuto");
      const rows = await db
        .select({ a: subAssignments, sub: subAlias })
        .from(subAssignments)
        .leftJoin(subAlias, eq(subAlias.id, subAssignments.substituteTeacherId))
        .where(eq(subAssignments.leaveRequestId, leaveId));
      const slotsMsg = rows
        .map(({ a, sub }) => ({
          date: a.date,
          day: a.day,
          period: a.period,
          subject: a.subject,
          classLevel: a.classLevel,
          room: a.room,
          substituteName: sub ? getTeacherName(sub) : null,
        }))
        .sort((x, y) => (x.date === y.date ? x.period - y.period : x.date.localeCompare(y.date)));
      const dateRange = leave.startDate === leave.endDate ? leave.startDate : `${leave.startDate} - ${leave.endDate}`;
      const text = formatLeaveMessage({
        schoolName,
        absentName,
        leaveType: leave.leaveType,
        dateRange,
        reason: leave.reason,
        slots: slotsMsg,
      });
      await sendLinePush(cfg.token, cfg.groupId, text);
    }
  } catch (e) {
    console.error("[LINE auto]", e);
  }

  return { ok: true };
}

function safeParse(s: string | null): string[] {
  if (!s) return [];
  try {
    return JSON.parse(s);
  } catch {
    return [];
  }
}
