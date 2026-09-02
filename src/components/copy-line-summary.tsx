"use client";

import { useState } from "react";

const DAY_LABELS: Record<string, string> = {
  MON: "จันทร์",
  TUE: "อังคาร",
  WED: "พุธ",
  THU: "พฤหัสบดี",
  FRI: "ศุกร์",
};

function formatLeaveText(opts: {
  schoolName: string;
  absentName: string;
  leaveType: string;
  dateRange: string;
  reason?: string | null;
  slots: { date: string; day: string; period: number; subject: string; classLevel: string | null; room: string | null; substituteName: string | null }[];
}) {
  const lines: string[] = [];
  lines.push("📢 แจ้งจัดสอนแทน");
  lines.push(opts.schoolName);
  lines.push(`ครูที่ลา: ${opts.absentName} (${opts.leaveType} ${opts.dateRange})`);
  if (opts.reason?.trim()) lines.push(`เหตุผล: ${opts.reason.trim()}`);
  if (opts.slots.length === 0) lines.push("ไม่มีคาบที่ต้องจัดแทนในช่วงนี้");
  else {
    lines.push(`จัดแทน ${opts.slots.length} คาบ:`);
    for (const s of opts.slots) {
      const dayTh = DAY_LABELS[s.day] ?? s.day;
      const cls = s.classLevel ? ` ${s.classLevel}` : "";
      const room = s.room ? ` (${s.room})` : "";
      const sub = s.substituteName ?? "— ยังไม่จัด";
      lines.push(`• ${dayTh} ${s.date} คาบ ${s.period} ${s.subject}${cls}${room} → ${sub}`);
    }
  }
  lines.push("ฝ่ายวิชาการ");
  return lines.join("\n");
}

function formatAssignmentsText(opts: {
  schoolName: string;
  title?: string;
  assignments: { date: string; day: string; period: number; subject: string; classLevel: string | null; room: string | null; absentName: string; substituteName: string | null }[];
}) {
  const lines: string[] = [];
  lines.push(`📢 ${opts.title ?? "สรุปจัดสอนแทน"}`);
  lines.push(opts.schoolName);
  if (opts.assignments.length === 0) lines.push("ไม่มีรายการจัดสอนแทนในช่วงที่เลือก");
  else {
    const byDate = new Map<string, typeof opts.assignments>();
    for (const a of opts.assignments) {
      const arr = byDate.get(a.date) ?? [];
      arr.push(a);
      byDate.set(a.date, arr);
    }
    const dates = [...byDate.keys()].sort();
    lines.push(`รวม ${opts.assignments.length} คาบ:`);
    for (const d of dates) {
      const list = byDate.get(d)!;
      const dayTh = DAY_LABELS[list[0].day] ?? list[0].day;
      lines.push(`— ${dayTh} ${d}`);
      for (const a of [...list].sort((x, y) => x.period - y.period)) {
        const cls = a.classLevel ? ` ${a.classLevel}` : "";
        const room = a.room ? ` (${a.room})` : "";
        const sub = a.substituteName ?? "— ยังไม่จัด";
        lines.push(`  • คาบ ${a.period} ${a.subject}${cls}${room} ${a.absentName} → ${sub}`);
      }
    }
  }
  lines.push("ฝ่ายวิชาการ");
  return lines.join("\n");
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    return true;
  }
}

export function CopyLeaveButton(props: {
  schoolName: string;
  absentName: string;
  leaveType: string;
  dateRange: string;
  reason?: string | null;
  slots: { date: string; day: string; period: number; subject: string; classLevel: string | null; room: string | null; substituteName: string | null }[];
}) {
  const [copied, setCopied] = useState(false);
  const [show, setShow] = useState(false);
  const text = formatLeaveText(props);
  return (
    <div className="inline-flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={async () => {
            await copyText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 h-9 rounded-full text-sm font-medium"
        >
          {copied ? "คัดลอกแล้ว ✓" : "คัดลอกสรุปไปวางในไลน์"}
        </button>
        <button type="button" onClick={() => setShow((v) => !v)} className="text-sm text-zinc-500 hover:text-zinc-700 px-2 h-9">
          {show ? "ซ่อนข้อความ" : "ดูตัวอย่าง"}
        </button>
      </div>
      {show && <pre className="mt-1 bg-zinc-900 text-zinc-100 rounded-xl p-4 text-xs whitespace-pre-wrap leading-relaxed max-w-[560px] overflow-auto">{text}</pre>}
    </div>
  );
}

export function CopyAssignmentsButton(props: {
  schoolName: string;
  title?: string;
  assignments: { date: string; day: string; period: number; subject: string; classLevel: string | null; room: string | null; absentName: string; substituteName: string | null }[];
}) {
  const [copied, setCopied] = useState(false);
  const [show, setShow] = useState(false);
  const text = formatAssignmentsText(props);
  if (props.assignments.length === 0) return null;
  return (
    <div className="inline-flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={async () => {
            await copyText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 h-9 rounded-full text-sm font-medium"
        >
          {copied ? "คัดลอกแล้ว ✓" : "คัดลอกสรุปไปไลน์"}
        </button>
        <button type="button" onClick={() => setShow((v) => !v)} className="text-sm text-zinc-500 hover:text-zinc-700 px-2 h-9">
          {show ? "ซ่อน" : "ดูตัวอย่าง"}
        </button>
      </div>
      {show && <pre className="mt-1 bg-zinc-900 text-zinc-100 rounded-xl p-4 text-xs whitespace-pre-wrap leading-relaxed max-w-[640px] overflow-auto">{text}</pre>}
    </div>
  );
}
