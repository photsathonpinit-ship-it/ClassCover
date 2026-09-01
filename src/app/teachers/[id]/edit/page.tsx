import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { teachers } from "@/lib/db/schema";
import { updateTeacher } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditTeacherPage({ params, searchParams }: PageProps<"/teachers/[id]/edit">) {
  const { id: idStr } = await params;
  const sp = await searchParams;
  const err = typeof sp?.error === "string" ? sp.error : "";
  const id = Number(idStr);
  if (!Number.isFinite(id) || id <= 0) notFound();
  const teacher = await db.query.teachers.findFirst({ where: eq(teachers.id, id) });
  if (!teacher) notFound();

  let groups: string[] = [];
  try {
    groups = JSON.parse(teacher.subjectGroups || "[]");
  } catch {
    groups = [];
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">แก้ไขครู</h1>
        <Link href="/teachers" className="text-sm text-blue-600 hover:underline">
          ← กลับรายการ
        </Link>
      </div>

      {err === "missing" && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-4">
          กรุณากรอกชื่อและนามสกุลให้ครบ
        </div>
      )}

      <form action={updateTeacher} className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <input type="hidden" name="id" value={teacher.id} />
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ตำแหน่ง</label>
            <input name="title" defaultValue={teacher.title} className="w-full border rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อ</label>
            <input name="firstName" required defaultValue={teacher.firstName} className="w-full border rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">นามสกุล</label>
            <input name="lastName" required defaultValue={teacher.lastName} className="w-full border rounded-md px-3 py-2 text-sm" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">วิชาที่สอนได้</label>
          <input name="subjectGroups" defaultValue={groups.join(", ")} className="w-full border rounded-md px-3 py-2 text-sm" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">เบอร์โทร</label>
            <input name="phone" defaultValue={teacher.phone ?? ""} className="w-full border rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">อีเมล</label>
            <input name="email" defaultValue={teacher.email ?? ""} className="w-full border rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">คาบสูงสุด/วัน</label>
            <input name="maxPeriodsPerDay" type="number" defaultValue={teacher.maxPeriodsPerDay} className="w-full border rounded-md px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md text-sm font-medium">
            บันทึก
          </button>
          <Link href="/teachers" className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2 rounded-md text-sm font-medium">
            ยกเลิก
          </Link>
        </div>
      </form>
    </div>
  );
}
