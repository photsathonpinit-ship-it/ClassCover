import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { leaveRequests, subAssignments, teachers } from "@/lib/db/schema";
import { getTeacherName } from "@/lib/teacher-name";
import { LeaveStatusBadge } from "../leave-status";
import { previewLeaveSlots } from "./actions";
import { LeaveStatusForm } from "./leave-status-form";
import { AssignmentForm } from "./assignment-form";

export const dynamic = "force-dynamic";

export default async function LeaveDetailPage({ params }: PageProps<"/leaves/[id]">) {
  const { id } = await params;
  const idNum = Number(id);
  if (!Number.isFinite(idNum) || idNum <= 0) notFound();
  const leave = await db.query.leaveRequests.findFirst({ where: eq(leaveRequests.id, idNum) });
  if (!leave) notFound();

  const absentTeacher = await db.query.teachers.findFirst({ where: eq(teachers.id, leave.teacherId) });
  const preview = await previewLeaveSlots(idNum);

  const savedAssignments = await db
    .select({ a: subAssignments, teacher: teachers })
    .from(subAssignments)
    .leftJoin(teachers, eq(teachers.id, subAssignments.substituteTeacherId))
    .where(eq(subAssignments.leaveRequestId, idNum));

  return (
    <div className="px-4 sm:px-6 md:p-8 py-6">
      <div className="mb-6">
        <Link href="/leaves" className="text-sm text-blue-600 hover:underline">← กลับรายการลา</Link>
        <h1 className="text-2xl font-bold mt-1">รายละเอียดการลา</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-xs text-slate-500 mb-1">ครูที่ลา</div>
          <div className="font-medium">{absentTeacher ? getTeacherName(absentTeacher) : "-"}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-xs text-slate-500 mb-1">ช่วงวัน</div>
          <div className="font-medium">{leave.startDate}{leave.startDate !== leave.endDate && <> → {leave.endDate}</>}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-xs text-slate-500 mb-1">ประเภท / สถานะ</div>
          <div className="font-medium flex items-center gap-2">
            {leave.leaveType}
            <LeaveStatusBadge status={leave.status} />
          </div>
        </div>
      </div>

      {leave.reason && (
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="text-xs text-slate-500 mb-1">เหตุผล</div>
          <div className="text-sm">{leave.reason}</div>
        </div>
      )}

      <div className="mb-4 flex gap-3">
        <LeaveStatusForm leaveId={leave.id} currentStatus={leave.status} />
      </div>

      {/* คาบที่ขาด + ระบบจัดแทน */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold mb-1">การจัดสอนแทน</h2>
            <p className="text-sm text-slate-500">
              ระบบพบคาบสอนที่ขาด {preview.length} คาบ โดยแนะนำครูที่ว่าง (เลือกครูที่ต้องการได้จาก dropdown)
            </p>
          </div>
          {savedAssignments.length > 0 && (
            <Link href="/assignments" className="shrink-0 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-md text-sm">
              ดูรายการจัดแทนทั้งหมด →
            </Link>
          )}
        </div>

        <AssignmentForm
          leaveId={leave.id}
          slots={preview}
          saved={savedAssignments.map(({ a, teacher }) => ({
            date: a.date,
            period: a.period,
            substituteName: teacher ? getTeacherName(teacher) : null,
            substituteId: a.substituteTeacherId,
          }))}
        />
      </div>
    </div>
  );
}
