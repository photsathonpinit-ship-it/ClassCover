"use client";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="px-4 sm:px-6 py-20 text-center">
      <h1 className="text-2xl font-bold text-red-700">เกิดข้อผิดพลาด</h1>
      <p className="text-sm text-slate-500 mt-2">{error.message || "ลองรีเฟรชอีกครั้ง"}</p>
      <button onClick={reset} className="mt-6 bg-slate-800 hover:bg-slate-900 text-white px-5 h-11 rounded-md text-sm inline-flex items-center justify-center">
        ลองใหม่
      </button>
    </div>
  );
}
