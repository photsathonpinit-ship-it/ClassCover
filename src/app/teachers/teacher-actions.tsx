"use client";

import Link from "next/link";
import { useTransition } from "react";
import { deleteTeacher } from "./actions";

export function TeacherActions({ id }: { id: number }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-end gap-2">
      <Link
        href={`/teachers/${id}/edit`}
        className="text-sm text-blue-600 hover:text-blue-800"
      >
        แก้ไข
      </Link>
      <Link
        href={`/teachers/${id}/schedule`}
        className="text-sm text-slate-600 hover:text-slate-800"
      >
        ตาราง
      </Link>
      <button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await deleteTeacher(id);
          })
        }
        className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
      >
        {pending ? "ลบ..." : "ลบ"}
      </button>
    </div>
  );
}
