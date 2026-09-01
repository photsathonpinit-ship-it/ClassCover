import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { db } from "@/lib/db";
import { teachers as teachersTable, leaveRequests, subAssignments } from "@/lib/db/schema";
import { getTeacherName } from "@/lib/teacher-name";
import { DAY_LABELS } from "@/lib/dates";
import { getSchoolName } from "@/lib/school";

export const dynamic = "force-dynamic";

export default async function Home() {
  let teacherCount: { count: number } | undefined;
  let pendingLeaveCount: { count: number } | undefined;
  let assignedCount: { count: number } | undefined;
  let unassignedCount: { count: number } | undefined;
  let pendingLeaves: any[] = [];
  let recentAssignments: any[] = [];
  try {
    [teacherCount] = await db.select({ count: sql<number>`count(*)` }).from(teachersTable);
    [pendingLeaveCount] = await db.select({ count: sql<number>`count(*)` }).from(leaveRequests).where(eq(leaveRequests.status, "pending"));
    [assignedCount] = await db.select({ count: sql<number>`count(*)` }).from(subAssignments).where(eq(subAssignments.status, "assigned"));
    [unassignedCount] = await db.select({ count: sql<number>`count(*)` }).from(subAssignments).where(eq(subAssignments.status, "pending"));
    pendingLeaves = await db.select({ leave: leaveRequests, teacher: teachersTable }).from(leaveRequests).innerJoin(teachersTable, eq(teachersTable.id, leaveRequests.teacherId)).where(eq(leaveRequests.status, "pending")).orderBy(desc(leaveRequests.startDate)).limit(5);
    const absentAlias = alias(teachersTable, "absent");
    const substituteAlias = alias(teachersTable, "substitute");
    recentAssignments = await db.select({ a: subAssignments, absent: absentAlias, substitute: substituteAlias }).from(subAssignments).innerJoin(absentAlias, eq(absentAlias.id, subAssignments.absentTeacherId)).leftJoin(substituteAlias, eq(substituteAlias.id, subAssignments.substituteTeacherId)).orderBy(desc(subAssignments.date)).limit(5);
  } catch (e) {
    console.error("DB not ready on Vercel yet:", e);
  }

  let weeklyRows: any[] = [];
  let teacherMap = new Map();
  let workload: any[] = [];
  let schoolName = "โรงเรียนประถม";
  const today = new Date();
  const dow = today.getDay(); // 0=อา
  const mon = new Date(today);
  mon.setDate(today.getDate() - ((dow + 6) % 7));
  const fri = new Date(mon);
  fri.setDate(mon.getDate() + 4);
  const monStr = mon.toISOString().slice(0, 10);
  const friStr = fri.toISOString().slice(0, 10);

  try {
    weeklyRows = await db
      .select({ sid: subAssignments.substituteTeacherId, cnt: sql<number>`count(*)` })
      .from(subAssignments)
      .where(sql`${subAssignments.date} >= ${monStr} AND ${subAssignments.date} <= ${friStr} AND ${subAssignments.substituteTeacherId} IS NOT NULL`)
      .groupBy(subAssignments.substituteTeacherId);
    teacherMap = new Map((await db.select().from(teachersTable)).map((t) => [t.id, t]));
    schoolName = await getSchoolName();
  } catch (e) {
    console.error("DB not ready on Vercel yet:", e);
  }
  workload = weeklyRows
    .map((r) => ({ teacher: teacherMap.get(r.sid as number), count: r.cnt }))
    .filter((x) => x.teacher)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const stats = [
    { label: "ครูทั้งหมด", value: teacherCount?.count ?? 0, href: "/teachers", bg: "bg-sky-300", border: "border-sky-400", text: "text-sky-950", icon: "👩‍🏫", sub: "พร้อมสอน" },
    { label: "การลาที่รออนุมัติ", value: pendingLeaveCount?.count ?? 0, href: "/leaves", bg: "bg-amber-300", border: "border-amber-400", text: "text-amber-950", icon: "📋", sub: "ต้องจัด" },
    { label: "คาบที่จัดแทนแล้ว", value: assignedCount?.count ?? 0, href: "/assignments", bg: "bg-emerald-300", border: "border-emerald-400", text: "text-emerald-950", icon: "✨", sub: "เสร็จแล้ว" },
    { label: "คาบที่ยังไม่จัด", value: unassignedCount?.count ?? 0, href: "/assignments?status=pending", bg: "bg-pink-300", border: "border-pink-400", text: "text-pink-950", icon: "🎈", sub: "รอจัด" },
  ];

  const dbNotReady = !teacherCount && pendingLeaves.length === 0 && recentAssignments.length === 0;
  const _banner = dbNotReady && (
    <div className="mb-8 border border-amber-300 bg-amber-50 text-amber-900 rounded-xl px-5 py-4 text-sm">
      ยังไม่ได้เชื่อมฐานข้อมูลบนเว็บ (Vercel) — กรุณาไปที่ <span className="font-semibold">Storage → Create Database → Postgres</span> แล้วกด <span className="font-semibold">Redeploy</span> เพื่อให้ข้อมูลครูแสดงผล
    </div>
  );

  // modern — Linear-style minimal, trust-first
  return (
    <div className="max-w-[1280px] mx-auto px-6 md:px-8 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 font-medium">{schoolName} · ภาคเรียนที่ 1/2569</div>
          <h1 className="text-4xl md:text-[42px] tracking-tighter leading-none font-semibold text-zinc-900 mt-2">แดชบอร์ด</h1>
          <p className="text-base text-zinc-600 leading-relaxed max-w-[65ch] mt-3">ภาพรวมประจำวันสำหรับฝ่ายวิชาการ — การลาที่ต้องจัด ภาระสัปดาห์นี้ และรายการล่าสุด</p>
        </div>
        <div className="text-xs font-mono text-zinc-500 border border-zinc-200 rounded-full px-4 py-2 bg-white">
          {monStr} → {friStr} · 27 ครู
        </div>
      </div>

      {_banner}

      {pendingLeaves.length > 0 && (
        <div className="border border-zinc-200 bg-white rounded-xl px-5 py-4 mb-8 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm leading-relaxed max-w-[65ch] text-zinc-700">
            <span className="font-medium text-zinc-900">มีการลา {pendingLeaves.length} รายการรออนุมัติ</span>
            <span className="text-zinc-500"> — จัดสอนแทนได้ทันที</span>
          </div>
          <Link href={pendingLeaves[0] ? `/leaves/${pendingLeaves[0].leave.id}` : "/leaves"} className="bg-zinc-900 hover:bg-black text-white px-5 py-2 rounded-full text-sm font-medium transition-colors shrink-0">
            จัดเลย →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="bg-white border border-zinc-200 rounded-xl p-5 hover:border-zinc-300 hover:bg-zinc-50/50 transition-colors">
            <div className="text-xs uppercase tracking-[0.14em] text-zinc-500 font-medium">{s.label}</div>
            <div className="text-3xl font-semibold tracking-tighter text-zinc-900 mt-2">{s.value}</div>
            <div className="text-sm text-zinc-500 mt-1">{s.sub}</div>
          </Link>
        ))}
      </div>

      {workload.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 mb-8">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-sm font-semibold tracking-tight text-zinc-900">ภาระสอนแทนสัปดาห์นี้</h2>
            <span className="text-xs font-mono text-zinc-500">{monStr} → {friStr}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
            {workload.map(({ teacher, count }) => (
              <div key={teacher!.id} className="border border-zinc-200 rounded-lg p-4 bg-zinc-50">
                <div className="text-sm font-medium text-zinc-900">{getTeacherName(teacher!)}</div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-semibold tracking-tight text-zinc-900">{count}</span>
                  <span className="text-xs text-zinc-500">คาบที่รับแทน</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-zinc-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold tracking-tight text-zinc-900">การลาที่ต้องจัดการ</h2>
            <Link href="/leaves" className="text-xs text-zinc-600 hover:text-zinc-900 border border-zinc-200 rounded-full px-3 py-1.5 hover:bg-zinc-50">ทั้งหมด →</Link>
          </div>
          {pendingLeaves.length === 0 ? (
            <p className="text-sm text-zinc-500 border border-dashed border-zinc-200 rounded-lg px-4 py-8 text-center">ไม่มีรายการค้าง</p>
          ) : (
            <ul className="divide-y divide-zinc-100 border border-zinc-200 rounded-lg overflow-hidden">
              {pendingLeaves.map(({ leave, teacher }) => (
                <li key={leave.id}>
                  <Link href={`/leaves/${leave.id}`} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-zinc-50 transition-colors">
                    <div>
                      <div className="text-sm font-medium text-zinc-900">{getTeacherName(teacher)}</div>
                      <div className="text-xs text-zinc-500">{leave.startDate}{leave.startDate !== leave.endDate && <> → {leave.endDate}</>} · {leave.leaveType}</div>
                    </div>
                    <span className="text-xs border border-amber-200 bg-amber-50 text-amber-800 px-2 py-1 rounded-full shrink-0">รออนุมัติ</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold tracking-tight text-zinc-900">รายการจัดสอนแทนล่าสุด</h2>
            <Link href="/assignments" className="text-xs text-zinc-600 hover:text-zinc-900 border border-zinc-200 rounded-full px-3 py-1.5 hover:bg-zinc-50">ทั้งหมด →</Link>
          </div>
          {recentAssignments.length === 0 ? (
            <p className="text-sm text-zinc-500 border border-dashed border-zinc-200 rounded-lg px-4 py-8 text-center">ยังไม่มีรายการจัดแทน</p>
          ) : (
            <ul className="divide-y divide-zinc-100 border border-zinc-200 rounded-lg overflow-hidden">
              {recentAssignments.map(({ a, absent, substitute }) => (
                <li key={a.id} className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-zinc-50/50">
                  <div>
                    <div className="text-sm font-medium text-zinc-900">{DAY_LABELS[a.day]} {a.date} · คาบ {a.period} · {a.subject}</div>
                    <div className="text-xs text-zinc-500">{absent.firstName} {absent.lastName}{substitute && <> → {substitute.firstName} {substitute.lastName}</>}</div>
                  </div>
                  <span className="text-[11px] uppercase tracking-[0.14em] text-zinc-500 border border-zinc-200 px-2 py-1 rounded-full bg-white">{a.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
