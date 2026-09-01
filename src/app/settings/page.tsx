import Link from "next/link";
import { getSchoolName } from "@/lib/school";
import { updateSchoolName } from "./actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ searchParams }: PageProps<"/settings">) {
  const sp = await searchParams;
  const saved = sp?.saved === "1";
  const err = sp?.error === "missing";
  const current = await getSchoolName();

  return (
    <div className="max-w-[640px] mx-auto px-6 md:px-8 py-8">
      <div className="mb-6">
        <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 font-medium">ตั้งค่า</div>
        <h1 className="text-3xl tracking-tighter font-bold text-zinc-900 mt-2">ตั้งชื่อโรงเรียน</h1>
        <p className="text-sm text-zinc-600 mt-2">ชื่อนี้จะแสดงบนแดชบอร์ด, ปฏิทิน และแถบข้าง</p>
      </div>

      {saved && <div className="bg-emerald-50 border-2 border-emerald-200 text-emerald-800 px-4 py-3 rounded-[16px] text-sm mb-4">บันทึกแล้ว ✓</div>}
      {err && <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-[16px] text-sm mb-4">กรุณากรอกชื่อโรงเรียน</div>}

      <form action={updateSchoolName} className="bg-white border-[3px] border-white rounded-[24px] p-6 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),0_10px_24px_rgba(0,0,0,0.07)] space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">ชื่อโรงเรียน</label>
          <input name="schoolName" defaultValue={current} placeholder="เช่น โรงเรียนบ้านหนองควาย" className="w-full bg-zinc-50 border-2 border-zinc-200 rounded-[12px] px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-300" />
          <p className="text-xs text-zinc-500 mt-1">ตัวอย่าง: โรงเรียนบ้านหนองควาย, โรงเรียนวัดสระแก้ว</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-zinc-900 hover:bg-zinc-800 text-white px-6 py-2.5 rounded-full text-sm font-medium">บันทึก</button>
          <Link href="/" className="bg-white border-2 border-zinc-200 hover:bg-zinc-50 px-6 py-2.5 rounded-full text-sm">กลับแดชบอร์ด</Link>
        </div>
      </form>

      <div className="mt-4 text-xs text-zinc-500">ฝ่ายวิชาการ จะแสดงแทนข้อความเดิมทุกหน้า</div>
    </div>
  );
}
