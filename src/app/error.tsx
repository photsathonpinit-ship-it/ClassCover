"use client";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="p-8 text-center py-20">
      <h1 className="text-2xl font-bold text-red-700">เกิดข้อผิดพลาด</h1>
      <p className="text-sm text-slate-500 mt-2">{error.message || "ลองรีเฟรชอีกครั้ง"}</p>
      <button onClick={reset} className="mt-6 bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-md text-sm">
        ลองใหม่
      </button>
    </div>
  );
}
