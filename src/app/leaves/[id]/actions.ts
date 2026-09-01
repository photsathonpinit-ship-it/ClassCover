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
