import Link from "next/link";
import { db } from "@/lib/db";
import { teachers } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { TeacherActions } from "./teacher-actions";

export const dynamic = "force-dynamic";

export default async function TeachersPage({ searchParams }: PageProps<"/teachers">) {
  const sp = await searchParams;
  const q = typeof sp?.q === "string" ? sp.q.trim() : "";
  const rows = await db.select().from(teachers).orderBy(desc(teachers.id));
  const filtered = q
    ? rows.filter((t) => `${t.firstName} ${t.lastName} ${t.title} ${t.subjectGroups} ${t.phone ?? ""}`.includes(q))
    : rows;

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-8 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 font-medium">บุคลากร · 27 คนในระบบ</div>
          <h1 className="text-4xl tracking-tighter leading-none font-bold text-zinc-900 mt-2">จัดการครู</h1>
          <p className="text-sm text-zinc-600 leading-relaxed max-w-[65ch] mt-2">เพิ่ม แก้ไข ค้นหาตามชื่อ/วิชา — ข้อมูลนี้ใช้คำนวณครูว่างและการจัดแทน</p>
        </div>
        <div className="flex items-center gap-3">
          <form className="flex items-center gap-2">
            <input
              name="q"
              defaultValue={q}
              placeholder="ค้นหาชื่อ / วิชา / เบอร์..."
              className="bg-white border border-zinc-200 rounded-full px-4 py-2 text-sm w-56 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-300"
            />
            <button className="bg-white border border-zinc-200 hover:bg-zinc-50 px-4 py-2 rounded-full text-sm text-zinc-700">ค้นหา</button>
            {q && (
              <Link href="/teachers" className="text-sm text-zinc-500 hover:text-zinc-700">
                ล้าง
              </Link>
            )}
          </form>
          <Link
            href="/teachers/new"
            className="bg-zinc-900 hover:bg-zinc-800 text-white px-5 py-2 rounded-full text-sm font-medium shrink-0 transition-colors"
          >
            + เพิ่มครู
          </Link>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-[14px] overflow-hidden">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50/80">
            <tr className="text-left text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
              <th className="px-5 py-3">ชื่อ</th>
              <th className="px-5 py-3">วิชาที่สอนได้</th>
              <th className="px-5 py-3">เบอร์โทร</th>
              <th className="px-5 py-3">คาบ/วัน</th>
              <th className="px-5 py-3 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filtered.map((t) => {
              let groups: string[] = [];
              try {
                groups = JSON.parse(t.subjectGroups || "[]");
              } catch {
                groups = [];
              }
              return (
                <tr key={t.id} className="hover:bg-zinc-50/60">
                  <td className="px-5 py-3.5">
                    <div className="text-sm font-medium text-zinc-900">{t.title} {t.firstName} {t.lastName}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1.5">
                      {groups.map((g) => (
                        <span key={g} className="inline-block bg-zinc-100 text-zinc-700 border border-zinc-200 text-xs px-2 py-1 rounded-full">
                          {g}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-zinc-600">{t.phone ?? "—"}</td>
                  <td className="px-5 py-3.5 text-sm text-zinc-600">{t.maxPeriodsPerDay}</td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link href={`/teachers/${t.id}/schedule`} className="text-xs bg-white border border-zinc-200 hover:bg-zinc-50 px-3 py-1.5 rounded-full">
                        ตาราง
                      </Link>
                      <Link href={`/teachers/${t.id}/edit`} className="text-xs bg-white border border-zinc-200 hover:bg-zinc-50 px-3 py-1.5 rounded-full">
                        แก้ไข
                      </Link>
                      <TeacherActions id={t.id} />
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-sm text-zinc-500">
                  {q ? `ไม่พบครูที่ตรงกับ “${q}”` : "ยังไม่มีข้อมูลครู — เพิ่มครูคนแรกได้เลย"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
