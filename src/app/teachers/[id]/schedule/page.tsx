import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { teachers, schedules } from "@/lib/db/schema";
import { ScheduleEditor } from "./schedule-editor";

export const dynamic = "force-dynamic";

export default async function TeacherSchedulePage({ params }: PageProps<"/teachers/[id]/schedule">) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id) || id <= 0) notFound();
  const teacher = await db.query.teachers.findFirst({ where: eq(teachers.id, id) });
  if (!teacher) notFound();

  const rows = await db
    .select()
    .from(schedules)
    .where(eq(schedules.teacherId, id));

  // จัดกลุ่มเป็น map: `${day}-${period}` -> {subject, room, classLevel}
  const grid: Record<string, { subject: string; room: string; classLevel: string }> = {};
  for (const r of rows) {
    grid[`${r.day}-${r.period}`] = {
      subject: r.subject,
      room: r.room ?? "",
      classLevel: r.classLevel ?? "",
    };
  }

  return (
    <div className="px-4 sm:px-6 md:p-8 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          ตารางสอนของ {teacher.title} {teacher.firstName} {teacher.lastName}
        </h1>
        <Link href="/teachers" className="text-sm text-blue-600 hover:underline">
          ← กลับรายการครู
        </Link>
      </div>

      <ScheduleEditor teacherId={teacher.id} grid={grid} />
    </div>
  );
}
