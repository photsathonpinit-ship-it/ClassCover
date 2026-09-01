"use client";

import { useTransition } from "react";
import { updateLeaveStatus } from "../actions";

export function LeaveStatusForm({ leaveId, currentStatus }: { leaveId: number; currentStatus: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {currentStatus !== "approved" && (
        <button
          disabled={pending}
          onClick={() => startTransition(async () => {
            const fd = new FormData();
            fd.set("id", String(leaveId));
            fd.set("status", "approved");
            await updateLeaveStatus(fd);
          })}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 h-11 rounded-md text-sm font-medium disabled:opacity-50"
        >
          อนุมัติการลา
        </button>
      )}
      {currentStatus !== "rejected" && (
        <button
          disabled={pending}
          onClick={() => startTransition(async () => {
            const fd = new FormData();
            fd.set("id", String(leaveId));
            fd.set("status", "rejected");
            await updateLeaveStatus(fd);
          })}
          className="bg-red-100 hover:bg-red-200 text-red-700 px-4 h-11 rounded-md text-sm font-medium disabled:opacity-50"
        >
          ไม่อนุมัติ
        </button>
      )}
    </div>
  );
}
