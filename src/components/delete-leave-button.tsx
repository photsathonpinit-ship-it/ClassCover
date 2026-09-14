"use client";

import { deleteLeave } from "@/app/leaves/actions";

export function DeleteLeaveButton({ id, compact }: { id: number; compact?: boolean }) {
  return (
    <form
      action={deleteLeave}
      onSubmit={(e) => {
        if (!confirm("ยืนยันลบใบลานี้? ประวัติการจัดแทนที่เกี่ยวข้องจะถูกลบด้วย และจะไม่ถูกนับในสถิติ")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={String(id)} />
      <button
        type="submit"
        className={
          compact
            ? "text-xs bg-white border hover:bg-red-50 text-red-600 px-3 py-1 rounded-full"
            : "text-sm bg-white border border-red-200 hover:bg-red-50 text-red-600 px-4 h-9 rounded-full inline-flex items-center justify-center"
        }
      >
        ลบ
      </button>
    </form>
  );
}
