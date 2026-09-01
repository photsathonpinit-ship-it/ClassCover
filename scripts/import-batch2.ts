import { db } from "../src/lib/db";
import { teachers, schedules } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";
import type { Day } from "../src/lib/db/schema";

type Row = { day: Day; period: number; subject: string; classLevel: string };

async function upsertTeacher(firstName: string, lastName: string, title: string, groups: string[]) {
  const existing = await db.query.teachers.findMany({ where: eq(teachers.firstName, firstName) });
  const found = existing.find(t => t.lastName === lastName);
  if (found) {
    await db.update(teachers).set({ title, subjectGroups: JSON.stringify(groups) }).where(eq(teachers.id, found.id));
    return found;
  }
  const [row] = await db.insert(teachers).values({ firstName, lastName, title, subjectGroups: JSON.stringify(groups), maxPeriodsPerDay: 4 }).returning();
  return row;
}
async function replaceSchedule(id: number, rows: Row[]) {
  await db.delete(schedules).where(eq(schedules.teacherId, id));
  if (rows.length) await db.insert(schedules).values(rows.map(r=>({ teacherId:id, day:r.day, period:r.period, subject:r.subject, classLevel:r.classLevel, room:"" })));
}

async function main() {
  console.log("Import batch 2: 9 teachers from new images...");

  // 1) นางสาวมินตรา จันทร์ไทย - ภาษาไทย/ต้านทุจริต
  const t1 = await upsertTeacher("มินตรา", "จันทร์ไทย", "ครู", ["ภาษาไทย","ต้านทุจริต","ลูกเสือ-ยุวกาชาด"]);
  await replaceSchedule(t1.id, [
    {day:"MON",period:1,subject:"ต้านทุจริต",classLevel:"ป.5/1"}, {day:"MON",period:2,subject:"ต้านทุจริต",classLevel:"ป.5/2"},
    {day:"TUE",period:1,subject:"ภาษาไทย",classLevel:"ป.6/2"}, {day:"TUE",period:2,subject:"ภาษาไทย",classLevel:"ป.6/3"}, {day:"TUE",period:3,subject:"ภาษาไทย",classLevel:"ป.6/1"},
    {day:"WED",period:1,subject:"ภาษาไทย",classLevel:"ป.6/1"}, {day:"WED",period:2,subject:"ภาษาไทย",classLevel:"ป.6/2"}, {day:"WED",period:3,subject:"ภาษาไทย",classLevel:"ป.6/3"}, {day:"WED",period:5,subject:"ลูกเสือ-ยุวกาชาด",classLevel:""},
    {day:"THU",period:1,subject:"ภาษาไทย",classLevel:"ป.6/2"}, {day:"THU",period:2,subject:"ภาษาไทย",classLevel:"ป.6/3"}, {day:"THU",period:3,subject:"ภาษาไทย",classLevel:"ป.6/1"},
    {day:"FRI",period:1,subject:"ภาษาไทย",classLevel:"ป.6/2"}, {day:"FRI",period:2,subject:"ภาษาไทย",classLevel:"ป.6/3"}, {day:"FRI",period:4,subject:"ภาษาไทย",classLevel:"ป.6/1"}, {day:"FRI",period:5,subject:"ชมรม",classLevel:""},
  ]);
  console.log(`  มินตรา -> 15 คาบ`);

  // 2) นางสาวกนกพร อุ่นมะดี - วิทยาศาสตร์
  const t2 = await upsertTeacher("กนกพร", "อุ่นมะดี", "ครู", ["วิทยาศาสตร์","ลูกเสือ-ยุวกาชาด"]);
  await replaceSchedule(t2.id, [
    {day:"MON",period:2,subject:"วิทยาศาสตร์",classLevel:"ป.4/1"}, {day:"MON",period:3,subject:"วิทยาศาสตร์",classLevel:"ป.4/2"}, {day:"MON",period:4,subject:"วิทยาศาสตร์",classLevel:"ป.5/1"}, {day:"MON",period:5,subject:"วิทยาศาสตร์",classLevel:"ป.5/2"},
    {day:"TUE",period:1,subject:"วิทยาศาสตร์",classLevel:"ป.4/1"}, {day:"TUE",period:3,subject:"วิทยาศาสตร์",classLevel:"ป.5/1"}, {day:"TUE",period:4,subject:"วิทยาศาสตร์",classLevel:"ป.5/2"}, {day:"TUE",period:5,subject:"วิทยาศาสตร์",classLevel:"ป.4/2"},
    {day:"WED",period:1,subject:"วิทยาศาสตร์",classLevel:"ป.6/3"}, {day:"WED",period:2,subject:"วิทยาศาสตร์",classLevel:"ป.6/1"}, {day:"WED",period:4,subject:"วิทยาศาสตร์",classLevel:"ป.6/2"}, {day:"WED",period:5,subject:"ลูกเสือ-ยุวกาชาด",classLevel:""},
    {day:"THU",period:4,subject:"วิทยาศาสตร์",classLevel:"ป.6/1"},
    {day:"FRI",period:1,subject:"วิทยาศาสตร์",classLevel:"ป.6/3"}, {day:"FRI",period:3,subject:"วิทยาศาสตร์",classLevel:"ป.6/2"}, {day:"FRI",period:5,subject:"ชมรม",classLevel:""},
  ]);
  console.log(`  กนกพร -> 16 คาบ`);

  // 3) นางสาวสุดารัตน์ วรรณกุล - คณิต/ต้านทุจริต
  const t3 = await upsertTeacher("สุดารัตน์", "วรรณกุล", "ครู", ["คณิตศาสตร์","ต้านทุจริต"]);
  await replaceSchedule(t3.id, [
    {day:"MON",period:1,subject:"คณิตศาสตร์",classLevel:"ป.6/3"}, {day:"MON",period:2,subject:"คณิตศาสตร์",classLevel:"ป.6/3"}, {day:"MON",period:3,subject:"คณิตศาสตร์",classLevel:"ป.6/2"}, {day:"MON",period:4,subject:"คณิตศาสตร์",classLevel:"ป.6/1"},
    {day:"TUE",period:4,subject:"คณิตศาสตร์",classLevel:"ป.6/2"}, {day:"TUE",period:5,subject:"คณิตศาสตร์",classLevel:"ป.6/1"},
    {day:"WED",period:2,subject:"คณิตศาสตร์",classLevel:"ป.6/3"}, {day:"WED",period:3,subject:"คณิตศาสตร์",classLevel:"ป.6/1"}, {day:"WED",period:5,subject:"ลูกเสือ-ยุวกาชาด",classLevel:""},
    {day:"THU",period:1,subject:"คณิตศาสตร์",classLevel:"ป.6/3"}, {day:"THU",period:3,subject:"คณิตศาสตร์",classLevel:"ป.6/2"}, {day:"THU",period:4,subject:"คณิตศาสตร์",classLevel:"ป.6/2"}, {day:"THU",period:5,subject:"คณิตศาสตร์",classLevel:"ป.6/1"},
    {day:"FRI",period:2,subject:"ต้านทุจริต",classLevel:"ป.4/1"}, {day:"FRI",period:3,subject:"ต้านทุจริต",classLevel:"ป.4/2"}, {day:"FRI",period:5,subject:"ชมรม",classLevel:""},
  ]);
  console.log(`  สุดารัตน์ -> 15 คาบ`);

  // 4) นายพสธร พินิจ - วิทย์คำนวณ/โปรแกรมเมอร์
  const t4 = await upsertTeacher("พสธร", "พินิจ", "ครู", ["วิทย์ คำนวณ","โปรแกรมเมอร์","การงาน","ลูกเสือ-ยุวกาชาด"]);
  await replaceSchedule(t4.id, [
    {day:"MON",period:4,subject:"วิทย์ คำนวณ",classLevel:"ป.6/3"}, {day:"MON",period:5,subject:"การงาน",classLevel:"ป.6/2"},
    {day:"TUE",period:1,subject:"วิทย์ คำนวณ",classLevel:"ป.5/2"}, {day:"TUE",period:2,subject:"วิทย์ คำนวณ",classLevel:"ป.6/1"}, {day:"TUE",period:3,subject:"วิทย์ คำนวณ",classLevel:"ป.6/2"},
    {day:"WED",period:1,subject:"โปรแกรมเมอร์",classLevel:"ป.3/2"}, {day:"WED",period:2,subject:"วิทย์ คำนวณ",classLevel:"ป.4/1"}, {day:"WED",period:3,subject:"โปรแกรมเมอร์",classLevel:"ป.3/1"}, {day:"WED",period:4,subject:"โปรแกรมเมอร์",classLevel:"ป.2/2"}, {day:"WED",period:5,subject:"ลูกเสือ-ยุวกาชาด",classLevel:""},
    {day:"THU",period:1,subject:"วิทย์ คำนวณ",classLevel:"ป.5/1"}, {day:"THU",period:2,subject:"การงาน",classLevel:"ป.6/1"}, {day:"THU",period:3,subject:"วิทย์ คำนวณ",classLevel:"ป.4/2"}, {day:"THU",period:5,subject:"การงาน",classLevel:"ป.6/3"},
    {day:"FRI",period:1,subject:"ต้านทุจริต",classLevel:"ป.6/1"}, {day:"FRI",period:2,subject:"ต้านทุจริต",classLevel:"ป.6/2"}, {day:"FRI",period:3,subject:"โปรแกรมเมอร์",classLevel:"ป.2/1"}, {day:"FRI",period:4,subject:"ต้านทุจริต",classLevel:"ป.6/3"}, {day:"FRI",period:5,subject:"ชมรม",classLevel:""},
  ]);
  console.log(`  พสธร -> 18 คาบ`);

  // 5) นางสาววัชิรัญญา พิมพ์ประชา - ภาษาไทย
  const t5 = await upsertTeacher("วัชิรัญญา", "พิมพ์ประชา", "ครู", ["ภาษาไทย","ลูกเสือ-ยุวกาชาด"]);
  await replaceSchedule(t5.id, [
    {day:"MON",period:2,subject:"ภาษาไทย",classLevel:"ป.5/1"}, {day:"MON",period:3,subject:"ภาษาไทย",classLevel:"ป.5/2"},
    {day:"TUE",period:1,subject:"ภาษาไทย",classLevel:"ป.4/2"}, {day:"TUE",period:2,subject:"ภาษาไทย",classLevel:"ป.4/1"}, {day:"TUE",period:3,subject:"ภาษาไทย",classLevel:"ป.5/2"}, {day:"TUE",period:4,subject:"ภาษาไทย",classLevel:"ป.5/1"},
    {day:"WED",period:1,subject:"ภาษาไทย",classLevel:"ป.4/2"}, {day:"WED",period:2,subject:"ภาษาไทย",classLevel:"ป.5/2"}, {day:"WED",period:4,subject:"ภาษาไทย",classLevel:"ป.5/1"}, {day:"WED",period:5,subject:"ลูกเสือ-ยุวกาชาด",classLevel:""},
    {day:"THU",period:1,subject:"ภาษาไทย",classLevel:"ป.4/1"}, {day:"THU",period:3,subject:"ภาษาไทย",classLevel:"ป.5/1"}, {day:"THU",period:4,subject:"ภาษาไทย",classLevel:"ป.4/2"}, {day:"THU",period:5,subject:"ภาษาไทย",classLevel:"ป.5/2"},
    {day:"FRI",period:1,subject:"ภาษาไทย",classLevel:"ป.4/1"}, {day:"FRI",period:2,subject:"ภาษาไทย",classLevel:"ป.4/2"}, {day:"FRI",period:4,subject:"ภาษาไทย",classLevel:"ป.4/1"}, {day:"FRI",period:5,subject:"ชมรม",classLevel:""},
  ]);
  console.log(`  วัชิรัญญา -> 17 คาบ`);

  // 6) นางสาวจิตติมา กุลอัก - สังคม/การงาน/ประวัติศาสตร์
  const t6 = await upsertTeacher("จิตติมา", "กุลอัก", "ครู", ["สังคมศึกษา","การงาน","ประวัติศาสตร์","ลูกเสือ-ยุวกาชาด"]);
  await replaceSchedule(t6.id, [
    {day:"MON",period:1,subject:"สังคมศึกษา",classLevel:"ป.5/2"}, {day:"MON",period:3,subject:"สังคมศึกษา",classLevel:"ป.4/1"}, {day:"MON",period:4,subject:"สังคมศึกษา",classLevel:"ป.4/2"}, {day:"MON",period:5,subject:"สังคมศึกษา",classLevel:"ป.5/1"},
    {day:"TUE",period:1,subject:"การงาน",classLevel:"ป.5/1"}, {day:"TUE",period:2,subject:"การงาน",classLevel:"ป.5/2"}, {day:"TUE",period:3,subject:"สังคมศึกษา",classLevel:"ป.4/1"}, {day:"TUE",period:4,subject:"สังคมศึกษา",classLevel:"ป.4/2"}, {day:"TUE",period:5,subject:"สังคมศึกษา",classLevel:"ป.6/3"},
    {day:"WED",period:2,subject:"สังคมศึกษา",classLevel:"ป.5/1"}, {day:"WED",period:3,subject:"สังคมศึกษา",classLevel:"ป.5/2"}, {day:"WED",period:4,subject:"สังคมศึกษา",classLevel:"ป.6/1"}, {day:"WED",period:5,subject:"ลูกเสือ-ยุวกาชาด",classLevel:""},
    {day:"THU",period:2,subject:"ประวัติศาสตร์",classLevel:"ป.5/1"}, {day:"THU",period:3,subject:"ประวัติศาสตร์",classLevel:"ป.5/2"}, {day:"THU",period:5,subject:"สังคมศึกษา",classLevel:"ป.6/2"},
    {day:"FRI",period:2,subject:"สังคมศึกษา",classLevel:"ป.6/1"}, {day:"FRI",period:3,subject:"สังคมศึกษา",classLevel:"ป.6/3"}, {day:"FRI",period:4,subject:"สังคมศึกษา",classLevel:"ป.6/2"}, {day:"FRI",period:5,subject:"ชมรม",classLevel:""},
  ]);
  console.log(`  จิตติมา -> 19 คาบ`);

  // 7) นายพนมรุ้ง วงคำหาญ - ภาษาอังกฤษ/แนะแนว
  const t7 = await upsertTeacher("พนมรุ้ง", "วงคำหาญ", "ครู", ["ภาษาอังกฤษ","แนะแนว","ลูกเสือ-ยุวกาชาด"]);
  await replaceSchedule(t7.id, [
    {day:"MON",period:2,subject:"ภาษาอังกฤษ",classLevel:"ป.6/1"}, {day:"MON",period:4,subject:"ภาษาอังกฤษ",classLevel:"ป.6/2"}, {day:"MON",period:5,subject:"ภาษาอังกฤษ",classLevel:"ป.6/3"},
    {day:"TUE",period:2,subject:"ภาษาอังกฤษ",classLevel:"ป.4/2"}, {day:"TUE",period:4,subject:"ภาษาอังกฤษ",classLevel:"ป.6/1"}, {day:"TUE",period:5,subject:"ภาษาอังกฤษ",classLevel:"ป.4/1"},
    {day:"WED",period:1,subject:"ภาษาอังกฤษ",classLevel:"ป.5/2"}, {day:"WED",period:3,subject:"ภาษาอังกฤษ",classLevel:"ป.6/2"}, {day:"WED",period:4,subject:"ภาษาอังกฤษ",classLevel:"ป.6/3"}, {day:"WED",period:5,subject:"ลูกเสือ-ยุวกาชาด",classLevel:""},
    {day:"THU",period:2,subject:"ภาษาอังกฤษ",classLevel:"ป.5/2"}, {day:"THU",period:3,subject:"ภาษาอังกฤษ",classLevel:"ป.4/1"}, {day:"THU",period:4,subject:"ภาษาอังกฤษ",classLevel:"ป.4/2"}, {day:"THU",period:5,subject:"ภาษาอังกฤษ",classLevel:"ป.5/1"},
    {day:"FRI",period:2,subject:"ภาษาอังกฤษ",classLevel:"ป.5/1"}, {day:"FRI",period:3,subject:"แนะแนว",classLevel:"ป.4/1"}, {day:"FRI",period:4,subject:"แนะแนว",classLevel:"ป.4/2"}, {day:"FRI",period:5,subject:"ชมรม",classLevel:""},
  ]);
  console.log(`  พนมรุ้ง -> 17 คาบ`);

  // 8) นางสาวศิริพร บูรณเดช - คณิตศาสตร์
  const t8 = await upsertTeacher("ศิริพร", "บูรณเดช", "ครู", ["คณิตศาสตร์","ลูกเสือ-ยุวกาชาด"]);
  await replaceSchedule(t8.id, [
    {day:"MON",period:1,subject:"คณิตศาสตร์",classLevel:"ป.4/2"}, {day:"MON",period:5,subject:"คณิตศาสตร์",classLevel:"ป.4/1"},
    {day:"TUE",period:2,subject:"คณิตศาสตร์",classLevel:"ป.5/1"}, {day:"TUE",period:3,subject:"คณิตศาสตร์",classLevel:"ป.4/2"}, {day:"TUE",period:4,subject:"คณิตศาสตร์",classLevel:"ป.4/1"}, {day:"TUE",period:5,subject:"คณิตศาสตร์",classLevel:"ป.5/2"},
    {day:"WED",period:1,subject:"คณิตศาสตร์",classLevel:"ป.5/1"}, {day:"WED",period:3,subject:"คณิตศาสตร์",classLevel:"ป.4/2"}, {day:"WED",period:4,subject:"คณิตศาสตร์",classLevel:"ป.4/1"}, {day:"WED",period:5,subject:"ลูกเสือ-ยุวกาชาด",classLevel:""},
    {day:"THU",period:1,subject:"คณิตศาสตร์",classLevel:"ป.5/2"}, {day:"THU",period:2,subject:"คณิตศาสตร์",classLevel:"ป.4/2"}, {day:"THU",period:4,subject:"คณิตศาสตร์",classLevel:"ป.5/1"}, {day:"THU",period:5,subject:"คณิตศาสตร์",classLevel:"ป.4/1"},
    {day:"FRI",period:1,subject:"คณิตศาสตร์",classLevel:"ป.5/2"}, {day:"FRI",period:3,subject:"คณิตศาสตร์",classLevel:"ป.5/2"}, {day:"FRI",period:4,subject:"คณิตศาสตร์",classLevel:"ป.5/1"}, {day:"FRI",period:5,subject:"ชมรม",classLevel:""},
  ]);
  console.log(`  ศิริพร บูรณเดช -> 18 คาบ`);

  // 9) ว่าที่ร้อยตรีธวัชชัย โพธิ์ทา - ศิลปะ/ดนตรี/การงาน
  const t9 = await upsertTeacher("ธวัชชัย", "โพธิ์ทา", "ครู", ["ศิลปะ","ดนตรี","การงานอาชีพ","ประวัติศาสตร์","ลูกเสือ-ยุวกาชาด"]);
  await replaceSchedule(t9.id, [
    {day:"MON",period:1,subject:"ดนตรี",classLevel:"ป.6/1"}, {day:"MON",period:2,subject:"ศิลปะ",classLevel:"ป.6/2"}, {day:"MON",period:3,subject:"ศิลปะ",classLevel:"ป.6/1"}, {day:"MON",period:4,subject:"ศิลปะ",classLevel:"ป.4/1"}, {day:"MON",period:5,subject:"ศิลปะ",classLevel:"ป.4/2"},
    {day:"TUE",period:1,subject:"ศิลปะ",classLevel:"ป.6/3"}, {day:"TUE",period:2,subject:"ดนตรี",classLevel:"ป.6/2"}, {day:"TUE",period:3,subject:"ดนตรี",classLevel:"ป.6/3"}, {day:"TUE",period:5,subject:"ศิลปะ",classLevel:"ป.5/1"},
    {day:"WED",period:3,subject:"การงานอาชีพ",classLevel:"ป.4/1"}, {day:"WED",period:4,subject:"ประวัติศาสตร์",classLevel:"ป.4/2"}, {day:"WED",period:5,subject:"ลูกเสือ-ยุวกาชาด",classLevel:""},
    {day:"THU",period:1,subject:"ดนตรี",classLevel:"ป.4/2"}, {day:"THU",period:2,subject:"ประวัติศาสตร์",classLevel:"ป.4/1"}, {day:"THU",period:4,subject:"ดนตรี",classLevel:"ป.4/1"}, {day:"THU",period:5,subject:"ศิลปะ",classLevel:"ป.5/2"},
    {day:"FRI",period:1,subject:"การงานอาชีพ",classLevel:"ป.4/2"}, {day:"FRI",period:2,subject:"ดนตรี",classLevel:"ป.5/2"}, {day:"FRI",period:3,subject:"ดนตรี",classLevel:"ป.5/1"}, {day:"FRI",period:5,subject:"ชมรม",classLevel:""},
  ]);
  console.log(`  ธวัชชัย -> 18 คาบ`);

  const all = await db.select().from(teachers);
  console.log(`Total teachers: ${all.length}`);
}

main().catch(e=>{ console.error(e); process.exit(1); });
