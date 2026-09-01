import { createClient } from "@libsql/client";
import { db } from "../src/lib/db";
import * as pg from "../src/lib/db/schema-pg";

async function main() {
  const pgUrl = process.env.POSTGRES_URL ?? process.env.POSTGRES_URL_NON_POOLING;
  if (!pgUrl) {
    console.error("POSTGRES_URL not set. Run with: $env:POSTGRES_URL='postgresql://...' ; npm run db:seed:pg");
    process.exit(1);
  }

  console.log("Reading from SQLite school.db ...");
  const sqlite = createClient({ url: "file:school.db" });

  const teachersRows = (await sqlite.execute("SELECT * FROM teachers ORDER BY id")).rows as any[];
  const schedulesRows = (await sqlite.execute("SELECT * FROM schedules ORDER BY id")).rows as any[];
  const leavesRows = (await sqlite.execute("SELECT * FROM leave_requests ORDER BY id")).rows as any[];
  const assignmentsRows = (await sqlite.execute("SELECT * FROM sub_assignments ORDER BY id")).rows as any[];
  const settingsRows = (await sqlite.execute("SELECT * FROM school_settings ORDER BY id")).rows as any[];

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

  // Note: IDs are identity columns; we insert without explicit ids to let PG assign them,
  // then remap old -> new ids to preserve relations.
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
      day: s.day,
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
        leaveType: l.leave_type,
        reason: l.reason,
        status: l.status,
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
      day: a.day,
      period: a.period,
      subject: a.subject,
      room: a.room,
      classLevel: a.class_level,
      status: a.status,
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
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
