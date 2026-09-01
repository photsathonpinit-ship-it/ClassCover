import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { leaveRequests, teachers } from "@/lib/db/schema";
import { LeaveStatusBadge } from "./leave-status";

export const dynamic = "force-dynamic";

const LEAVE_TYPE_COLORS: Record<string, string> = {
  "ลาเรียน": "bg-indigo-100 text-indigo-700",
  "ลาป่วย": "bg-red-100 text-red-700",
  "ลากิจ": "bg-amber-100 text-amber-700",
  "ไปราชการ": "bg-sky-100 text-sky-700",
  "อื่นๆ": "bg-slate-100 text-slate-600",
};

export default async function LeavesPage() {
  const rows = await db
    .select({
      leave: leaveRequests,
      teacher: teachers,
    })
    .from(leaveRequests)
    .innerJoin(teachers, eq(teachers.id, leaveRequests.teacherId))
    .orderBy(desc(leaveRequests.startDate));

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-8 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 font-medium">การลา · ติดตามสถานะ</div>
          <h1 className="text-4xl tracking-tighter leading-none font-bold text-zinc-900 mt-2">การลา / ไปราชการ</h1>
          <p className="text-sm text-zinc-600 leading-relaxed max-w-[65ch] mt-2">บันทึกการลาและติดตามการจัดสอนแทน — กดดู/จัดแทนเพื่อแนะนำครูว่างตามวิชาตรงและภาระน้อย</p>
        </div>
        <Link
          href="/leaves/new"
          className="bg-zinc-900 hover:bg-zinc-800 text-white px-5 py-2 rounded-full text-sm font-medium transition-colors"
        >
          + บันทึกการลา
        </Link>
      </div>

      <div className="bg-white border border-zinc-200 rounded-[14px] overflow-hidden">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50/80">
            <tr className="text-left text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
              <th className="px-5 py-3">ครู</th>
              <th className="px-5 py-3">ประเภท</th>
              <th className="px-5 py-3">ช่วงวัน</th>
              <th className="px-5 py-3">เหตุผล</th>
              <th className="px-5 py-3">สถานะ</th>
              <th className="px-5 py-3 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map(({ leave, teacher }) => (
              <tr key={leave.id} className="hover:bg-zinc-50/60">
                <td className="px-5 py-3.5">
                  <div className="text-sm font-medium text-zinc-900">{teacher.title} {teacher.firstName} {teacher.lastName}</div>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-block text-xs px-2 py-1 rounded-full border ${LEAVE_TYPE_COLORS[leave.leaveType] || LEAVE_TYPE_COLORS["อื่นๆ"]} border-zinc-200`}>
                    {leave.leaveType}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-sm text-zinc-600">
                  {leave.startDate}
                  {leave.startDate !== leave.endDate && <> → {leave.endDate}</>}
                </td>
                <td className="px-5 py-3.5 text-sm text-zinc-500 max-w-xs truncate">{leave.reason ?? "—"}</td>
                <td className="px-5 py-3.5"><LeaveStatusBadge status={leave.status} /></td>
                <td className="px-5 py-3.5 text-right">
                  <Link href={`/leaves/${leave.id}`} className="text-sm text-zinc-700 hover:text-zinc-900 border border-zinc-200 hover:bg-zinc-50 px-3 py-1.5 rounded-full">
                    ดู/จัดแทน
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-sm text-zinc-500">
                  ยังไม่มีบันทึกการลา — กด “บันทึกการลา” เพื่อเริ่ม
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
