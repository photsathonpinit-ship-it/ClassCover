import { db } from "../src/lib/db";
import {
  teachers,
  schedules,
  leaveRequests,
  subAssignments,
  type Day,
} from "../src/lib/db/schema";

async function main() {
  console.log("Seeding...");

  // ล้างข้อมูลเดิม
  await db.delete(subAssignments);
  await db.delete(leaveRequests);
  await db.delete(schedules);
  await db.delete(teachers);

  const teacherRows = await db
    .insert(teachers)
    .values([
      { firstName: "สมชาย", lastName: "ใจดี", title: "ครูชำนาญการ", subjectGroups: '["คณิตศาสตร์","ฟิสิกส์"]', phone: "081-111-1111", maxPeriodsPerDay: 4 },
      { firstName: "สมหญิง", lastName: "รักเรียน", title: "ครู", subjectGroups: '["ภาษาไทย","สังคมศึกษา"]', phone: "081-222-2222", maxPeriodsPerDay: 4 },
      { firstName: "ประเสริฐ", lastName: "สุขสันต์", title: "ครูชำนาญการ", subjectGroups: '["ภาษาอังกฤษ"]', phone: "081-333-3333", maxPeriodsPerDay: 5 },
      { firstName: "มานี", lastName: "มีสุข", title: "ครู", subjectGroups: '["วิทยาศาสตร์","เคมี"]', phone: "081-444-4444", maxPeriodsPerDay: 4 },
      { firstName: "วิชัย", lastName: "กล้าหาญ", title: "ครูชำนาญการพิเศษ", subjectGroups: '["คอมพิวเตอร์","เทคโนโลยี"]', phone: "081-555-5555", maxPeriodsPerDay: 3 },
      { firstName: "ศิริพร", lastName: "งามเรือน", title: "ครู", subjectGroups: '["ศิลปะ","สุขศึกษา"]', phone: "081-666-6666", maxPeriodsPerDay: 4 },
      { firstName: "ณัฐพล", lastName: "ว่องไว", title: "ครูผู้ช่วย", subjectGroups: '["คณิตศาสตร์","ภาษาอังกฤษ"]', phone: "081-777-7777", maxPeriodsPerDay: 5 },
    ])
    .returning();

  const [c1, c2, c3, c4, c5, c6, c7] = teacherRows;

  // ตารางสอนปกติ (วันจันทร์ถึงศุกร์, คาบ 1-6)
  const scheduleRows: { teacherId: number; day: Day; period: number; subject: string; room: string; classLevel: string }[] = [];

  const t = (tId: number, day: Day, period: number, subject: string, room = "ห้องเรียน", classLevel = "") =>
    scheduleRows.push({ teacherId: tId, day, period, subject, room, classLevel });

  // ครูสมชาย — เรียนคณิต/ฟิสิกส์
  [1, 3, 5].forEach((p) => t(c1.id, "MON", p, "คณิตศาสตร์", "ห้อง 301", "ม.4/1"));
  [2, 4].forEach((p) => t(c1.id, "TUE", p, "ฟิสิกส์", "ห้อง 302", "ม.5/2"));
  [1, 6].forEach((p) => t(c1.id, "WED", p, "คณิตศาสตร์", "ห้อง 303", "ม.4/2"));
  [3, 5].forEach((p) => t(c1.id, "THU", p, "ฟิสิกส์", "ห้อง 302", "ม.6/1"));

  // ครูสมหญิง — ภาษาไทย/สังคม
  [2, 4].forEach((p) => t(c2.id, "MON", p, "ภาษาไทย", "ห้อง 101", "ม.1/1"));
  [1, 5].forEach((p) => t(c2.id, "TUE", p, "สังคมศึกษา", "ห้อง 102", "ม.2/2"));
  [3].forEach((p) => t(c2.id, "WED", p, "ภาษาไทย", "ห้อง 103", "ม.3/1"));
  [2, 6].forEach((p) => t(c2.id, "THU", p, "สังคมศึกษา", "ห้อง 101", "ม.1/2"));
  [1].forEach((p) => t(c2.id, "FRI", p, "ภาษาไทย", "ห้อง 102", "ม.2/1"));

  // ครูประเสริฐ — อังกฤษ
  [1, 4, 6].forEach((p) => t(c3.id, "MON", p, "ภาษาอังกฤษ", "ห้อง 401", "ม.4/1"));
  [2, 5].forEach((p) => t(c3.id, "TUE", p, "ภาษาอังกฤษ", "ห้อง 402", "ม.5/1"));
  [1, 3].forEach((p) => t(c3.id, "WED", p, "ภาษาอังกฤษ", "ห้อง 403", "ม.6/2"));
  [4].forEach((p) => t(c3.id, "THU", p, "ภาษาอังกฤษ", "ห้อง 401", "ม.4/2"));
  [2, 5].forEach((p) => t(c3.id, "FRI", p, "ภาษาอังกฤษ", "ห้อง 402", "ม.5/2"));

  // ครูมานี — วิทย์/เคมี
  [3, 5].forEach((p) => t(c4.id, "MON", p, "วิทยาศาสตร์", "ห้อง 201", "ม.1/2"));
  [1, 4].forEach((p) => t(c4.id, "TUE", p, "เคมี", "ห้อง 202", "ม.5/2"));
  [2, 6].forEach((p) => t(c4.id, "WED", p, "วิทยาศาสตร์", "ห้อง 203", "ม.3/2"));
  [1, 3].forEach((p) => t(c4.id, "THU", p, "เคมี", "ห้อง 201", "ม.6/1"));
  [4].forEach((p) => t(c4.id, "FRI", p, "วิทยาศาสตร์", "ห้อง 202", "ม.1/1"));

  // ครูวิชัย — คอม/เทคโนโลยี (มีชั่วโมงว่างเยอะ)
  [2].forEach((p) => t(c5.id, "MON", p, "คอมพิวเตอร์", "ห้องคอม 1", "ม.4/1"));
  [5].forEach((p) => t(c5.id, "WED", p, "เทคโนโลยี", "ห้องคอม 2", "ม.3/1"));
  [3].forEach((p) => t(c5.id, "THU", p, "คอมพิวเตอร์", "ห้องคอม 1", "ม.5/2"));

  // ครูศิริพร — ศิลปะ/สุขศึกษา
  [1, 6].forEach((p) => t(c6.id, "MON", p, "ศิลปะ", "ห้องศิลป์", "ม.2/1"));
  [3].forEach((p) => t(c6.id, "TUE", p, "สุขศึกษา", "สนามกีฬา", "ม.1/1"));
  [4].forEach((p) => t(c6.id, "WED", p, "ศิลปะ", "ห้องศิลป์", "ม.3/2"));
  [2].forEach((p) => t(c6.id, "THU", p, "สุขศึกษา", "สนามกีฬา", "ม.2/2"));
  [5].forEach((p) => t(c6.id, "FRI", p, "ศิลปะ", "ห้องศิลป์", "ม.4/1"));

  // ครูณัฐพล — คณิต/อังกฤษ (ครูใหม่ ยืดหยุ่นว่างเยอะ)
  [2, 4].forEach((p) => t(c7.id, "MON", p, "คณิตศาสตร์", "ห้อง 304", "ม.3/1"));
  [1, 3].forEach((p) => t(c7.id, "TUE", p, "ภาษาอังกฤษ", "ห้อง 404", "ม.2/2"));
  [5].forEach((p) => t(c7.id, "WED", p, "คณิตศาสตร์", "ห้อง 304", "ม.3/2"));
  [2, 6].forEach((p) => t(c7.id, "THU", p, "ภาษาอังกฤษ", "ห้อง 404", "ม.1/1"));
  [1, 3, 5].forEach((p) => t(c7.id, "FRI", p, "คณิตศาสตร์", "ห้อง 304", "ม.4/1"));

  await db.insert(schedules).values(scheduleRows);

  // ตัวอย่างการลา: ครูสมชาย ลา 2 วันหน้า
  const today = new Date();
  const nextMonday = new Date(today);
  // ถ้าวันนี้เป็นจันทร์ ก็ใช้พรุ่งนี้แทน
  if (nextMonday.getDay() === 1) {
    nextMonday.setDate(nextMonday.getDate() + 1);
  } else {
    // หาวันจันทร์ถัดไป
    let diff = (8 - nextMonday.getDay()) % 7;
    if (diff === 0) diff = 1;
    nextMonday.setDate(nextMonday.getDate() + diff);
  }
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  const mondayStr = fmt(nextMonday);
  const tuesday = new Date(nextMonday);
  tuesday.setDate(tuesday.getDate() + 1);
  const tuesdayStr = fmt(tuesday);

  await db.insert(leaveRequests).values({
    teacherId: c1.id,
    startDate: mondayStr,
    endDate: tuesdayStr,
    leaveType: "ไปราชการ",
    reason: "ประชุมตัวแทนเขตพื้นที่การศึกษา",
    status: "approved",
    note: "จัดแทนให้ครบทุกคาบ",
  });

  // ครูสมหญิง ลาป่วยวันศุกร์ (คาบ 1)
  const friday = new Date(nextMonday);
  const diffToFri = (5 - friday.getDay()) % 7;
  friday.setDate(friday.getDate() + diffToFri + 7); // ศุกร์ถัดไป
  await db.insert(leaveRequests).values({
    teacherId: c2.id,
    startDate: fmt(friday),
    endDate: fmt(friday),
    leaveType: "ลาป่วย",
    reason: "ปวดหัว ไข้",
    status: "pending",
  });

  console.log("Seed complete!");

  console.log("\n=== ข้อมูลครู ===");
  for (const t of teacherRows) {
    console.log(`  ${t.id}. ${t.title} ${t.firstName} ${t.lastName} (${t.subjectGroups})`);
  }
  console.log(`\nตัวอย่างการลา: ครู${c1.firstName} ${c1.lastName} ไปราชการ ${mondayStr} - ${tuesdayStr}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
