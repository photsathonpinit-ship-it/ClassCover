"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-medium print:hidden"
    >
      พิมพ์ตาราง
    </button>
  );
}

export function ExportCsvButton({ rows }: { rows: string[][] }) {
  const onExport = () => {
    const header = ["วันที่", "วัน", "คาบ", "วิชา/ห้อง", "ครูที่ลา", "ครูสอนแทน", "สถานะ"];
    const all = [header, ...rows];
    const csv = all.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    // BOM สำหรับ Excel ภาษาไทย
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `จัดสอนแทน_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <button onClick={onExport} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md text-sm print:hidden">
      ส่งออก CSV
    </button>
  );
}
