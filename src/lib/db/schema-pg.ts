import { pgTable, text, integer, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const DAYS = ["MON", "TUE", "WED", "THU", "FRI"] as const;
export type Day = (typeof DAYS)[number];

export const teachers = pgTable("teachers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  title: text("title").notNull().default("ครู"),
  subjectGroups: text("subject_groups").notNull().default("[]"),
  phone: text("phone"),
  email: text("email"),
  maxPeriodsPerDay: integer("max_periods_per_day").notNull().default(4),
});
export type Teacher = typeof teachers.$inferSelect;

export const schedules = pgTable(
  "schedules",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    teacherId: integer("teacher_id").notNull().references(() => teachers.id, { onDelete: "cascade" }),
    day: text("day").notNull().$type<Day>(),
    period: integer("period").notNull(),
    subject: text("subject").notNull(),
    room: text("room"),
    classLevel: text("class_level"),
  },
  (t) => [index("schedule_teacher_day").on(t.teacherId, t.day), index("schedule_day_period").on(t.day, t.period)]
);

export const LEAVE_TYPES = ["ลาเรียน", "ลาป่วย", "ลากิจ", "ไปราชการ", "อื่นๆ"] as const;
export type LeaveType = (typeof LEAVE_TYPES)[number];

export const leaveRequests = pgTable(
  "leave_requests",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    teacherId: integer("teacher_id").notNull().references(() => teachers.id, { onDelete: "cascade" }),
    startDate: text("start_date").notNull(),
    endDate: text("end_date").notNull(),
    leaveType: text("leave_type").notNull().$type<LeaveType>(),
    reason: text("reason"),
    status: text("status").notNull().default("pending").$type<"pending" | "approved" | "rejected">(),
    note: text("note"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [index("leave_teacher").on(t.teacherId), index("leave_dates").on(t.startDate, t.endDate)]
);

export const SUB_STATUS = ["pending", "assigned", "completed"] as const;

export const subAssignments = pgTable(
  "sub_assignments",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    leaveRequestId: integer("leave_request_id").notNull().references(() => leaveRequests.id, { onDelete: "cascade" }),
    absentTeacherId: integer("absent_teacher_id").notNull().references(() => teachers.id),
    substituteTeacherId: integer("substitute_teacher_id").references(() => teachers.id),
    date: text("date").notNull(),
    day: text("day").notNull().$type<Day>(),
    period: integer("period").notNull(),
    subject: text("subject").notNull(),
    room: text("room"),
    classLevel: text("class_level"),
    status: text("status").notNull().default("pending").$type<"pending" | "assigned" | "completed">(),
    score: integer("score"),
    note: text("note"),
  },
  (t) => [index("sub_absence").on(t.leaveRequestId), index("sub_date").on(t.date), index("sub_substitute").on(t.substituteTeacherId)]
);

export const schoolSettings = pgTable("school_settings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  schoolName: text("school_name").notNull().default("โรงเรียนประถม"),
  lineChannelToken: text("line_channel_token"),
  lineGroupId: text("line_group_id"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
