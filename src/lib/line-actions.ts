"use server";

import { eq, desc } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { db } from "@/lib/db";
import { leaveRequests, subAssignments, teachers as teachersTable } from "@/lib/db/schema";
import { getSchoolName } from "@/lib/school";
import { getTeacherName } from "@/lib/teacher-name";
import { formatAssignmentsMessage, formatLeaveMessage, getLineConfig, sendLinePush } from "@/lib/line";

export async function notifyLeave(leaveId: number): Promise<{ ok: boolean; message: string }> {
  const cfg = await getLineConfig();
  if (!cfg) return { ok: false, message: "ยังไม่ได้ตั้งค่า LINE: กรุณาใส่ Channel Access Token และ Group ID ที่หน้า ตั้งค่า" };

  const leave = await db.query.leaveRequests.findFirst({ where: eq(leaveRequests.id, leaveId) });
  if (!leave) return { ok: false, message: "ไม่พบข้อมูลการลา" };

  const absent = await db.query.teachers.findFirst({ where: eq(teachersTable.id, leave.teacherId) });
  const absentName = absent ? getTeacherName(absent) : `ครู #${leave.teacherId}`;

  const subAlias = alias(teachersTable, "sub");
  const rows = await db
    .select({ a: subAssignments, sub: subAlias })
    .from(subAssignments)
    .leftJoin(subAlias, eq(subAlias.id, subAssignments.substituteTeacherId))
    .where(eq(subAssignments.leaveRequestId, leaveId));

  const schoolName = await getSchoolName();

  const slots = rows
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
    slots,
  });

  try {
    await sendLinePush(cfg.token, cfg.groupId, text);
    return { ok: true, message: `ส่งแจ้ง LINE สำเร็จ (${slots.length} คาบ)` };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, message: msg };
  }
}

export async function notifyFilteredAssignments(filters: { status?: string; date?: string; teacherId?: string }): Promise<{ ok: boolean; message: string }> {
  const cfg = await getLineConfig();
  if (!cfg) return { ok: false, message: "ยังไม่ได้ตั้งค่า LINE: กรุณาใส่ Channel Access Token และ Group ID ที่หน้า ตั้งค่า" };

  const absentAlias = alias(teachersTable, "absent");
  const subAlias = alias(teachersTable, "sub");

  const rows = await db
    .select({ a: subAssignments, absent: absentAlias, sub: subAlias })
    .from(subAssignments)
    .innerJoin(absentAlias, eq(absentAlias.id, subAssignments.absentTeacherId))
    .leftJoin(subAlias, eq(subAlias.id, subAssignments.substituteTeacherId))
    .orderBy(desc(subAssignments.date));

  let filtered = rows;
  if (filters.status) filtered = filtered.filter((r) => r.a.status === filters.status);
  if (filters.date) filtered = filtered.filter((r) => r.a.date === filters.date);
  if (filters.teacherId) {
    const tid = Number(filters.teacherId);
    if (Number.isFinite(tid) && tid > 0) filtered = filtered.filter((r) => r.a.substituteTeacherId === tid || r.a.absentTeacherId === tid);
  }

  if (filtered.length === 0) return { ok: false, message: "ไม่มีรายการจัดสอนแทนในช่วงที่เลือก" };

  const schoolName = await getSchoolName();
  const assignments = filtered.map(({ a, absent, sub }) => ({
    date: a.date,
    day: a.day,
    period: a.period,
    subject: a.subject,
    classLevel: a.classLevel,
    room: a.room,
    absentName: getTeacherName(absent),
    substituteName: sub ? getTeacherName(sub) : null,
  }));

  const title = filters.date ? `สรุปจัดสอนแทน ${filters.date}` : "สรุปจัดสอนแทน";
  const text = formatAssignmentsMessage({ schoolName, title, assignments });

  try {
    await sendLinePush(cfg.token, cfg.groupId, text);
    return { ok: true, message: `ส่งแจ้ง LINE สำเร็จ (${assignments.length} คาบ)` };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, message: msg };
  }
}
