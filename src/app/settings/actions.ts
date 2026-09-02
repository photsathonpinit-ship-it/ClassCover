"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { schoolSettings } from "@/lib/db/schema";

export async function updateSchoolName(formData: FormData) {
  const name = String(formData.get("schoolName") || "").trim();
  if (!name) redirect("/settings?error=missing");
  const existing = await db.query.schoolSettings.findFirst();
  if (existing) {
    await db.update(schoolSettings).set({ schoolName: name, updatedAt: new Date().toISOString() }).where(eq(schoolSettings.id, existing.id));
  } else {
    await db.insert(schoolSettings).values({ schoolName: name });
  }
  revalidatePath("/", "layout");
  redirect("/settings?saved=1");
}

export async function updateLineSettings(formData: FormData) {
  const token = String(formData.get("lineChannelToken") || "").trim();
  const groupId = String(formData.get("lineGroupId") || "").trim();
  // อนุญาตให้ล้างค่าได้ — ส่งค่าว่างมาจะลบออก
  const existing = await db.query.schoolSettings.findFirst();
  const patch: Record<string, unknown> = {
    lineChannelToken: token || null,
    lineGroupId: groupId || null,
    updatedAt: new Date().toISOString(),
  };
  if (existing) {
    await db.update(schoolSettings).set(patch).where(eq(schoolSettings.id, existing.id));
  } else {
    await db.insert(schoolSettings).values({
      schoolName: "โรงเรียนประถม",
      lineChannelToken: token || null,
      lineGroupId: groupId || null,
    });
  }
  revalidatePath("/", "layout");
  // อยู่หน้าเดิมพร้อมแจ้งบันทึก
  redirect("/settings?saved=1#line");
}
