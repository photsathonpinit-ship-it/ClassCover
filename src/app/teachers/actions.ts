"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { teachers } from "@/lib/db/schema";

export async function createTeacher(formData: FormData) {
  const firstName = String(formData.get("firstName") || "").trim();
  const lastName = String(formData.get("lastName") || "").trim();
  const title = String(formData.get("title") || "ครู").trim();
  const phone = String(formData.get("phone") || "").trim() || null;
  const email = String(formData.get("email") || "").trim() || null;
  let maxPeriodsPerDay = Number(formData.get("maxPeriodsPerDay") || 4);
  if (!Number.isFinite(maxPeriodsPerDay) || maxPeriodsPerDay < 1) maxPeriodsPerDay = 4;
  if (maxPeriodsPerDay > 8) maxPeriodsPerDay = 8;
  const subjectGroupsRaw = String(formData.get("subjectGroups") || "");

  if (!firstName || !lastName) {
    redirect("/teachers/new?error=missing");
  }

  const subjectGroups = JSON.stringify(
    subjectGroupsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );

  const [row] = await db
    .insert(teachers)
    .values({
      firstName,
      lastName,
      title,
      phone,
      email,
      maxPeriodsPerDay,
      subjectGroups,
    })
    .returning({ id: teachers.id });

  revalidatePath("/teachers");
  redirect(`/teachers/${row.id}/schedule`);
}

export async function updateTeacher(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id) || id <= 0) redirect("/teachers?error=invalid");
  const firstName = String(formData.get("firstName") || "").trim();
  const lastName = String(formData.get("lastName") || "").trim();
  const title = String(formData.get("title") || "ครู").trim();
  const phone = String(formData.get("phone") || "").trim() || null;
  const email = String(formData.get("email") || "").trim() || null;
  let maxPeriodsPerDay = Number(formData.get("maxPeriodsPerDay") || 4);
  if (!Number.isFinite(maxPeriodsPerDay) || maxPeriodsPerDay < 1) maxPeriodsPerDay = 4;
  if (maxPeriodsPerDay > 8) maxPeriodsPerDay = 8;
  const subjectGroupsRaw = String(formData.get("subjectGroups") || "");

  if (!firstName || !lastName) {
    redirect(`/teachers/${id}/edit?error=missing`);
  }

  const subjectGroups = JSON.stringify(
    subjectGroupsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );

  await db
    .update(teachers)
    .set({
      firstName,
      lastName,
      title,
      phone,
      email,
      maxPeriodsPerDay,
      subjectGroups,
    })
    .where(eq(teachers.id, id));

  revalidatePath("/teachers");
  redirect("/teachers");
}

export async function deleteTeacher(id: number) {
  await db.delete(teachers).where(eq(teachers.id, id));
  revalidatePath("/teachers");
}
