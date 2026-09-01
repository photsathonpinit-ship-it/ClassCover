import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { db } from "@/lib/db";
import { subAssignments, teachers as teachersTable } from "@/lib/db/schema";
import { DAY_LABELS } from "@/lib/dates";
import { deleteAssignment, updateAssignmentStatus } from "./actions";
import { ExportCsvButton, PrintButton } from "./assignment-row-actions";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  assigned: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
};
const STATUS_LABELS: Record<string, string> = {
  pending: "รอจัด",
  assigned: "จัดแล้ว",
  completed: "เสร็จสิ้น",
};

export default async function AssignmentsPage({ searchParams }: PageProps<"/assignments">) {
  const sp = await searchParams;
  const statusFilter = typeof sp?.status === "string" ? sp.status : "";
  const dateFilter = typeof sp?.date === "string" ? sp.date : "";
  const teacherFilter = typeof sp?.teacherId === "string" ? Number(sp.teacherId) : 0;

  const absentAlias = alias(teachersTable, "absent");
  const substituteAlias = alias(teachersTable, "substitute");

  const rows = await db
    .select({
      a: subAssignments,
      absent: absentAlias,
      substitute: substituteAlias,
    })
    .from(subAssignments)
    .innerJoin(absentAlias, eq(absentAlias.id, subAssignments.absentTeacherId))
    .leftJoin(substituteAlias, eq(substituteAlias.id, subAssignments.substituteTeacherId))
    .orderBy(desc(subAssignments.date));

  const teachersList = await db.select().from(teachersTable).orderBy(teachersTable.firstName);

  let filtered = rows;
  if (statusFilter) filtered = filtered.filter((r) => r.a.status === statusFilter);
  if (dateFilter) filtered = filtered.filter((r) => r.a.date === dateFilter);
  if (teacherFilter) filtered = filtered.filter((r) => r.a.substituteTeacherId === teacherFilter || r.a.absentTeacherId === teacherFilter);

  // สำหรับส่งออก CSV (escape)
  const csvRows = filtered.map(({ a, absent, substitute }) => {
    const sub = substitute as typeof substitute | null;
    return [
      a.date,
      DAY_LABELS[a.day] ?? a.day,
      String(a.period),
      a.subject + (a.classLevel ? ` ${a.classLevel}` : "") + (a.room ? ` (${a.room})` : ""),
      `${absent.title} ${absent.firstName} ${absent.lastName}`,
      sub ? `${sub.title} ${sub.firstName} ${sub.lastName}` : "",
      STATUS_LABELS[a.status] ?? a.status,
    ];
  });

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 md:mb-8">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 font-medium">ประกาศ · พิมพ์หน้าเสาธง</div>
          <h1 className="text-3xl md:text-4xl tracking-tighter leading-none font-bold text-zinc-900 mt-2">รายการจัดสอนแทน</h1>
          <p className="text-sm text-zinc-600 leading-relaxed max-w-[65ch] mt-2">คาบที่จัดให้ครูแทนในวันต่าง ๆ — กรอง พิมพ์ ส่งออก CSV ได้</p>
        </div>
        <PrintButton />
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center gap-2.5 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          {["", "pending", "assigned", "completed"].map((s) => {
            const params = new URLSearchParams();
            if (s) params.set("status", s);
            if (dateFilter) params.set("date", dateFilter);
            if (teacherFilter) params.set("teacherId", String(teacherFilter));
            const href = params.toString() ? `/assignments?${params.toString()}` : "/assignments";
            return (
              <Link
                key={s || "all"}
                href={href}
                className={`h-9 px-3 rounded-md text-sm inline-flex items-center ${
                  (statusFilter || "") === s
                    ? "bg-blue-600 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-100 border"
                }`}
              >
                {s === "" ? "ทั้งหมด" : STATUS_LABELS[s]}
              </Link>
            );
          })}
        </div>
        <div className="hidden lg:block w-px h-6 bg-slate-200" />
        <form className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
          {teacherFilter ? <input type="hidden" name="teacherId" value={String(teacherFilter)} /> : null}
          <input
            type="date"
            name="date"
            defaultValue={dateFilter}
            className="border rounded-md px-2 h-9 text-sm bg-white"
          />
          <button className="bg-white border hover:bg-slate-50 px-3 h-9 rounded-md text-sm text-zinc-800 shrink-0">กรองวันที่</button>
          {dateFilter && (
            <Link href="/assignments" className="text-sm text-slate-500 hover:text-slate-700 inline-flex items-center h-9">
              ล้าง
            </Link>
          )}
        </form>
        <form className="flex items-stretch sm:items-center gap-2">
          {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
          {dateFilter && <input type="hidden" name="date" value={dateFilter} />}
          <select name="teacherId" defaultValue={teacherFilter ? String(teacherFilter) : ""} className="border rounded-md px-2 h-9 text-sm bg-white min-w-0">
            <option value="">ครูทั้งหมด</option>
            {teachersList.map((t) => (
              <option key={t.id} value={String(t.id)}>
                {t.title} {t.firstName} {t.lastName}
              </option>
            ))}
          </select>
          <button className="bg-white border hover:bg-slate-50 px-3 h-9 rounded-md text-sm text-zinc-800 shrink-0">กรองครู</button>
        </form>
        <div className="sm:ml-auto">
          <ExportCsvButton rows={csvRows} />
        </div>
      </div>

      {/* มือถือ: รายการแบบการ์ด */}
      <div className="md:hidden divide-y divide-zinc-100 bg-white border border-zinc-200 rounded-[14px] overflow-hidden">
        {filtered.map(({ a, absent, substitute }) => {
          const sub = substitute as typeof substitute | null;
          return (
            <div key={a.id} className="px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-zinc-900">
                  {DAY_LABELS[a.day]} · คาบ {a.period}
                </div>
                <span className={`inline-block text-[11px] px-2 py-0.5 rounded shrink-0 ${STATUS_STYLES[a.status] || ""}`}>
                  {STATUS_LABELS[a.status] || a.status}
                </span>
              </div>
              <div className="mt-0.5 text-xs text-zinc-500">{a.date}</div>
              <div className="mt-2 text-sm text-zinc-700">
                {a.subject}
                {a.classLevel && <span className="text-zinc-500"> · {a.classLevel}</span>}
                {a.room && <span className="text-zinc-400 text-xs"> · {a.room}</span>}
              </div>
              <div className="mt-2 text-xs text-zinc-600 flex items-center gap-1">
                <span className="text-zinc-400">ลา:</span> {absent.title} {absent.firstName} {absent.lastName}
              </div>
              <div className="mt-1 text-xs text-zinc-600 flex items-center gap-1">
                <span className="text-zinc-400">แทน:</span>{" "}
                {sub ? `${sub.title} ${sub.firstName} ${sub.lastName}` : <span className="text-amber-600 font-medium">ยังไม่จัด</span>}
              </div>
              <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center gap-2">
                {a.status !== "completed" && (
                  <form action={updateAssignmentStatus}>
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="status" value="completed" />
                    <button className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 h-9 rounded-full">
                      เสร็จสิ้น
                    </button>
                  </form>
                )}
                {a.status === "completed" && (
                  <form action={updateAssignmentStatus}>
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="status" value="assigned" />
                    <button className="text-xs bg-amber-500 hover:bg-amber-600 text-white px-3 h-9 rounded-full">
                      ยกเลิกเสร็จสิ้น
                    </button>
                  </form>
                )}
                <form action={deleteAssignment}>
                  <input type="hidden" name="id" value={a.id} />
                  <button className="text-xs bg-white border hover:bg-red-50 text-red-600 px-3 h-9 rounded-full">
                    ลบ
                  </button>
                </form>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="px-5 py-12 text-center text-sm text-slate-400">
            ไม่พบรายการจัดสอนแทน — ไปที่ <Link href="/leaves" className="text-blue-600 hover:underline">การลา</Link> แล้วกด “จัดแทนอัตโนมัติ”
          </div>
        )}
      </div>

      <div className="hidden md:block bg-white border border-zinc-200 rounded-[14px] overflow-hidden print:shadow-none print:border">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50/80">
            <tr className="text-left text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
              <th className="px-5 py-3">วัน/คาบ</th>
              <th className="px-5 py-3">วิชา</th>
              <th className="px-5 py-3">ครูที่ลา</th>
              <th className="px-5 py-3">ครูสอนแทน</th>
              <th className="px-5 py-3">สถานะ</th>
              <th className="px-5 py-3 print:hidden">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filtered.map(({ a, absent, substitute }) => {
              const sub = substitute as typeof substitute | null;
              return (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-medium">{DAY_LABELS[a.day]}</span>
                    <span className="text-slate-500"> {a.date}</span>
                    <span className="text-slate-400"> · คาบ {a.period}</span>
                  </td>
                  <td className="px-4 py-3">
                    {a.subject}
                    {a.classLevel && <span className="text-slate-500"> · {a.classLevel}</span>}
                    {a.room && <span className="text-slate-400 text-xs"> · {a.room}</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {absent.title} {absent.firstName} {absent.lastName}
                  </td>
                  <td className="px-4 py-3">
                    {sub ? (
                      <span className="text-slate-700">{sub.title} {sub.firstName} {sub.lastName}</span>
                    ) : (
                      <span className="text-slate-300">ยังไม่จัด</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded ${STATUS_STYLES[a.status] || ""}`}>
                      {STATUS_LABELS[a.status] || a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 print:hidden">
                    <div className="flex items-center gap-1">
                      {a.status !== "completed" && (
                        <form action={updateAssignmentStatus}>
                          <input type="hidden" name="id" value={a.id} />
                          <input type="hidden" name="status" value="completed" />
                          <button className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded">
                            เสร็จสิ้น
                          </button>
                        </form>
                      )}
                      {a.status === "completed" && (
                        <form action={updateAssignmentStatus}>
                          <input type="hidden" name="id" value={a.id} />
                          <input type="hidden" name="status" value="assigned" />
                          <button className="text-xs bg-amber-500 hover:bg-amber-600 text-white px-2 py-1 rounded">
                            ยกเลิกเสร็จสิ้น
                          </button>
                        </form>
                      )}
                      <form action={deleteAssignment}>
                        <input type="hidden" name="id" value={a.id} />
                        <button className="text-xs bg-white border hover:bg-red-50 text-red-600 px-2 py-1 rounded">
                          ลบ
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  ไม่พบรายการจัดสอนแทน — ไปที่ <Link href="/leaves" className="text-blue-600 hover:underline">การลา</Link> แล้วกด “จัดแทนอัตโนมัติ”
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
