import Link from "next/link";

export default function NotFound() {
  return (
    <div className="p-8 text-center py-20">
      <h1 className="text-3xl font-bold text-slate-800">ไม่พบหน้านี้</h1>
      <p className="text-sm text-slate-500 mt-2">ลิงก์ไม่ถูกต้องหรือถูกลบไปแล้ว</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md text-sm">
          กลับแดชบอร์ด
        </Link>
        <Link href="/leaves" className="bg-white border hover:bg-slate-50 px-5 py-2 rounded-md text-sm">
          ไปหน้าการลา
        </Link>
      </div>
    </div>
  );
}
