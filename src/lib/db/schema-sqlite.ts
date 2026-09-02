import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const DAYS = ["MON", "TUE", "WED", "THU", "FRI"] as const;
export type Day = (typeof DAYS)[number];

export const teachers = sqliteTable("teachers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  title: text("title").notNull().default("ครู"), // ตำแหน่ง เช่น ครู/ครูชำนาญการ
  subjectGroups: text("subject_groups").notNull().default("[]"), // JSON array ของวิชาที่สอนได้
  phone: text("phone"),
  email: text("email"),
  maxPeriodsPerDay: integer("max_periods_per_day").notNull().default(4),
});
export type Teacher = typeof teachers.$inferSelect;
export type NewTeacher = typeof teachers.$inferInsert;

// ตารางสอนประจำของครู (รายสัปดาห์)
export const schedules = sqliteTable(
  "schedules",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    teacherId: integer("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    day: text("day").notNull().$type<Day>(),
    period: integer("period").notNull(), // คาบที่ (1,2,3,...)
    subject: text("subject").notNull(),
    room: text("room"),
    classLevel: text("class_level"), // ห้อง/ชั้นที่สอน เช่น ม.4/1
  },
  (t) => [
    index("schedule_teacher_day").on(t.teacherId, t.day),
    index("schedule_day_period").on(t.day, t.period),
  ]
);
export type Schedule = typeof schedules.$inferSelect;

// ประเภทการลา
export const LEAVE_TYPES = ["ลาเรียน", "ลาป่วย", "ลากิจ", "ไปราชการ", "อื่นๆ"] as const;
export type LeaveType = (typeof LEAVE_TYPES)[number];

export const ROLES = ["ผู้จัดสอนแทน", "ครู"] as const;
export type Role = (typeof ROLES)[number];

export const leaveRequests = sqliteTable(
  "leave_requests",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    teacherId: integer("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    startDate: text("start_date").notNull(), // YYYY-MM-DD
    endDate: text("end_date").notNull(),
    leaveType: text("leave_type").notNull().$type<LeaveType>(),
    reason: text("reason"),
    status: text("status").notNull().default("pending").$type<
      "pending" | "approved" | "rejected"
    >(),
    note: text("note"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [index("leave_teacher").on(t.teacherId), index("leave_dates").on(t.startDate, t.endDate)]
);
export type LeaveRequest = typeof leaveRequests.$inferSelect;

// สถานะการจัดสอนแทน
export const SUB_STATUS = ["pending", "assigned", "completed"] as const;

// งานสอนแทน (หนึ่งรายการ = หนึ่งคาบของวันหนึ่ง)
export const subAssignments = sqliteTable(
  "sub_assignments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    leaveRequestId: integer("leave_request_id")
      .notNull()
      .references(() => leaveRequests.id, { onDelete: "cascade" }),
    absentTeacherId: integer("absent_teacher_id")
      .notNull()
      .references(() => teachers.id),
    substituteTeacherId: integer("substitute_teacher_id").references(() => teachers.id),
    date: text("date").notNull(), // YYYY-MM-DD
    day: text("day").notNull().$type<Day>(),
    period: integer("period").notNull(),
    subject: text("subject").notNull(),
    room: text("room"),
    classLevel: text("class_level"),
    status: text("status").notNull().default("pending").$type<
      "pending" | "assigned" | "completed"
    >(),
    score: integer("score"), // คะแนนความเหมาะสมตอนจัดอัตโนมัติ
    note: text("note"),
  },
  (t) => [
    index("sub_absence").on(t.leaveRequestId),
    index("sub_date").on(t.date),
    index("sub_substitute").on(t.substituteTeacherId),
  ]
);
export type SubAssignment = typeof subAssignments.$inferSelect;

// ตั้งค่าโรงเรียน (เก็บชื่อโรงเรียนที่กรอกเองได้ + LINE กลุ่ม)
export const schoolSettings = sqliteTable("school_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  schoolName: text("school_name").notNull().default("โรงเรียนประถม"),
  lineChannelToken: text("line_channel_token"),
  lineGroupId: text("line_group_id"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
export type SchoolSettings = typeof schoolSettings.$inferSelect;
