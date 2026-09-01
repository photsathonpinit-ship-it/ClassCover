import { db } from "../src/lib/db";
import { teachers, schedules } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";
import type { Day } from "../src/lib/db/schema";

// แมปคาบจากรูป: 08.45→1, 09.45→2, 10.45→3, 13.00→4, 14.00→5 (ทับของเดิม 1-5; กิจกรรม 08.30/พัก/PLC/ลดเวลา ไม่นับ)
type Row = { day: Day; period: number; subject: string; classLevel: string; room?: string };

async function upsertTeacher(firstName: string, lastName: string, title: string, subjectGroups: string[], phone?: string) {
  const existing = await db.query.teachers.findFirst({ where: eq(teachers.firstName, firstName) });
  // เช็คซ้ำด้วยชื่อ+นามสกุล
  const found = existing && existing.lastName === lastName ? existing : null;
  if (found) {
    await db.update(teachers).set({ title, subjectGroups: JSON.stringify(subjectGroups) }).where(eq(teachers.id, found.id));
    return found;
  }
  const [row] = await db.insert(teachers).values({ firstName, lastName, title, subjectGroups: JSON.stringify(subjectGroups), phone, maxPeriodsPerDay: 4 }).returning();
  return row;
}

async function replaceSchedule(teacherId: number, rows: Row[]) {
  await db.delete(schedules).where(eq(schedules.teacherId, teacherId));
  if (rows.length === 0) return;
  await db.insert(schedules).values(rows.map(r => ({ teacherId, day: r.day, period: r.period, subject: r.subject, classLevel: r.classLevel, room: r.room ?? "" })));
}

async function main() {
  console.log("Importing 3 teachers from images...");

  // 1) นายณัฐพงษ์ ช่ออังชัน
  const t1 = await upsertTeacher("ณัฐพงษ์", "ช่ออังชัน", "ครู", ["พละ","สุขศึกษา","แนะแนว","ลูกเสือ-ยุวกาชาด"], "081-888-0001");
  const t1Rows: Row[] = [
    // จันทร์
    { day: "MON", period: 1, subject: "พละ", classLevel: "ป.4/1", room: "" },
    { day: "MON", period: 2, subject: "พละ", classLevel: "ป.4/2", room: "" },
    { day: "MON", period: 3, subject: "พละ", classLevel: "ป.5/1", room: "" },
    { day: "MON", period: 4, subject: "พละ", classLevel: "ป.5/2", room: "" },
    // อังคาร
    { day: "TUE", period: 1, subject: "พละ", classLevel: "ป.6/1", room: "" },
    { day: "TUE", period: 4, subject: "พละ", classLevel: "ป.6/3", room: "" },
    { day: "TUE", period: 5, subject: "พละ", classLevel: "ป.6/2", room: "" },
    // พุธ
    { day: "WED", period: 1, subject: "สุขศึกษา", classLevel: "ป.4/1", room: "" },
    { day: "WED", period: 2, subject: "สุขศึกษา", classLevel: "ป.4/2", room: "" },
    { day: "WED", period: 3, subject: "สุขศึกษา", classLevel: "ป.5/1", room: "" },
    { day: "WED", period: 4, subject: "สุขศึกษา", classLevel: "ป.5/2", room: "" },
    { day: "WED", period: 5, subject: "ลูกเสือ-ยุวกาชาด", classLevel: "", room: "" },
    // พฤหัส
    { day: "THU", period: 1, subject: "สุขศึกษา", classLevel: "ป.6/1", room: "" },
    { day: "THU", period: 2, subject: "สุขศึกษา", classLevel: "ป.6/2", room: "" },
    { day: "THU", period: 3, subject: "สุขศึกษา", classLevel: "ป.6/3", room: "" },
    // ศุกร์
    { day: "FRI", period: 1, subject: "แนะแนว", classLevel: "ป.5/1", room: "" },
    { day: "FRI", period: 4, subject: "แนะแนว", classLevel: "ป.5/2", room: "" },
    { day: "FRI", period: 5, subject: "ชมรม", classLevel: "", room: "" },
  ];
  await replaceSchedule(t1.id, t1Rows);
  console.log(`  ${t1.title} ${t1.firstName} ${t1.lastName} -> ${t1Rows.length} คาบ`);

  // 2) นางสาวกิติยา สำลีกกลาง (ในรูปเขียน สำลีกลาง / สำลีกกลาง - ใช้ตามรูป 2)
  const t2 = await upsertTeacher("กิติยา", "สำลีกลาง", "ครู", ["คณิตศาสตร์","การงานอาชีพ","กิจกรรม PBL","หนูน้อยพอเพียง","ลูกเสือ-ยุวกาชาด"], "081-888-0002");
  const t2Rows: Row[] = [
    // จันทร์
    { day: "MON", period: 2, subject: "คณิตศาสตร์", classLevel: "ป.3/2", room: "" },
    { day: "MON", period: 3, subject: "คณิตศาสตร์", classLevel: "ป.3/1", room: "" },
    { day: "MON", period: 4, subject: "หนูน้อยพอเพียง", classLevel: "ป.3/1", room: "" },
    { day: "MON", period: 5, subject: "กิจกรรม PBL", classLevel: "", room: "" },
    // อังคาร
    { day: "TUE", period: 1, subject: "การงานอาชีพ", classLevel: "ป.5/1", room: "" },
    { day: "TUE", period: 2, subject: "การงานอาชีพ", classLevel: "ป.5/2", room: "" },
    { day: "TUE", period: 3, subject: "คณิตศาสตร์", classLevel: "ป.3/2", room: "" },
    { day: "TUE", period: 4, subject: "คณิตศาสตร์", classLevel: "ป.3/1", room: "" },
    { day: "TUE", period: 5, subject: "กิจกรรม PBL", classLevel: "", room: "" },
    // พุธ
    { day: "WED", period: 2, subject: "คณิตศาสตร์", classLevel: "ป.3/1", room: "" },
    { day: "WED", period: 4, subject: "คณิตศาสตร์", classLevel: "ป.3/2", room: "" },
    { day: "WED", period: 5, subject: "ลูกเสือ-ยุวกาชาด", classLevel: "", room: "" },
    // พฤหัส
    { day: "THU", period: 1, subject: "คณิตศาสตร์", classLevel: "ป.3/2", room: "" },
    { day: "THU", period: 2, subject: "คณิตศาสตร์", classLevel: "ป.3/1", room: "" },
    { day: "THU", period: 3, subject: "หนูน้อยพอเพียง", classLevel: "ป.3/1", room: "" },
    { day: "THU", period: 5, subject: "กิจกรรม PBL", classLevel: "", room: "" },
    // ศุกร์
    { day: "FRI", period: 4, subject: "กิจกรรม PBL", classLevel: "", room: "" },
    { day: "FRI", period: 5, subject: "อบรมคุณธรรม จริยธรรม", classLevel: "", room: "" },
  ];
  await replaceSchedule(t2.id, t2Rows);
  console.log(`  ${t2.title} ${t2.firstName} ${t2.lastName} -> ${t2Rows.length} คาบ`);

  // 3) นางพรทิพย์ โพชฌงค์ขันธ์
  const t3 = await upsertTeacher("พรทิพย์", "โพชฌงค์ขันธ์", "ครู", ["บกพร่องทางร่างกาย","บกพร่องทางการเรียนรู้"], "081-888-0003");
  const t3Rows: Row[] = [
    // จันทร์
    { day: "MON", period: 1, subject: "บกพร่องทางร่างกาย", classLevel: "", room: "" },
    { day: "MON", period: 2, subject: "บกพร่องทางร่างกาย", classLevel: "", room: "" },
    { day: "MON", period: 3, subject: "บกพร่องทางร่างกาย", classLevel: "", room: "" },
    { day: "MON", period: 4, subject: "บกพร่องทางการเรียนรู้", classLevel: "ป.3", room: "" },
    { day: "MON", period: 5, subject: "บกพร่องทางการเรียนรู้", classLevel: "ป.4", room: "" },
    // อังคาร
    { day: "TUE", period: 1, subject: "บกพร่องทางร่างกาย", classLevel: "", room: "" },
    { day: "TUE", period: 2, subject: "บกพร่องทางร่างกาย", classLevel: "", room: "" },
    { day: "TUE", period: 3, subject: "บกพร่องทางร่างกาย", classLevel: "", room: "" },
    { day: "TUE", period: 4, subject: "บกพร่องทางการเรียนรู้", classLevel: "ป.3", room: "" },
    { day: "TUE", period: 5, subject: "บกพร่องทางการเรียนรู้", classLevel: "ป.4", room: "" },
    // พุธ
    { day: "WED", period: 1, subject: "บกพร่องทางร่างกาย", classLevel: "", room: "" },
    { day: "WED", period: 2, subject: "บกพร่องทางร่างกาย", classLevel: "", room: "" },
    { day: "WED", period: 3, subject: "บกพร่องทางร่างกาย", classLevel: "", room: "" },
    { day: "WED", period: 4, subject: "บกพร่องทางการเรียนรู้", classLevel: "ป.4", room: "" },
    // พฤหัส
    { day: "THU", period: 1, subject: "บกพร่องทางร่างกาย", classLevel: "", room: "" },
    { day: "THU", period: 2, subject: "บกพร่องทางร่างกาย", classLevel: "", room: "" },
    { day: "THU", period: 3, subject: "บกพร่องทางร่างกาย", classLevel: "", room: "" },
    { day: "THU", period: 4, subject: "บกพร่องทางการเรียนรู้", classLevel: "ป.4", room: "" },
    { day: "THU", period: 5, subject: "บกพร่องทางการเรียนรู้", classLevel: "ป.3", room: "" },
    // ศุกร์
    { day: "FRI", period: 1, subject: "บกพร่องทางร่างกาย", classLevel: "", room: "" },
    { day: "FRI", period: 2, subject: "บกพร่องทางร่างกาย", classLevel: "", room: "" },
    { day: "FRI", period: 3, subject: "บกพร่องทางร่างกาย", classLevel: "", room: "" },
    { day: "FRI", period: 4, subject: "บกพร่องทางการเรียนรู้", classLevel: "ป.3", room: "" },
  ];
  await replaceSchedule(t3.id, t3Rows);
  console.log(`  ${t3.title} ${t3.firstName} ${t3.lastName} -> ${t3Rows.length} คาบ`);

  console.log("Import complete!");
  const allT = await db.select().from(teachers);
  console.log(`ครูทั้งหมดตอนนี้: ${allT.length} คน`);
}

main().catch(e => { console.error(e); process.exit(1); });
