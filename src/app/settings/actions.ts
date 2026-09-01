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
