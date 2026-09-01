"use client";

import Link from "next/link";
import { useTransition } from "react";
import { deleteTeacher } from "./actions";

export function TeacherActions({ id }: { id: number }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-end gap-2">
      <Link
        href={`/teachers/${id}/schedule`}
        className="inline-flex items-center h-9 px-3 rounded-full text-xs text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 active:bg-zinc-100"
      >
        ตาราง
      </Link>
      <Link
        href={`/teachers/${id}/edit`}
        className="inline-flex items-center h-9 px-3 rounded-full text-xs text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-100 active:bg-blue-200"
      >
        แก้ไข
      </Link>
      <button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await deleteTeacher(id);
          })
        }
        className="inline-flex items-center h-9 px-3 rounded-full text-xs text-red-600 bg-white border border-red-200 hover:bg-red-50 active:bg-red-100 disabled:opacity-50"
      >
        {pending ? "ลบ..." : "ลบ"}
      </button>
    </div>
  );
}