"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";

const DAY_LABELS: Record<string, string> = {
  MON: "จันทร์",
  TUE: "อังคาร",
  WED: "พุธ",
  THU: "พฤหัสบดี",
  FRI: "ศุกร์",
};

function thaiDateNow() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear() + 543;
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${mi} น.`;
}

export function LeaveImageButton(props: {
  schoolName: string;
  absentName: string;
  leaveType: string;
  dateRange: string;
  reason?: string | null;
  slots: { date: string; day: string; period: number; subject: string; classLevel: string | null; room: string | null; substituteName: string | null }[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);

  const handle = async () => {
    if (!ref.current) return;
    setSaving(true);
    try {
      const dataUrl = await toPng(ref.current, { cacheBust: true, pixelRatio: 2, backgroundColor: "#ffffff" });
      const a = document.createElement("a");
      a.download = `จัดสอนแทน_${props.absentName}_${props.dateRange.replaceAll("/", "-").replaceAll(" ", "")}.png`;
      a.href = dataUrl;
      a.click();
    } catch (e) {
      console.error(e);
      alert("บันทึกภาพไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setSaving(false);
    }
  };

  const hasSlots = props.slots.length > 0;

  return (
    <>
      <button
        type="button"
        onClick={handle}
        disabled={saving}
        className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-black disabled:opacity-60 text-white px-4 h-9 rounded-full text-sm font-medium"
      >
        {saving ? "กำลังสร้างภาพ..." : "📷 บันทึกเป็นรูปภาพ"}
      </button>

      {/* Hidden template for capture */}
      <div style={{ position: "fixed", left: -10000, top: 0, pointerEvents: "none" }} aria-hidden>
        <div
          ref={ref}
          style={{
            width: 1080,
            background: "#ffffff",
            color: "#0f172a",
            fontFamily: "Arial, Noto Sans Thai, system-ui, sans-serif",
            padding: 40,
            lineHeight: 1.6,
          }}
        >
          {/* Header */}
          <div style={{ border: "3px solid #0f172a", borderRadius: 20, overflow: "hidden" }}>
            <div style={{ background: "#0f172a", color: "#ffffff", padding: "28px 36px" }}>
              <div style={{ fontSize: 13, letterSpacing: 2.4, opacity: 0.85, fontWeight: 700 }}>ACADEMIC AFFAIRS · ANUBANNONGKHWAI SCHOOL</div>
              <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: -1, marginTop: 8, lineHeight: 1.1 }}>{props.schoolName}</div>
              <div style={{ fontSize: 22, fontWeight: 700, marginTop: 10, color: "#93c5fd" }}>แจ้งจัดสอนแทน — {props.leaveType} · {props.dateRange}</div>
              <div style={{ fontSize: 15, marginTop: 6, color: "#cbd5e1" }}>
                ครูที่ลา: <span style={{ color: "#fff", fontWeight: 700 }}>{props.absentName}</span>
                {props.reason?.trim() ? <span> · เหตุผล: {props.reason.trim()}</span> : null}
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: "28px 36px 32px", background: "#ffffff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
                  {hasSlots ? `จัดแทน ${props.slots.length} คาบ` : "ไม่มีคาบที่ต้องจัดแทน"}
                </div>
                <div style={{ fontSize: 13, color: "#64748b", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 999, padding: "6px 14px" }}>
                  {thaiDateNow()}
                </div>
              </div>

              {hasSlots ? (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 16 }}>
                  <thead>
                    <tr>
                      {["วัน / วันที่", "คาบ", "รายวิชา", "ห้อง / ชั้น", "ครูสอนแทน"].map((h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: "left",
                            background: "#f1f5f9",
                            border: "1px solid #e2e8f0",
                            padding: "12px 14px",
                            fontSize: 13,
                            letterSpacing: 0.8,
                            fontWeight: 800,
                            color: "#334155",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {props.slots.map((s, i) => {
                      const dayTh = DAY_LABELS[s.day] ?? s.day;
                      return (
                        <tr key={`${s.date}-${s.period}`} style={{ background: i % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                          <td style={{ border: "1px solid #e2e8f0", padding: "12px 14px" }}>
                            <span style={{ fontWeight: 700 }}>{dayTh}</span> <span style={{ color: "#64748b" }}>{s.date}</span>
                          </td>
                          <td style={{ border: "1px solid #e2e8f0", padding: "12px 14px", textAlign: "center", fontWeight: 700 }}>{s.period}</td>
                          <td style={{ border: "1px solid #e2e8f0", padding: "12px 14px", fontWeight: 700 }}>{s.subject}</td>
                          <td style={{ border: "1px solid #e2e8f0", padding: "12px 14px", color: "#334155" }}>
                            {[s.classLevel, s.room].filter(Boolean).join(" · ") || "—"}
                          </td>
                          <td
                            style={{
                              border: "1px solid #e2e8f0",
                              padding: "12px 14px",
                              fontWeight: 700,
                              color: s.substituteName ? "#0f172a" : "#b45309",
                              background: s.substituteName ? undefined : "#fffbeb",
                            }}
                          >
                            {s.substituteName ?? "— ยังไม่จัด"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div style={{ border: "1px dashed #cbd5e1", borderRadius: 12, padding: 24, textAlign: "center", color: "#64748b" }}>
                  ไม่พบคาบสอนที่ขาดในช่วงนี้
                </div>
              )}

              <div
                style={{
                  marginTop: 20,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderTop: "1px solid #e2e8f0",
                  paddingTop: 16,
                  fontSize: 13,
                  color: "#64748b",
                }}
              >
                <span>
                  by <span style={{ color: "#0f172a", fontWeight: 700 }}>Photsathon Pinit</span> · Anubannongkhwai School
                </span>
                <span>ฝ่ายวิชาการ</span>
              </div>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "#94a3b8" }}>ระบบจัดสอนแทนอัตโนมัติ · https://class-cover-ten.vercel.app</div>
        </div>
      </div>
    </>
  );
}

export function AssignmentsImageButton(props: {
  schoolName: string;
  title: string;
  assignments: { date: string; day: string; period: number; subject: string; classLevel: string | null; room: string | null; absentName: string; substituteName: string | null }[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);

  const handle = async () => {
    if (!ref.current) return;
    setSaving(true);
    try {
      const dataUrl = await toPng(ref.current, { cacheBust: true, pixelRatio: 2, backgroundColor: "#ffffff" });
      const a = document.createElement("a");
      const safeTitle = props.title.replaceAll("/", "-").replaceAll(" ", "_");
      a.download = `${safeTitle}.png`;
      a.href = dataUrl;
      a.click();
    } catch (e) {
      console.error(e);
      alert("บันทึกภาพไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setSaving(false);
    }
  };

  const byDate = new Map<string, typeof props.assignments>();
  for (const a of props.assignments) {
    const arr = byDate.get(a.date) ?? [];
    arr.push(a);
    byDate.set(a.date, arr);
  }
  const dates = [...byDate.keys()].sort();

  return (
    <>
      <button
        type="button"
        onClick={handle}
        disabled={saving || props.assignments.length === 0}
        className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-black disabled:opacity-40 text-white px-4 h-9 rounded-full text-sm font-medium"
      >
        {saving ? "กำลังสร้างภาพ..." : "📷 บันทึกเป็นรูปภาพ"}
      </button>

      <div style={{ position: "fixed", left: -10000, top: 0, pointerEvents: "none" }} aria-hidden>
        <div
          ref={ref}
          style={{
            width: 1080,
            background: "#ffffff",
            color: "#0f172a",
            fontFamily: "Arial, Noto Sans Thai, system-ui, sans-serif",
            padding: 40,
            lineHeight: 1.6,
          }}
        >
          <div style={{ border: "3px solid #0f172a", borderRadius: 20, overflow: "hidden" }}>
            <div style={{ background: "#0f172a", color: "#ffffff", padding: "28px 36px" }}>
              <div style={{ fontSize: 13, letterSpacing: 2.4, opacity: 0.85, fontWeight: 700 }}>ACADEMIC AFFAIRS · ANUBANNONGKHWAI SCHOOL</div>
              <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: -1, marginTop: 8, lineHeight: 1.1 }}>{props.schoolName}</div>
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 10, color: "#93c5fd" }}>{props.title}</div>
              <div style={{ fontSize: 15, marginTop: 6, color: "#cbd5e1" }}>รวม {props.assignments.length} คาบ · แบ่งตามวันชัดเจน</div>
            </div>

            <div style={{ padding: "28px 36px 32px", background: "#ffffff" }}>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                <div style={{ fontSize: 13, color: "#64748b", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 999, padding: "6px 14px" }}>
                  {thaiDateNow()}
                </div>
              </div>

              {dates.map((d) => {
                const list = byDate.get(d)!;
                const dayTh = DAY_LABELS[list[0].day] ?? list[0].day;
                return (
                  <div key={d} style={{ marginBottom: 20 }}>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 800,
                        color: "#ffffff",
                        background: "#1e293b",
                        display: "inline-block",
                        borderRadius: 999,
                        padding: "6px 14px",
                        marginBottom: 10,
                      }}
                    >
                      {dayTh} {d} — {list.length} คาบ
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
                      <thead>
                        <tr>
                          {["คาบ", "รายวิชา", "ห้อง / ชั้น", "ครูที่ลา", "ครูสอนแทน"].map((h) => (
                            <th
                              key={h}
                              style={{
                                textAlign: "left",
                                background: "#f1f5f9",
                                border: "1px solid #e2e8f0",
                                padding: "10px 12px",
                                fontSize: 12,
                                letterSpacing: 0.6,
                                fontWeight: 800,
                                color: "#334155",
                              }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[...list]
                          .sort((x, y) => x.period - y.period)
                          .map((a, i) => (
                            <tr key={`${a.date}-${a.period}-${i}`} style={{ background: i % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                              <td style={{ border: "1px solid #e2e8f0", padding: "10px 12px", textAlign: "center", fontWeight: 800 }}>{a.period}</td>
                              <td style={{ border: "1px solid #e2e8f0", padding: "10px 12px", fontWeight: 700 }}>{a.subject}</td>
                              <td style={{ border: "1px solid #e2e8f0", padding: "10px 12px", color: "#334155" }}>
                                {[a.classLevel, a.room].filter(Boolean).join(" · ") || "—"}
                              </td>
                              <td style={{ border: "1px solid #e2e8f0", padding: "10px 12px", fontWeight: 600 }}>{a.absentName}</td>
                              <td
                                style={{
                                  border: "1px solid #e2e8f0",
                                  padding: "10px 12px",
                                  fontWeight: 700,
                                  color: a.substituteName ? "#0f172a" : "#b45309",
                                  background: a.substituteName ? undefined : "#fffbeb",
                                }}
                              >
                                {a.substituteName ?? "— ยังไม่จัด"}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}

              <div
                style={{
                  marginTop: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderTop: "1px solid #e2e8f0",
                  paddingTop: 14,
                  fontSize: 13,
                  color: "#64748b",
                }}
              >
                <span>
                  by <span style={{ color: "#0f172a", fontWeight: 700 }}>Photsathon Pinit</span> · Anubannongkhwai School
                </span>
                <span>ฝ่ายวิชาการ</span>
              </div>
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "#94a3b8" }}>
            ระบบจัดสอนแทนอัตโนมัติ · https://class-cover-ten.vercel.app
          </div>
        </div>
      </div>
    </>
  );
}
