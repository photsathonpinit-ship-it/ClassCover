import Link from "next/link";
import { db } from "@/lib/db";
import { teachers, schedules } from "@/lib/db/schema";
import { DAYS, type Day } from "@/lib/db/schema";
import { DAY_LABELS } from "@/lib/dates";

export const dynamic = "force-dynamic";

const PERIODS = Array.from({ length: 8 }, (_, i) => i + 1);

export default async function MasterSchedulePage() {
  const teacherRows = await db.select().from(teachers);
  const scheduleRows = await db.select().from(schedules);

  // map: teacherId -> day -> periods ที่มีคาบ
  const byTeacher: Record<number, Record<string, number[]>> = {};
  for (const s of scheduleRows) {
    if (!byTeacher[s.teacherId]) byTeacher[s.teacherId] = {};
    if (!byTeacher[s.teacherId][s.day]) byTeacher[s.teacherId][s.day] = [];
    byTeacher[s.teacherId][s.day].push(s.period);
  }
  for (const t of teacherRows) {
    if (!byTeacher[t.id]) byTeacher[t.id] = {};
  }

  const days: Day[] = [...DAYS];

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">ตารางสอนประจำสัปดาห์</h1>
          <p className="text-sm text-slate-500 mt-1">
            ภาพรวมว่าครูแต่ละคนว่างคาบไหนบ้าง (สีเขียว = ว่าง สีเทา = มีคาบสอน) — คลิกชื่อเพื่อแก้ตารางรายคน
          </p>
        </div>
        <Link href="/teachers" className="shrink-0 bg-white border hover:bg-slate-50 px-4 py-2 rounded-md text-sm">
          จัดการครู
        </Link>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {days.map((day) => (
          <div key={day} className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="font-semibold text-sm mb-3 text-slate-700">{DAY_LABELS[day]}</h3>
            <div className="space-y-2">
              {teacherRows.map((t) => {
                const busyPeriods = new Set(byTeacher[t.id][day] || []);
                const freeAllDay = busyPeriods.size === 0;
                return (
                  <div key={t.id} className="text-xs">
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/teachers/${t.id}/schedule`}
                        className="text-slate-700 hover:text-blue-600 hover:underline truncate"
                      >
                        {t.firstName} {t.lastName}
                      </Link>
                      {freeAllDay && (
                        <span className="text-emerald-600 font-medium text-[10px] shrink-0 ml-1">ว่างทั้งวัน</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {PERIODS.map((p) => (
                        <span
                          key={p}
                          className={`inline-block w-5 h-5 rounded text-center text-[10px] leading-5 ${
                            busyPeriods.has(p)
                              ? "bg-slate-200 text-slate-400"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
