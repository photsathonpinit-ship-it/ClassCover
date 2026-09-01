"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { subAssignments } from "@/lib/db/schema";

export async function updateAssignmentStatus(formData: FormData) {
  const id = Number(formData.get("id"));
  const status = String(formData.get("status"));
  if (!Number.isFinite(id) || id <= 0 || !["pending", "assigned", "completed"].includes(status)) return;
  await db
    .update(subAssignments)
    .set({ status: status as "pending" | "assigned" | "completed" })
    .where(eq(subAssignments.id, id));
  revalidatePath("/assignments");
  revalidatePath("/");
}

export async function deleteAssignment(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id) || id <= 0) return;
  await db.delete(subAssignments).where(eq(subAssignments.id, id));
  revalidatePath("/assignments");
  revalidatePath("/");
}
