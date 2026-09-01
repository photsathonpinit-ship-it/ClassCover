import { createClient } from "@libsql/client";
import postgres from "postgres";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import * as pg from "../src/lib/db/schema-pg";

interface TeacherRow { id: number; first_name: string; last_name: string; title: string | null; subject_groups: string | null; phone: string | null; email: string | null; max_periods_per_day: number | null }
interface ScheduleRow { id: number; teacher_id: number; day: string; period: number; subject: string; room: string | null; class_level: string | null }
interface LeaveRow { id: number; teacher_id: number; start_date: string; end_date: string; leave_type: string; reason: string | null; status: string | null; note: string | null }
interface AssignmentRow { id: number; leave_request_id: number; absent_teacher_id: number; substitute_teacher_id: number | null; date: string; day: string; period: number; subject: string; room: string | null; class_level: string | null; status: string | null; score: number | null; note: string | null }
interface SettingsRow { id: number; school_name: string | null }

async function main() {
  const pgUrl = process.env.POSTGRES_URL ?? process.env.POSTGRES_URL_NON_POOLING;
  if (!pgUrl) {
    console.error("POSTGRES_URL not set. Run with: $env:POSTGRES_URL='postgresql://...' ; npm run db:seed:pg");
    process.exit(1);
  }

  const pgClient = postgres(pgUrl, { ssl: "require" });
  const db = drizzlePg(pgClient, { schema: pg });

  console.log("Reading from SQLite school.db ...");
  const sqlite = createClient({ url: "file:school.db" });

  const teachersRows = (await sqlite.execute("SELECT * FROM teachers ORDER BY id")).rows as unknown as TeacherRow[];
  const schedulesRows = (await sqlite.execute("SELECT * FROM schedules ORDER BY id")).rows as unknown as ScheduleRow[];
  const leavesRows = (await sqlite.execute("SELECT * FROM leave_requests ORDER BY id")).rows as unknown as LeaveRow[];
  const assignmentsRows = (await sqlite.execute("SELECT * FROM sub_assignments ORDER BY id")).rows as unknown as AssignmentRow[];
  const settingsRows = (await sqlite.execute("SELECT * FROM school_settings ORDER BY id")).rows as unknown as SettingsRow[];

  console.log(`  teachers: ${teachersRows.length}`);
  console.log(`  schedules: ${schedulesRows.length}`);
  console.log(`  leave_requests: ${leavesRows.length}`);
  console.log(`  sub_assignments: ${assignmentsRows.length}`);
  console.log(`  school_settings: ${settingsRows.length}`);

  console.log("Clearing existing Postgres tables ...");
  await db.delete(pg.subAssignments);
  await db.delete(pg.leaveRequests);
  await db.delete(pg.schedules);
  await db.delete(pg.teachers);
  await db.delete(pg.schoolSettings);

  // IDs เป็น identity column — ปล่อยให้ PG กำหนดใหม่ แล้ว map old -> new กันความสัมพันธ์
  console.log("Inserting teachers ...");
  const newTeachers = await db
    .insert(pg.teachers)
    .values(
      teachersRows.map((t) => ({
        firstName: t.first_name,
        lastName: t.last_name,
        title: t.title ?? "ครู",
        subjectGroups: t.subject_groups ?? "[]",
        phone: t.phone,
        email: t.email,
        maxPeriodsPerDay: t.max_periods_per_day ?? 4,
      }))
    )
    .returning({ id: pg.teachers.id });

  const teacherIdMap = new Map<number, number>();
  teachersRows.forEach((old, i) => {
    teacherIdMap.set(Number(old.id), Number(newTeachers[i].id));
  });

  console.log("Inserting schedules ...");
  for (const s of schedulesRows) {
    const newTid = teacherIdMap.get(Number(s.teacher_id));
    if (newTid == null) continue;
    await db.insert(pg.schedules).values({
      teacherId: newTid,
      day: s.day as pg.Day,
      period: s.period,
      subject: s.subject,
      room: s.room,
      classLevel: s.class_level,
    });
  }

  console.log("Inserting leave_requests ...");
  const newLeaves = await db
    .insert(pg.leaveRequests)
    .values(
      leavesRows.map((l) => ({
        teacherId: teacherIdMap.get(Number(l.teacher_id)) ?? 0,
        startDate: l.start_date,
        endDate: l.end_date,
        leaveType: l.leave_type as pg.LeaveType,
        reason: l.reason,
        status: (l.status ?? "pending") as "pending" | "approved" | "rejected",
        note: l.note,
      }))
    )
    .returning({ id: pg.leaveRequests.id });
  const leaveIdMap = new Map<number, number>();
  leavesRows.forEach((old, i) => {
    leaveIdMap.set(Number(old.id), Number(newLeaves[i].id));
  });

  console.log("Inserting sub_assignments ...");
  for (const a of assignmentsRows) {
    const newLeave = leaveIdMap.get(Number(a.leave_request_id));
    const newAbsent = teacherIdMap.get(Number(a.absent_teacher_id));
    const newSub = a.substitute_teacher_id != null ? teacherIdMap.get(Number(a.substitute_teacher_id)) : null;
    if (newLeave == null || newAbsent == null) continue;
    await db.insert(pg.subAssignments).values({
      leaveRequestId: newLeave,
      absentTeacherId: newAbsent,
      substituteTeacherId: newSub,
      date: a.date,
      day: a.day as pg.Day,
      period: a.period,
      subject: a.subject,
      room: a.room,
      classLevel: a.class_level,
      status: (a.status ?? "pending") as "pending" | "assigned" | "completed",
      score: a.score,
      note: a.note,
    });
  }

  console.log("Inserting school_settings ...");
  for (const st of settingsRows) {
    await db.insert(pg.schoolSettings).values({
      schoolName: st.school_name ?? "โรงเรียนประถม",
    });
  }

  console.log("Seed complete!");
  await pgClient.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});