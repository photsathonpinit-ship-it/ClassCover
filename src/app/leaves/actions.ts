"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { leaveRequests, type LeaveType } from "@/lib/db/schema";

export async function createLeave(formData: FormData) {
  const teacherId = Number(formData.get("teacherId"));
  const startDate = String(formData.get("startDate") || "");
  const endDate = String(formData.get("endDate") || "") || startDate;
  const leaveType = String(formData.get("leaveType") || "ลาเรียน") as LeaveType;
  const reason = String(formData.get("reason") || "").trim() || null;

  if (!teacherId || !startDate) {
    redirect("/leaves/new?error=missing");
  }
  if (endDate < startDate) {
    redirect("/leaves/new?error=date");
  }

  // ตรวจลาในช่วงเดียวกันซ้ำ (ทับซ้อน)
  const overlapping = await db.query.leaveRequests.findMany({
    where: (t, { eq, and, sql }) =>
      and(
        eq(t.teacherId, teacherId),
        sql`${t.startDate} <= ${endDate} AND ${t.endDate} >= ${startDate}`
      ),
  });
  if (overlapping.length > 0) {
    redirect("/leaves/new?error=overlap");
  }

  const [row] = await db
    .insert(leaveRequests)
    .values({ teacherId, startDate, endDate, leaveType, reason })
    .returning({ id: leaveRequests.id });

  revalidatePath("/leaves");
  revalidatePath("/");
  redirect(`/leaves/${row.id}`);
}

export async function updateLeaveStatus(formData: FormData) {
  const id = Number(formData.get("id"));
  const status = String(formData.get("status"));
  if (!id || !["pending", "approved", "rejected"].includes(status)) return;

  await db
    .update(leaveRequests)
    .set({ status: status as "pending" | "approved" | "rejected" })
    .where(eq(leaveRequests.id, id));
  revalidatePath("/leaves");
  revalidatePath(`/leaves/${id}`);
}

export async function deleteLeave(id: number) {
  await db.delete(leaveRequests).where(eq(leaveRequests.id, id));
  revalidatePath("/leaves");
}
