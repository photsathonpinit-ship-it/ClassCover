import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { teachers } from "@/lib/db/schema";
import { LEAVE_TYPES } from "@/lib/db/schema";
import { createLeave } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewLeavePage({ searchParams }: PageProps<"/leaves/new">) {
  const sp = await searchParams;
  const err = typeof sp?.error === "string" ? sp.error : "";
  const teacherRows = await db.select().from(teachers).orderBy(asc(teachers.lastName));

  return (
    <div className="px-4 sm:px-6 md:p-8 py-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">บันทึกการลา / ไปราชการ</h1>
        <Link href="/leaves" className="text-sm text-blue-600 hover:underline">← กลับรายการ</Link>
      </div>

      {err === "date" && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-4">วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่ม</div>}
      {err === "overlap" && <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-md text-sm mb-4">ครูคนนี้มีการลาในช่วงวันดังกล่าวแล้ว — กรุณาเลือกช่วงอื่น</div>}
      {err === "missing" && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-4">กรุณาเลือกครูและวันที่เริ่ม</div>}

      <form action={createLeave} className="bg-white rounded-lg shadow-sm p-4 sm:p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">ครู</label>
          <select name="teacherId" required className="w-full border rounded-md px-3 h-11 text-sm bg-white">
            <option value="">เลือกครู...</option>
            {teacherRows.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} {t.firstName} {t.lastName}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">วันที่เริ่มลา</label>
            <input name="startDate" type="date" required className="w-full border rounded-md px-3 h-11 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">วันสิ้นสุด (ถ้าไม่กรอก = 1 วัน)</label>
            <input name="endDate" type="date" className="w-full border rounded-md px-3 h-11 text-sm" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">ประเภท</label>
          <select name="leaveType" className="w-full border rounded-md px-3 h-11 text-sm bg-white">
            {LEAVE_TYPES.map((lt) => (
              <option key={lt} value={lt}>{lt}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">เหตุผล / หมายเหตุ</label>
          <textarea name="reason" rows={3} className="w-full border rounded-md px-3 py-2 text-sm" placeholder="เช่น ป่วย / ไปประชุม..." />
        </div>

        <p className="text-xs text-slate-500 bg-slate-50 rounded-md p-3">
          หลังบันทึก ระบบจะแสดงคาบที่ครูไม่สามารถสอนได้และแนะนำครูที่ว่างมาสอนแทน
        </p>

        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-5 h-11 rounded-md text-sm font-medium">
            บันทึกการลา
          </button>
          <Link href="/leaves" className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 h-11 rounded-md text-sm font-medium inline-flex items-center justify-center">
            ยกเลิก
          </Link>
        </div>
      </form>
    </div>
  );
}
