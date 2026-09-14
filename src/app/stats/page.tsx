import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { leaveRequests, teachers as teachersTable } from "@/lib/db/schema";
import { getSchoolName } from "@/lib/school";
import { getTeacherName } from "@/lib/teacher-name";
import { parseISO, format } from "@/lib/dates";
import { ExportCsvButton } from "@/app/assignments/assignment-row-actions";
import { StatsImageButton } from "@/components/export-image";

export const dynamic = "force-dynamic";

const LEAVE_TYPES = ["ลาเรียน", "ลาป่วย", "ลากิจ", "ไปราชการ", "อื่นๆ"] as const;

function daysInclusive(start: string, end: string): number {
  try {
    const s = parseISO(start);
    const e = parseISO(end);
    const diff = Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 1;
  } catch {
    return 1;
  }
}

export default async function StatsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const sp = await searchParams;
  const from = typeof sp?.from === "string" && sp.from ? sp.from : "";
  const to = typeof sp?.to === "string" && sp.to ? sp.to : "";

  const [leaves, teachersList] = await Promise.all([
    db.select().from(leaveRequests).orderBy(asc(leaveRequests.startDate)),
    db.select().from(teachersTable).orderBy(asc(teachersTable.firstName)),
  ]);

  const schoolName = await getSchoolName().catch(() => "โรงเรียน");

  // ฟิลเตอร์ตามช่วงวันที่ (นับใบลาที่ซ้อนทับช่วง)
  let filtered = leaves;
  if (from) filtered = filtered.filter((l) => l.endDate >= from);
  if (to) filtered = filtered.filter((l) => l.startDate <= to);

  const totalTimes = filtered.length;
  const totalDays = filtered.reduce((sum, l) => sum + daysInclusive(l.startDate, l.endDate), 0);

  const statusCounts = {
    pending: filtered.filter((l) => l.status === "pending").length,
    approved: filtered.filter((l) => l.status === "approved").length,
    rejected: filtered.filter((l) => l.status === "rejected").length,
  };

  const byType = LEAVE_TYPES.map((t) => {
    const rows = filtered.filter((l) => l.leaveType === t);
    return { type: t, count: rows.length, days: rows.reduce((s, l) => s + daysInclusive(l.startDate, l.endDate), 0) };
  });

  const teacherMap = new Map<number, { teacher: typeof teachersList[number] | null; count: number; days: number; byType: Record<string, number> }>();
  for (const l of filtered) {
    const t = teachersList.find((x) => x.id === l.teacherId) ?? null;
    const cur = teacherMap.get(l.teacherId) ?? { teacher: t, count: 0, days: 0, byType: {} as Record<string, number> };
    cur.count += 1;
    cur.days += daysInclusive(l.startDate, l.endDate);
    cur.byType[l.leaveType] = (cur.byType[l.leaveType] ?? 0) + 1;
    if (!cur.teacher && t) cur.teacher = t;
    teacherMap.set(l.teacherId, cur);
  }
  const perTeacher = [...teacherMap.values()]
    .map((v) => ({
      name: v.teacher ? getTeacherName(v.teacher) : `ครู #${[...teacherMap.keys()].find((k) => teacherMap.get(k) === v)}`,
      count: v.count,
      days: v.days,
      byType: v.byType,
      teacher: v.teacher,
    }))
    .sort((a, b) => b.days - a.days || b.count - a.count);

  // สำหรับ CSV
  const csvRows = perTeacher.map((r) => [
    r.name,
    String(r.count),
    String(r.days),
    ...LEAVE_TYPES.map((t) => String(r.byType[t] ?? 0)),
    String(r.teacher?.phone ?? ""),
  ]);

  // สำหรับรูปภาพ
  const imgAssignments = perTeacher.slice(0, 20).map((r) => ({
    teacherName: r.name,
    count: r.count,
    days: r.days,
  }));

  const periodLabel = from || to ? `${from || "—"} ถึง ${to || "—"}` : "ทั้งหมด";

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 font-medium">รายงาน · สถิติการลา</div>
          <h1 className="text-3xl md:text-4xl tracking-tighter leading-none font-bold text-zinc-900 mt-2">สถิติการลา</h1>
          <p className="text-sm text-zinc-600 leading-relaxed max-w-[65ch] mt-2">สรุปจำนวนครั้งและจำนวนวันลา แบ่งตามประเภทและรายบุคคล — กรองตามช่วงแล้วดาวน์โหลดเป็นไฟล์สรุปได้</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatsImageButton
            schoolName={schoolName}
            periodLabel={periodLabel}
            totalTimes={totalTimes}
            totalDays={totalDays}
            byType={byType}
            perTeacher={perTeacher.slice(0, 30)}
          />
          <ExportCsvButton
            rows={[
              ["โรงเรียน", schoolName],
              ["ช่วง", periodLabel],
              [],
              ["ครู", "จำนวนครั้ง", "จำนวนวัน", ...LEAVE_TYPES, "เบอร์โทร"],
              ...csvRows,
              [],
              ["สรุปตามประเภท"],
              ["ประเภท", "ครั้ง", "วัน"],
              ...byType.map((r) => [r.type, String(r.count), String(r.days)]),
              [],
              ["รวมทั้งหมด", String(totalTimes), String(totalDays)],
            ]}
          />
        </div>
      </div>

      {/* ฟิลเตอร์ช่วงวันที่ */}
      <form className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2 mb-6 bg-white border border-zinc-200 rounded-[14px] p-4">
        <div className="flex-1">
          <label className="block text-xs font-medium text-zinc-600 mb-1">จากวันที่</label>
          <input type="date" name="from" defaultValue={from} className="w-full border rounded-md px-3 h-9 text-sm bg-white" />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-zinc-600 mb-1">ถึงวันที่</label>
          <input type="date" name="to" defaultValue={to} className="w-full border rounded-md px-3 h-9 text-sm bg-white" />
        </div>
        <button className="bg-zinc-900 hover:bg-black text-white px-5 h-9 rounded-full text-sm font-medium shrink-0">กรอง</button>
        {(from || to) && (
          <Link href="/stats" className="text-sm text-zinc-500 hover:text-zinc-700 px-3 h-9 inline-flex items-center">
            ล้าง
          </Link>
        )}
      </form>

      {/* การ์ดสรุปรวม */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-zinc-500 font-medium">จำนวนครั้งทั้งหมด</div>
          <div className="text-3xl font-bold tracking-tighter text-zinc-900 mt-2">{totalTimes}</div>
          <div className="text-xs text-zinc-500 mt-1">ใบลา</div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-zinc-500 font-medium">จำนวนวันรวม</div>
          <div className="text-3xl font-bold tracking-tighter text-zinc-900 mt-2">{totalDays}</div>
          <div className="text-xs text-zinc-500 mt-1">วัน (นับรวมวันลา)</div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-zinc-500 font-medium">อนุมัติแล้ว</div>
          <div className="text-3xl font-bold tracking-tighter text-emerald-600 mt-2">{statusCounts.approved}</div>
          <div className="text-xs text-zinc-500 mt-1">รออนุมัติ {statusCounts.pending} · ไม่อนุมัติ {statusCounts.rejected}</div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-zinc-500 font-medium">ช่วงที่ดู</div>
          <div className="text-sm font-semibold text-zinc-900 mt-2 truncate">{periodLabel}</div>
          <div className="text-xs text-zinc-500 mt-1">ครูที่มีการลา {perTeacher.length} คน</div>
        </div>
      </div>

      {/* แบ่งตามประเภท */}
      <div className="bg-white border border-zinc-200 rounded-[14px] overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-zinc-900">แบ่งตามประเภทการลา</h2>
          <span className="text-xs text-zinc-500">{totalTimes} ครั้ง · {totalDays} วัน</span>
        </div>
        <div className="divide-y divide-zinc-100">
          <div className="hidden md:grid grid-cols-[1fr_100px_100px_1fr] gap-2 px-5 py-2 bg-zinc-50 text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
            <span>ประเภท</span>
            <span className="text-center">ครั้ง</span>
            <span className="text-center">วัน</span>
            <span>สัดส่วน</span>
          </div>
          {byType.map((r) => {
            const pct = totalTimes > 0 ? Math.round((r.count / totalTimes) * 100) : 0;
            return (
              <div key={r.type} className="grid grid-cols-2 md:grid-cols-[1fr_100px_100px_1fr] gap-2 px-5 py-3 items-center">
                <span className="text-sm font-medium text-zinc-800">{r.type}</span>
                <span className="text-sm font-bold text-zinc-900 text-center">{r.count}</span>
                <span className="text-sm font-bold text-zinc-900 text-center">{r.days}</span>
                <span className="hidden md:flex items-center gap-2">
                  <span className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <span className="block h-full bg-zinc-900 rounded-full" style={{ width: `${pct}%` }} />
                  </span>
                  <span className="text-xs text-zinc-500 w-8 text-right">{pct}%</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* รายบุคคล */}
      <div className="bg-white border border-zinc-200 rounded-[14px] overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-200">
          <h2 className="text-sm font-bold text-zinc-900">รายบุคคล — จำนวนครั้งและวัน</h2>
          <p className="text-xs text-zinc-500 mt-1">เรียงมากไปน้อยตามจำนวนวัน</p>
        </div>

        {/* มือถือ: การ์ด */}
        <div className="md:hidden divide-y divide-zinc-100">
          {perTeacher.map((r) => (
            <div key={r.name} className="px-4 py-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-zinc-900">{r.name}</div>
                <div className="text-xs text-zinc-500 mt-0.5">
                  {LEAVE_TYPES.map((t) => (r.byType[t] ? `${t} ${r.byType[t]}ครั้ง` : null))
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-bold text-zinc-900">{r.count} ครั้ง</div>
                <div className="text-xs font-medium text-zinc-700">{r.days} วัน</div>
              </div>
            </div>
          ))}
          {perTeacher.length === 0 && <div className="px-5 py-10 text-center text-sm text-zinc-400">ยังไม่มีข้อมูลการลาในช่วงนี้</div>}
        </div>

        {/* เดสก์ท็อป: ตาราง */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50">
              <tr className="text-left text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
                <th className="px-5 py-3">ครู</th>
                <th className="px-3 py-3 text-center">ครั้ง</th>
                <th className="px-3 py-3 text-center">วัน</th>
                {LEAVE_TYPES.map((t) => (
                  <th key={t} className="px-3 py-3 text-center">
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {perTeacher.map((r) => (
                <tr key={r.name} className="hover:bg-zinc-50">
                  <td className="px-5 py-3 font-medium text-zinc-900">{r.name}</td>
                  <td className="px-3 py-3 text-center font-bold">{r.count}</td>
                  <td className="px-3 py-3 text-center font-bold">{r.days}</td>
                  {LEAVE_TYPES.map((t) => (
                    <td key={t} className="px-3 py-3 text-center text-zinc-700">
                      {r.byType[t] ?? 0}
                    </td>
                  ))}
                </tr>
              ))}
              {perTeacher.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-zinc-400">
                    ยังไม่มีข้อมูลการลา
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
