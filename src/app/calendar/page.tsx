import Link from "next/link";
import { eq } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { db } from "@/lib/db";
import { leaveRequests, subAssignments, teachers as teachersTable } from "@/lib/db/schema";
import { addDays, format, parseISO, DAY_LABELS } from "@/lib/dates";
import { getTeacherName } from "@/lib/teacher-name";

export const dynamic = "force-dynamic";

const DAYS_ORDER = ["MON", "TUE", "WED", "THU", "FRI"] as const;

function mondayOf(dateStr: string): Date {
  const d = parseISO(dateStr);
  if (Number.isNaN(d.getTime())) return mondayOf(format(new Date()));
  const jsDow = d.getDay(); // 0=อา
  const diff = (jsDow + 6) % 7; // จันทร์ = 0
  return addDays(d, -diff);
}

function isValidDateStr(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = parseISO(s);
  return !Number.isNaN(d.getTime());
}

export default async function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  const sp = await searchParams;
  const weekParam = typeof sp?.week === "string" ? sp.week : "";
  const baseStr = isValidDateStr(weekParam) ? weekParam : format(new Date());
  const mon = mondayOf(baseStr);
  const days = Array.from({ length: 5 }, (_, i) => addDays(mon, i));
  const dayStrs = days.map(format);

  const absentAlias = alias(teachersTable, "absent");
  const subAlias = alias(teachersTable, "substitute");

  // การลาในช่วงสัปดาห์
  const leaves = await db
    .select({ leave: leaveRequests, teacher: teachersTable })
    .from(leaveRequests)
    .innerJoin(teachersTable, eq(teachersTable.id, leaveRequests.teacherId));

  // จัดแทนในช่วงสัปดาห์
  const assignments = await db
    .select({ a: subAssignments, absent: absentAlias, substitute: subAlias })
    .from(subAssignments)
    .innerJoin(absentAlias, eq(absentAlias.id, subAssignments.absentTeacherId))
    .leftJoin(subAlias, eq(subAlias.id, subAssignments.substituteTeacherId));

  const prevMon = format(addDays(mon, -7));
  const nextMon = format(addDays(mon, 7));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">ปฏิทินรายสัปดาห์</h1>
          <p className="text-sm text-slate-500 mt-1">
            สัปดาห์ {dayStrs[0]} → {dayStrs[4]} · ดูการลาและคาบที่จัดแทนแต่ละวัน
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/calendar?week=${prevMon}`} className="bg-white border hover:bg-slate-50 px-3 py-2 rounded-md text-sm">
            ← สัปดาห์ก่อน
          </Link>
          <Link href="/calendar" className="bg-white border hover:bg-slate-50 px-3 py-2 rounded-md text-sm">
            สัปดาห์นี้
          </Link>
          <Link href={`/calendar?week=${nextMon}`} className="bg-white border hover:bg-slate-50 px-3 py-2 rounded-md text-sm">
            สัปดาห์หน้า →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {days.map((d, idx) => {
          const ds = dayStrs[idx];
          const dayKey = DAYS_ORDER[idx];
          const dayName = DAY_LABELS[dayKey];
          const isToday = ds === format(new Date());

          const dayLeaves = leaves.filter(
            (r) => r.leave.startDate <= ds && ds <= r.leave.endDate
          );
          const dayAssigns = assignments.filter((r) => r.a.date === ds);

          return (
            <div
              key={ds}
              className={`bg-white rounded-lg shadow-sm p-3 flex flex-col min-h-[320px] ${isToday ? "ring-2 ring-blue-400" : ""}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`text-sm font-semibold ${isToday ? "text-blue-600" : "text-slate-700"}`}>{dayName}</div>
                <div className={`text-xs px-2 py-0.5 rounded ${isToday ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                  {ds.slice(5)}
                </div>
              </div>

              <div className="text-xs font-medium text-slate-500 mb-1">ลา/ราชการ ({dayLeaves.length})</div>
              <div className="space-y-1 mb-3">
                {dayLeaves.length === 0 ? (
                  <div className="text-xs text-slate-300">— ไม่มีการลา —</div>
                ) : (
                  dayLeaves.map(({ leave, teacher }) => (
                    <Link
                      key={leave.id}
                      href={`/leaves/${leave.id}`}
                      className="block border rounded px-2 py-1.5 hover:bg-amber-50 text-xs"
                    >
                      <div className="font-medium">{getTeacherName(teacher)}</div>
                      <div className="text-slate-500">{leave.leaveType}</div>
                    </Link>
                  ))
                )}
              </div>

              <div className="text-xs font-medium text-slate-500 mb-1">จัดสอนแทน ({dayAssigns.length} คาบ)</div>
              <div className="space-y-1 flex-1">
                {dayAssigns.length === 0 ? (
                  <div className="text-xs text-slate-300">— ไม่มี —</div>
                ) : (
                  dayAssigns
                    .sort((a, b) => a.a.period - b.a.period)
                    .map(({ a, absent, substitute }) => {
                      const sub = substitute as typeof substitute | null;
                      return (
                        <div
                          key={a.id}
                          className={`border rounded px-2 py-1 text-xs ${a.status === "completed" ? "bg-emerald-50 border-emerald-200" : a.status === "assigned" ? "bg-blue-50 border-blue-200" : "bg-amber-50 border-amber-200"}`}
                        >
                          <div className="font-medium">คาบ {a.period} · {a.subject}</div>
                          <div className="text-slate-600 truncate">
                            {absent.firstName} → {sub ? `${sub.firstName}` : "ยังไม่จัด"}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>

              <Link href={`/leaves/new`} className="mt-3 text-xs text-blue-600 hover:underline text-center">
                + บันทึกลาวันนี้
              </Link>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-100 border border-amber-200 inline-block" /> รอจัด</span>
        <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-100 border border-blue-200 inline-block" /> จัดแล้ว</span>
        <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200 inline-block" /> เสร็จสิ้น</span>
        <span className="ml-auto">เริ่มนับจันทร์-ศุกร์ · คลิกชื่อครูเพื่อดูรายละเอียดการลา</span>
      </div>
    </div>
  );
}
