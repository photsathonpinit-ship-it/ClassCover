import * as sqlite from "./schema-sqlite";
import * as pg from "./schema-pg";

const isPg = !!process.env.POSTGRES_URL || !!process.env.DATABASE_URL?.startsWith("postgres");

// Re-export ให้โค้ดอื่น import จาก "./schema" ได้เหมือนเดิม ไม่ว่าจะใช้ sqlite หรือ postgres
export const DAYS = sqlite.DAYS;
export type Day = sqlite.Day;
export const LEAVE_TYPES = sqlite.LEAVE_TYPES;
export type LeaveType = sqlite.LeaveType;
export const ROLES = sqlite.ROLES;
export type Role = sqlite.Role;
export const SUB_STATUS = sqlite.SUB_STATUS;

export const teachers = (isPg ? pg.teachers : sqlite.teachers) as typeof sqlite.teachers;
export const schedules = (isPg ? pg.schedules : sqlite.schedules) as typeof sqlite.schedules;
export const leaveRequests = (isPg ? pg.leaveRequests : sqlite.leaveRequests) as typeof sqlite.leaveRequests;
export const subAssignments = (isPg ? pg.subAssignments : sqlite.subAssignments) as typeof sqlite.subAssignments;
export const schoolSettings = (isPg ? pg.schoolSettings : sqlite.schoolSettings) as typeof sqlite.schoolSettings;

export type Teacher = typeof teachers.$inferSelect;
export type Schedule = typeof schedules.$inferSelect;
export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type SubAssignment = typeof subAssignments.$inferSelect;
export type SchoolSettings = typeof schoolSettings.$inferSelect;
