import { DAYS, type Day } from "@/lib/db/schema";
import { DAY_LABELS } from "@/lib/dates";
import Link from "next/link";
import { saveTeacherSchedule } from "@/app/schedule/actions";

const PERIODS = Array.from({ length: 8 }, (_, i) => i + 1);

interface Cell {
  subject: string;
  room: string;
  classLevel: string;
}

export function ScheduleEditor({ teacherId, grid }: { teacherId: number; grid: Record<string, Cell> }) {
  const dayCols: Day[] = [...DAYS];

  return (
    <form action={saveTeacherSchedule} className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
      <input type="hidden" name="teacherId" value={teacherId} />
      <p className="text-sm text-slate-500 mb-4">
        กรอกวิชาที่สอนในแต่ละคาบ (ว่างไว้ถ้าไม่มีคาบ) ขนาดตารางใหญ่สามารถเลื่อนดูด้านข้างได้
      </p>

      <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className="border border-slate-200 bg-slate-50 px-2 py-2 text-xs font-semibold text-slate-500 w-16">
                คาบ
              </th>
              {dayCols.map((d) => (
                <th key={d} className="border border-slate-200 bg-slate-50 px-2 py-2 text-sm font-semibold text-slate-700 w-44">
                  {DAY_LABELS[d]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map((period) => (
              <tr key={period}>
                <td className="border border-slate-200 px-2 py-1 text-center text-sm font-medium text-slate-600">
                  {period}
                </td>
                {dayCols.map((day) => {
                  const cell = grid[`${day}-${period}`];
                  return (
                    <td key={day} className="border border-slate-200 px-1 py-1 align-top space-y-1">
                      <input
                        name={`${day}-${period}-subject`}
                        defaultValue={cell?.subject ?? ""}
                        placeholder="วิชา"
                        className="w-full border rounded px-2 py-1 text-sm"
                      />
                      <div className="flex gap-1">
                        <input
                          name={`${day}-${period}-room`}
                          defaultValue={cell?.room ?? ""}
                          placeholder="ห้อง"
                          className="w-1/2 border rounded px-2 py-1 text-xs"
                        />
                        <input
                          name={`${day}-${period}-class`}
                          defaultValue={cell?.classLevel ?? ""}
                          placeholder="ชั้น/ห้อง"
                          className="w-1/2 border rounded px-2 py-1 text-xs"
                        />
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col-reverse sm:flex-row gap-3">
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 h-11 rounded-md text-sm font-medium"
        >
          บันทึกตารางสอน
        </button>
        <Link
          href="/teachers"
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 h-11 rounded-md text-sm font-medium inline-flex items-center justify-center"
        >
          ยกเลิก
        </Link>
      </div>
    </form>
  );
}
