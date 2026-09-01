"use client";

import { useState, useTransition } from "react";
import { DAY_LABELS } from "@/lib/dates";
import type { PreviewSlot } from "./actions";
import { confirmAssignments } from "./actions";

interface Saved {
  date: string;
  period: number;
  substituteName: string | null;
  substituteId: number | null;
}

export function AssignmentForm({
  leaveId,
  slots,
  saved,
}: {
  leaveId: number;
  slots: PreviewSlot[];
  saved: Saved[];
}) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  const savedMap = new Map<string, Saved>();
  for (const s of saved) savedMap.set(`${s.date}-${s.period}`, s);

  // ค่าเริ่มต้น: ที่บันทึกไว้ -> ที่ระบบแนะนำ -> คนแรก -> ว่าง
  const getInitial = (slot: PreviewSlot): string => {
    const savedId = savedMap.get(slot.key)?.substituteId;
    if (savedId != null) return String(savedId);
    if (slot.chosenId != null) return String(slot.chosenId);
    if (slot.candidates[0]) return String(slot.candidates[0].id);
    return "";
  };

  const [selections, setSelections] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const slot of slots) init[slot.key] = getInitial(slot);
    return init;
  });

  const savedCount = saved.length;

  async function onConfirm() {
    const fd = new FormData();
    fd.set("leaveId", String(leaveId));
    for (const slot of slots) {
      const val = selections[slot.key];
      if (val) fd.set(`slot-${slot.date}-${slot.period}`, val);
    }
    await confirmAssignments(fd);
    setDone(true);
  }

  return (
    <div>
      {slots.length === 0 ? (
        <p className="text-sm text-slate-500 bg-slate-50 rounded-md p-4">
          ไม่พบคาบสอนที่ขาดในช่วงวันนี้ (ครูไม่ได้มีตารางสอนในช่วงนั้น)
        </p>
      ) : (
        <div className="space-y-3">
          {slots.map((slot) => {
            const isSaved = savedMap.has(slot.key);
            return (
              <div
                key={slot.key}
                className={`border rounded-lg p-4 ${isSaved ? "bg-emerald-50 border-emerald-200" : "bg-slate-50"}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold">
                      {DAY_LABELS[slot.day]} {slot.date} · คาบ {slot.period}
                    </div>
                    <div className="text-sm text-slate-600 mt-0.5">
                      {slot.subject}
                      {slot.classLevel && <> · {slot.classLevel}</>}
                      {slot.room && <> · ห้อง {slot.room}</>}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">ครูขาด: {slot.absent}</div>
                  </div>
                  {isSaved && (
                    <span className="text-xs text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded shrink-0">
                      จัดแล้ว: {savedMap.get(slot.key)?.substituteName}
                    </span>
                  )}
                </div>

                {slot.candidates.length === 0 ? (
                  <p className="text-sm text-red-600 mt-3">⚠ ไม่มีครูว่างในคาบนี้ ต้องจัดการเอง</p>
                ) : (
                  <div className="mt-3 space-y-2">
                    <label className="text-xs text-slate-500">เลือกครูสอนแทน:</label>
                    <select
                      value={selections[slot.key] ?? ""}
                      onChange={(e) => setSelections((prev) => ({ ...prev, [slot.key]: e.target.value }))}
                      className="w-full border rounded-md px-3 h-11 text-sm bg-white"
                    >
                      <option value="">-- ไม่จัดคาบนี้ --</option>
                      {slot.candidates.map((c) => (
                        <option key={c.id} value={String(c.id)}>
                          {c.name} (คะแนน {c.score}
                          {c.reasons.length > 0 ? ` · ${c.reasons.join(", ")}` : ""})
                        </option>
                      ))}
                    </select>
                    <details className="text-xs">
                      <summary className="cursor-pointer text-slate-500 hover:text-slate-700">
                        ดูรายชื่อทั้งหมด {slot.candidates.length} คน
                      </summary>
                      <ul className="mt-1 space-y-1">
                        {slot.candidates.map((c) => (
                          <li key={c.id} className="flex items-center gap-2 text-slate-600">
                            <span className="font-medium">{c.name}</span>
                            {c.reasons.length > 0 && (
                              <span className="text-emerald-600">({c.reasons.join(", ")})</span>
                            )}
                            <span className="text-slate-400">คะแนน {c.score}</span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {slots.length > 0 && (
        <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            disabled={pending}
            onClick={() => startTransition(onConfirm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 h-11 rounded-md text-sm font-medium disabled:opacity-50"
          >
            {pending ? "กำลังบันทึก..." : savedCount > 0 ? "ยืนยันการจัดแทน" : "จัดแทนอัตโนมัติทั้งหมด"}
          </button>
          {done && <span className="text-sm text-emerald-600">บันทึกการจัดแทนเรียบร้อยแล้ว — รีเฟรชเพื่อดูรายการล่าสุด</span>}
        </div>
      )}
    </div>
  );
}
