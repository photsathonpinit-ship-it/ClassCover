import { db } from "../src/lib/db";
import { teachers, schedules } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";
import type { Day } from "../src/lib/db/schema";
type Row = { day: Day; period: number; subject: string; classLevel: string };
async function upsert(firstName: string, lastName: string, title: string, groups: string[]) {
  const all = await db.query.teachers.findMany({ where: eq(teachers.firstName, firstName) });
  const found = all.find(t => t.lastName === lastName);
  if (found) { await db.update(teachers).set({ title, subjectGroups: JSON.stringify(groups) }).where(eq(teachers.id, found.id)); return found; }
  const [row] = await db.insert(teachers).values({ firstName, lastName, title, subjectGroups: JSON.stringify(groups), maxPeriodsPerDay: 4 }).returning();
  return row;
}
async function replace(id: number, rows: Row[]) {
  await db.delete(schedules).where(eq(schedules.teacherId, id));
  if (rows.length) await db.insert(schedules).values(rows.map(r=>({ teacherId:id, day:r.day, period:r.period, subject:r.subject, classLevel:r.classLevel, room:"" })));
}
async function main(){
  console.log("Import batch 3: 8 teachers...");
  // 1) นายนรินทร์ วงษ์สา - คณิต/วิทย์
  const t1 = await upsert("นรินทร์","วงษ์สา","ครู",["คณิตศาสตร์","วิทยาศาสตร์","ลูกเสือ-ยุวกาชาด"]);
  await replace(t1.id, [
    {day:"MON",period:1,subject:"คณิตศาสตร์",classLevel:"ป.2/2"}, {day:"MON",period:2,subject:"คณิตศาสตร์",classLevel:"ป.2/1"}, {day:"MON",period:4,subject:"วิทยาศาสตร์",classLevel:"ป.1/1"},
    {day:"TUE",period:1,subject:"วิทยาศาสตร์",classLevel:"ป.2/2"}, {day:"TUE",period:2,subject:"วิทยาศาสตร์",classLevel:"ป.1/2"}, {day:"TUE",period:3,subject:"วิทยาศาสตร์",classLevel:"ป.2/1"},
    {day:"WED",period:1,subject:"คณิตศาสตร์",classLevel:"ป.2/2"}, {day:"WED",period:2,subject:"คณิตศาสตร์",classLevel:"ป.2/1"}, {day:"WED",period:3,subject:"วิทยาศาสตร์",classLevel:"ป.3/2"}, {day:"WED",period:4,subject:"วิทยาศาสตร์",classLevel:"ป.3/1"}, {day:"WED",period:5,subject:"ลูกเสือ-ยุวกาชาด",classLevel:""},
    {day:"THU",period:1,subject:"วิทยาศาสตร์",classLevel:"ป.3/1"}, {day:"THU",period:2,subject:"วิทยาศาสตร์",classLevel:"ป.3/2"}, {day:"THU",period:3,subject:"คณิตศาสตร์",classLevel:"ป.2/1"}, {day:"THU",period:4,subject:"คณิตศาสตร์",classLevel:"ป.2/2"},
    {day:"FRI",period:1,subject:"คณิตศาสตร์",classLevel:"ป.2/1"}, {day:"FRI",period:2,subject:"คณิตศาสตร์",classLevel:"ป.2/1"}, {day:"FRI",period:3,subject:"คณิตศาสตร์",classLevel:"ป.2/2"}, {day:"FRI",period:4,subject:"คณิตศาสตร์",classLevel:"ป.2/2"},
  ]);
  console.log("  นรินทร์ -> 18 คาบ");
  // 2) นางเจริญรัตน์ ชนะพันธ์ - ภาษาไทย/หนูน้อยพอเพียง/ลูกเสือ/PBL
  const t2 = await upsert("เจริญรัตน์","ชนะพันธ์","ครู",["ภาษาไทย","หนูน้อยพอเพียง","ลูกเสือ-ยุวกาชาด","กิจกรรม PBL"]);
  await replace(t2.id, [
    {day:"MON",period:1,subject:"ภาษาไทย",classLevel:"ป.3/2"}, {day:"MON",period:2,subject:"ภาษาไทย",classLevel:"ป.3/1"}, {day:"MON",period:4,subject:"หนูน้อยพอเพียง",classLevel:"ป.3/2"}, {day:"MON",period:5,subject:"กิจกรรม PBL",classLevel:""},
    {day:"TUE",period:1,subject:"ภาษาไทย",classLevel:"ป.3/2"}, {day:"TUE",period:2,subject:"ภาษาไทย",classLevel:"ป.3/1"}, {day:"TUE",period:5,subject:"กิจกรรม PBL",classLevel:""},
    {day:"WED",period:1,subject:"ภาษาไทย",classLevel:"ป.3/1"}, {day:"WED",period:2,subject:"ภาษาไทย",classLevel:"ป.3/2"}, {day:"WED",period:5,subject:"ลูกเสือ-ยุวกาชาด",classLevel:""},
    {day:"THU",period:3,subject:"ภาษาไทย",classLevel:"ป.3/2"}, {day:"THU",period:4,subject:"หนูน้อยพอเพียง",classLevel:"ป.3/2"}, {day:"THU",period:5,subject:"กิจกรรม PBL",classLevel:""},
    {day:"FRI",period:2,subject:"ภาษาไทย",classLevel:"ป.3/1"}, {day:"FRI",period:4,subject:"กิจกรรม PBL",classLevel:""}, {day:"FRI",period:5,subject:"กิจกรรม อบรมคุณธรรม จริยธรรม",classLevel:""},
  ]);
  console.log("  เจริญรัตน์ -> 14 คาบ");
  // 3) นายบุญเกิด จำปาใหญ่ - เด็กดีศรีหนองควาย/ประวัติศาสตร์/สุขภาพ
  const t3 = await upsert("บุญเกิด","จำปาใหญ่","ครู",["เด็กดีศรีหนองควาย","ประวัติศาสตร์","สุขภาพดีชีวีมีสุข","ลูกเสือ-ยุวกาชาด"]);
  await replace(t3.id, [
    {day:"MON",period:2,subject:"เด็กดีศรีหนองควาย",classLevel:"ป.2/2"}, {day:"MON",period:3,subject:"ประวัติศาสตร์",classLevel:"ป.6/3"}, {day:"MON",period:4,subject:"เด็กดีศรีหนองควาย",classLevel:"ป.2/1"}, {day:"MON",period:5,subject:"ประวัติศาสตร์",classLevel:"ป.6/1"},
    {day:"TUE",period:2,subject:"เด็กดีศรีหนองควาย",classLevel:"ป.3/2"}, {day:"TUE",period:3,subject:"เด็กดีศรีหนองควาย",classLevel:"ป.3/1"}, {day:"TUE",period:4,subject:"เด็กดีศรีหนองควาย",classLevel:"ป.1/1"},
    {day:"WED",period:1,subject:"ประวัติศาสตร์",classLevel:"ป.6/2"}, {day:"WED",period:2,subject:"เด็กดีศรีหนองควาย",classLevel:"ป.1/2"}, {day:"WED",period:3,subject:"เด็กดีศรีหนองควาย",classLevel:"ป.3/2"}, {day:"WED",period:5,subject:"ลูกเสือ-ยุวกาชาด",classLevel:""},
    {day:"THU",period:1,subject:"สุขภาพดีชีวีมีสุข",classLevel:"ป.2/1"}, {day:"THU",period:2,subject:"สุขภาพดีชีวีมีสุข",classLevel:"ป.2/2"}, {day:"THU",period:3,subject:"สุขภาพดีชีวีมีสุข",classLevel:"ป.1/2"}, {day:"THU",period:4,subject:"สุขภาพดีชีวีมีสุข",classLevel:"ป.1/1"},
    {day:"FRI",period:1,subject:"สุขภาพดีชีวีมีสุข",classLevel:"ป.3/1"}, {day:"FRI",period:2,subject:"สุขภาพดีชีวีมีสุข",classLevel:"ป.3/2"}, {day:"FRI",period:3,subject:"เด็กดีศรีหนองควาย",classLevel:"ป.3/1"},
  ]);
  console.log("  บุญเกิด -> 17 คาบ");
  // 4) นายพยัญ ผาบสิมมา - ภาษาไทย/PBL/ลูกเสือ
  const t4 = await upsert("พยัญ","ผาบสิมมา","ครู",["ภาษาไทย","กิจกรรม PBL","ลูกเสือ-ยุวกาชาด"]);
  await replace(t4.id, [
    {day:"MON",period:1,subject:"ภาษาไทย",classLevel:"ป.2/1"}, {day:"MON",period:3,subject:"ภาษาไทย",classLevel:"ป.2/2"}, {day:"MON",period:5,subject:"กิจกรรม PBL",classLevel:""},
    {day:"TUE",period:1,subject:"ภาษาไทย",classLevel:"ป.2/1"}, {day:"TUE",period:4,subject:"ภาษาไทย",classLevel:"ป.2/2"}, {day:"TUE",period:5,subject:"กิจกรรม PBL",classLevel:""},
    {day:"WED",period:3,subject:"ภาษาไทย",classLevel:"ป.2/2"}, {day:"WED",period:4,subject:"ภาษาไทย",classLevel:"ป.2/1"}, {day:"WED",period:5,subject:"ลูกเสือ-ยุวกาชาด",classLevel:""},
    {day:"THU",period:1,subject:"ภาษาไทย",classLevel:"ป.2/2"}, {day:"THU",period:2,subject:"ภาษาไทย",classLevel:"ป.2/1"}, {day:"THU",period:4,subject:"ภาษาไทย",classLevel:"ป.2/1"}, {day:"THU",period:5,subject:"กิจกรรม PBL",classLevel:""},
    {day:"FRI",period:1,subject:"ภาษาไทย",classLevel:"ป.2/2"}, {day:"FRI",period:2,subject:"กิจกรรม PBL",classLevel:""}, {day:"FRI",period:4,subject:"กิจกรรม PBL",classLevel:""}, {day:"FRI",period:5,subject:"กิจกรรม อบรมคุณธรรม จริยธรรม",classLevel:""},
  ]);
  console.log("  พยัญ -> 15 คาบ");
  // 5) นางสาวกนกกานต์ แสงมณี - แนะแนว/ศิลปะดนตรี/หนูน้อย
  const t5 = await upsert("กนกกานต์","แสงมณี","ครู",["แนะแนว","ศิลปะ ดนตรี","หนูน้อยพอเพียง","ลูกเสือ-ยุวกาชาด"]);
  await replace(t5.id, [
    {day:"MON",period:1,subject:"แนะแนว",classLevel:"ป.6/2"}, {day:"MON",period:3,subject:"ศิลปะ ดนตรี",classLevel:"ป.3/2"}, {day:"MON",period:4,subject:"หนูน้อยพอเพียง",classLevel:"ป.2/2"}, {day:"MON",period:5,subject:"กิจกรรม PBL",classLevel:""},
    {day:"TUE",period:1,subject:"ศิลปะ ดนตรี",classLevel:"ป.3/1"}, {day:"TUE",period:2,subject:"ศิลปะ ดนตรี",classLevel:"ป.2/2"}, {day:"TUE",period:4,subject:"ศิลปะ ดนตรี",classLevel:"ป.2/1"}, {day:"TUE",period:5,subject:"กิจกรรม PBL",classLevel:""},
    {day:"WED",period:3,subject:"หนูน้อยพอเพียง",classLevel:"ป.2/1"}, {day:"WED",period:4,subject:"ศิลปะ ดนตรี",classLevel:"ป.1/1"}, {day:"WED",period:5,subject:"ลูกเสือ-ยุวกาชาด",classLevel:""},
    {day:"THU",period:4,subject:"แนะแนว",classLevel:"ป.6/3"}, {day:"THU",period:5,subject:"กิจกรรม PBL",classLevel:""},
    {day:"FRI",period:2,subject:"ศิลปะ ดนตรี",classLevel:"ป.1/2"}, {day:"FRI",period:3,subject:"แนะแนว",classLevel:"ป.6/1"}, {day:"FRI",period:4,subject:"กิจกรรม PBL",classLevel:""}, {day:"FRI",period:5,subject:"กิจกรรม อบรมคุณธรรม จริยธรรม",classLevel:""},
  ]);
  console.log("  กนกกานต์ -> 15 คาบ");
  // 6) Miss Chelena Lum - English
  const t6 = await upsert("Chelena","Lum","ครู",["English"]);
  await replace(t6.id, [
    {day:"MON",period:1,subject:"English",classLevel:"ป.3/1"}, {day:"MON",period:3,subject:"English",classLevel:"ป.2/1"}, {day:"MON",period:4,subject:"English",classLevel:"ป.1/2"},
    {day:"TUE",period:1,subject:"English",classLevel:"ป.1/1"}, {day:"TUE",period:2,subject:"English",classLevel:"ป.2/1"}, {day:"TUE",period:3,subject:"English",classLevel:"ป.2/2"}, {day:"TUE",period:4,subject:"English",classLevel:"ป.1/2"},
    {day:"WED",period:1,subject:"English",classLevel:"ป.2/1"}, {day:"WED",period:2,subject:"English",classLevel:"ป.2/2"}, {day:"WED",period:3,subject:"English",classLevel:"ป.1/1"}, {day:"WED",period:4,subject:"English",classLevel:"ป.1/2"},
    {day:"THU",period:1,subject:"English",classLevel:"ป.1/2"}, {day:"THU",period:2,subject:"English",classLevel:"ป.1/1"}, {day:"THU",period:3,subject:"English",classLevel:"ป.2/2"}, {day:"THU",period:4,subject:"English",classLevel:"ป.3/1"},
    {day:"FRI",period:1,subject:"English",classLevel:"ป.3/2"}, {day:"FRI",period:3,subject:"English",classLevel:"ป.3/2"}, {day:"FRI",period:4,subject:"English",classLevel:"ป.1/1"},
  ]);
  console.log("  Chelena -> 17 คาบ");
  // 7) ว่าที่ร้อยตรีชลชัย ศิริสิมะ - คณิต/PBL/ลูกเสือ
  const t7 = await upsert("ชลชัย","ศิริสิมะ","ครู",["คณิตศาสตร์","กิจกรรม PBL","ลูกเสือ-ยุวกาชาด","หนูน้อยพอเพียง"]);
  await replace(t7.id, [
    {day:"MON",period:1,subject:"คณิตศาสตร์",classLevel:"ป.1/2"}, {day:"MON",period:2,subject:"คณิตศาสตร์",classLevel:"ป.1/1"}, {day:"MON",period:3,subject:"หนูน้อยพอเพียง",classLevel:"ป.1/2"}, {day:"MON",period:5,subject:"กิจกรรม PBL",classLevel:""},
    {day:"TUE",period:2,subject:"คณิตศาสตร์",classLevel:"ป.1/1"}, {day:"TUE",period:3,subject:"คณิตศาสตร์",classLevel:"ป.1/2"}, {day:"TUE",period:5,subject:"กิจกรรม PBL",classLevel:""},
    {day:"WED",period:1,subject:"คณิตศาสตร์",classLevel:"ป.1/2"}, {day:"WED",period:2,subject:"คณิตศาสตร์",classLevel:"ป.1/1"}, {day:"WED",period:5,subject:"ลูกเสือ-ยุวกาชาด",classLevel:""},
    {day:"THU",period:2,subject:"คณิตศาสตร์",classLevel:"ป.1/2"}, {day:"THU",period:3,subject:"คณิตศาสตร์",classLevel:"ป.1/1"}, {day:"THU",period:5,subject:"กิจกรรม PBL",classLevel:""},
    {day:"FRI",period:1,subject:"กิจกรรม PBL",classLevel:""}, {day:"FRI",period:2,subject:"คณิตศาสตร์",classLevel:"ป.1/1"}, {day:"FRI",period:3,subject:"คณิตศาสตร์",classLevel:"ป.1/2"},
  ]);
  console.log("  ชลชัย -> 15 คาบ");
  // 8) นายทรงชัย เที่ยงธรรม - ภาษาไทย/หนูน้อย/PBL/ลูกเสือ
  const t8 = await upsert("ทรงชัย","เที่ยงธรรม","ครู",["ภาษาไทย","หนูน้อยพอเพียง","กิจกรรม PBL","ลูกเสือ-ยุวกาชาด"]);
  await replace(t8.id, [
    {day:"MON",period:1,subject:"ภาษาไทย",classLevel:"ป.1/1"}, {day:"MON",period:2,subject:"ภาษาไทย",classLevel:"ป.1/2"}, {day:"MON",period:3,subject:"หนูน้อยพอเพียง",classLevel:"ป.1/1"}, {day:"MON",period:5,subject:"กิจกรรม PBL",classLevel:""},
    {day:"TUE",period:1,subject:"ภาษาไทย",classLevel:"ป.1/2"}, {day:"TUE",period:3,subject:"ภาษาไทย",classLevel:"ป.1/1"}, {day:"TUE",period:5,subject:"กิจกรรม PBL",classLevel:""},
    {day:"WED",period:1,subject:"ภาษาไทย",classLevel:"ป.1/1"}, {day:"WED",period:2,subject:"ภาษาไทย",classLevel:"ป.1/2"}, {day:"WED",period:4,subject:"ลูกเสือ-ยุวกาชาด",classLevel:""},
    {day:"THU",period:1,subject:"ภาษาไทย",classLevel:"ป.1/1"}, {day:"THU",period:4,subject:"ภาษาไทย",classLevel:"ป.1/2"}, {day:"THU",period:5,subject:"กิจกรรม PBL",classLevel:""},
    {day:"FRI",period:1,subject:"กิจกรรม PBL",classLevel:""}, {day:"FRI",period:3,subject:"ภาษาไทย",classLevel:"ป.1/1"}, {day:"FRI",period:4,subject:"ภาษาไทย",classLevel:"ป.1/2"}, {day:"FRI",period:5,subject:"กิจกรรม อบรมคุณธรรม จริยธรรม",classLevel:""},
  ]);
  console.log("  ทรงชัย -> 15 คาบ");
  // พรทิพย์ ซ้ำ - ข้าม (มีแล้ว)
  const all = await db.select().from(teachers);
  console.log(`Total teachers: ${all.length}`);
}
main().catch(e=>{console.error(e); process.exit(1);});
