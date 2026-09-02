"use client";

import { useState, useTransition } from "react";
import { notifyFilteredAssignments, notifyLeave } from "@/lib/line-actions";

export function LeaveLineButton({ leaveId }: { leaveId: number }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState<boolean | null>(null);

  return (
    <div className="inline-flex flex-col gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setMsg(null);
            const res = await notifyLeave(leaveId);
            setOk(res.ok);
            setMsg(res.message);
          })
        }
        className="inline-flex items-center gap-2 bg-[#06C755] hover:bg-[#05b64c] disabled:opacity-60 text-white px-4 h-9 rounded-full text-sm font-medium"
      >
        {pending ? "กำลังส่ง..." : "ส่งแจ้ง LINE กลุ่ม"}
      </button>
      {msg && <span className={`text-xs ${ok ? "text-emerald-700" : "text-red-600"}`}>{msg}</span>}
    </div>
  );
}

export function BulkLineButton({ status, date, teacherId }: { status?: string; date?: string; teacherId?: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState<boolean | null>(null);

  return (
    <div className="inline-flex flex-col gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setMsg(null);
            const res = await notifyFilteredAssignments({ status, date, teacherId });
            setOk(res.ok);
            setMsg(res.message);
          })
        }
        className="inline-flex items-center gap-2 bg-[#06C755] hover:bg-[#05b64c] disabled:opacity-60 text-white px-4 h-9 rounded-full text-sm font-medium"
      >
        {pending ? "กำลังส่ง..." : "ส่งที่กรองแล้วไป LINE"}
      </button>
      {msg && <span className={`text-xs ${ok ? "text-emerald-700" : "text-red-600"}`}>{msg}</span>}
    </div>
  );
}
