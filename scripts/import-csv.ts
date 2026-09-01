import fs from "fs";
import { db } from "../src/lib/db";
import { teachers, schedules } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";
import type { Day } from "../src/lib/db/schema";

const DAYS = new Set(["MON","TUE","WED","THU","FRI"]);
async function main() {
  const file = process.argv[2];
  if (!file) { console.log("ใช้: npx tsx scripts/import-csv.ts path/to/file.csv"); process.exit(1); }
  const raw = fs.readFileSync(file, "utf-8");
  const lines = raw.split(/\r?\n/).filter(l => l.trim());
  const header = lines[0].split(",").map(s => s.trim());
  console.log("Header:", header.join(" | "));
  const idx = (name: string) => header.indexOf(name);
  const need = ["ชื่อ","นามสกุล","วัน","คาบ","วิชา"];
  for (const n of need) if (idx(n)===-1) { console.error(`ขาดคอลัมน์ ${n}`); process.exit(1); }

  // รวมตามครู
  const byTeacher = new Map<string, { firstName: string; lastName: string; title: string; subjectGroups: string; rows: {day:Day,period:number,subject:string,room:string,classLevel:string}[] }>();
  for (let i=1;i<lines.length;i++) {
    // CSV ง่ายๆ รองรับ "a,b" ในเครื่องหมายคำพูด
    // fallback แยกด้วย ,
    const parts = lines[i].split(",").map(s=>s.trim().replace(/^"|"$/g,""));
    // ใช้ parts ถ้า header ตรงจำนวน
    const get = (name:string) => {
      const p = idx(name);
      return (parts[p] ?? "").trim().replace(/^"|"$/g,"");
    };
    const firstName = get("ชื่อ");
    const lastName = get("นามสกุล");
    if (!firstName || !lastName) continue;
    const day = get("วัน").toUpperCase();
    if (!DAYS.has(day)) { console.warn(`แถว ${i+1} วันผิด ${day} ข้าม`); continue; }
    const period = Number(get("คาบ"));
    if (!Number.isFinite(period) || period<1 || period>8) { console.warn(`แถว ${i+1} คาบผิด`); continue; }
    const subject = get("วิชา");
    if (!subject || subject==="ว่าง") continue;
    const key = `${firstName} ${lastName}`;
    if (!byTeacher.has(key)) byTeacher.set(key, { firstName, lastName, title: get("คำนำหน้า") || "ครู", subjectGroups: get("กลุ่มวิชา"), rows: [] });
    const entry = byTeacher.get(key)!;
    if (get("กลุ่มวิชา")) entry.subjectGroups = get("กลุ่มวิชา");
    entry.rows.push({ day: day as Day, period, subject, room: get("ห้อง"), classLevel: get("ชั้น") });
  }

  for (const [key, data] of byTeacher) {
    const teacher = await db.query.teachers.findFirst({ where: eq(teachers.firstName, data.firstName) });
    let found = teacher && teacher.lastName===data.lastName ? teacher : null;
    if (!found) {
      const sg = data.subjectGroups ? JSON.stringify(data.subjectGroups.split(",").map(s=>s.trim()).filter(Boolean)) : "[]";
      const [row] = await db.insert(teachers).values({ firstName: data.firstName, lastName: data.lastName, title: data.title, subjectGroups: sg, maxPeriodsPerDay: 4 }).returning();
      found = row;
      console.log(`+ สร้างครู ${key} id=${found.id}`);
    } else {
      if (data.subjectGroups) await db.update(teachers).set({ subjectGroups: JSON.stringify(data.subjectGroups.split(",").map(s=>s.trim()).filter(Boolean)) }).where(eq(teachers.id, found.id));
      console.log(`~ ครูเดิม ${key} id=${found.id} อัปเดต`);
    }
    await db.delete(schedules).where(eq(schedules.teacherId, found.id));
    if (data.rows.length) await db.insert(schedules).values(data.rows.map(r=>({ teacherId: found.id, day:r.day, period:r.period, subject:r.subject, room:r.room, classLevel:r.classLevel })));
    console.log(`  -> ${data.rows.length} คาบ`);
  }
  console.log("Import CSV เสร็จ");
}
main().catch(e=>{ console.error(e); process.exit(1); });
