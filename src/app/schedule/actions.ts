"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { schedules } from "@/lib/db/schema";
import type { Day } from "@/lib/db/schema";

// บันทึกตารางสอนปกติของครู (แทนทั้งชุดที่ส่งมา)
export async function saveTeacherSchedule(formData: FormData) {
  const teacherId = Number(formData.get("teacherId"));
  if (!teacherId) return;

  // ลบตารางเดิมของครูคนนี้
  await db.delete(schedules).where(eq(schedules.teacherId, teacherId));

  const days: Day[] = ["MON", "TUE", "WED", "THU", "FRI"];
  const values: { teacherId: number; day: Day; period: number; subject: string; room: string; classLevel: string }[] = [];

  for (const day of days) {
    for (let period = 1; period <= 8; period++) {
      const subject = String(formData.get(`${day}-${period}-subject`) || "").trim();
      if (!subject) continue;
      const room = String(formData.get(`${day}-${period}-room`) || "").trim();
      const classLevel = String(formData.get(`${day}-${period}-class`) || "").trim();
      values.push({ teacherId, day, period, subject, room, classLevel });
    }
  }

  if (values.length > 0) {
    await db.insert(schedules).values(values);
  }

  revalidatePath(`/teachers/${teacherId}/schedule`);
  revalidatePath("/schedule");
  revalidatePath("/teachers");
}
