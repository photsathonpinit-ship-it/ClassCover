import { db } from "./db";

export async function getSchoolName(): Promise<string> {
  try {
    const row = await db.query.schoolSettings.findFirst();
    return row?.schoolName?.trim() || "โรงเรียนประถม";
  } catch {
    return "โรงเรียนประถม";
  }
}
