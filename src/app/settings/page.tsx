import Link from "next/link";
import { getSchoolName } from "@/lib/school";
import { updateLineSettings, updateSchoolName } from "./actions";
import { db } from "@/lib/db";
import { maskToken } from "@/lib/line";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ searchParams }: PageProps<"/settings">) {
  const sp = await searchParams;
  const saved = sp?.saved === "1";
  const err = sp?.error === "missing";
  const current = await getSchoolName();

  const row = await db.query.schoolSettings.findFirst().catch(() => null);
  const dbToken: string | null = (row as unknown as { lineChannelToken?: string | null })?.lineChannelToken ?? null;
  const dbGroup: string | null = (row as unknown as { lineGroupId?: string | null })?.lineGroupId ?? null;
  const hasDb = !!(dbToken && dbGroup);
  const hasEnv = !!(process.env.LINE_CHANNEL_ACCESS_TOKEN && process.env.LINE_GROUP_ID);
  const lineReady = hasDb || hasEnv;

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
          <input name="schoolName" defaultValue={current} placeholder="เช่น โรงเรียนบ้านหนองควาย" className="w-full bg-zinc-50 border-2 border-zinc-200 rounded-[12px] px-4 h-11 text-sm focus:outline-none focus:border-zinc-300" />
          <p className="text-xs text-zinc-500 mt-1">ตัวอย่าง: โรงเรียนบ้านหนองควาย, โรงเรียนวัดสระแก้ว</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button className="bg-zinc-900 hover:bg-zinc-800 text-white px-6 h-11 rounded-full text-sm font-medium">บันทึก</button>
          <Link href="/" className="bg-white border-2 border-zinc-200 hover:bg-zinc-50 px-6 h-11 rounded-full text-sm inline-flex items-center justify-center">กลับแดชบอร์ด</Link>
        </div>
      </form>

      <div className="mt-4 text-xs text-zinc-500">ฝ่ายวิชาการ จะแสดงแทนข้อความเดิมทุกหน้า</div>

      {/* LINE กลุ่ม */}
      <div id="line" className="mt-8">
        <div className="mb-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 font-medium">LINE กลุ่ม</div>
          <h2 className="text-2xl tracking-tighter font-bold text-zinc-900 mt-1">แจ้งเตือนไลน์กลุ่ม</h2>
          <p className="text-sm text-zinc-600 mt-1">เมื่อจัดสอนแทนเสร็จ กดปุ่ม “ส่งแจ้ง LINE กลุ่ม” ที่หน้ารายการแล้วข้อความจะเข้าไลน์กลุ่มทันที</p>
        </div>

        <div className={`px-4 py-3 rounded-[14px] text-sm mb-3 border ${lineReady ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-amber-50 border-amber-200 text-amber-800"}`}>
          {hasDb ? (
            <>พร้อมใช้งาน ✓ ใช้ค่าจากฐานข้อมูล</>
          ) : hasEnv ? (
            <>พร้อมใช้งาน ✓ ใช้ค่าจาก ENV ของเซิร์ฟเวอร์</>
          ) : (
            <>ยังไม่ได้ตั้งค่า — กรุณาใส่ Channel Access Token และ Group ID ด้านล่าง</>
          )}
          <div className="mt-1 text-xs opacity-80">ปัจจุบัน: Token {maskToken(dbToken ?? process.env.LINE_CHANNEL_ACCESS_TOKEN ?? null)} · Group {dbGroup ?? process.env.LINE_GROUP_ID ?? "—"}</div>
        </div>

        <form action={updateLineSettings} className="bg-white border border-zinc-200 rounded-[16px] p-6 space-y-4 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Channel Access Token (LINE Messaging API)</label>
            <input name="lineChannelToken" defaultValue={dbToken ?? ""} placeholder="วาง Channel access token (ยาว ๆ ขึ้นต้นด้วย ....)" className="w-full bg-zinc-50 border-2 border-zinc-200 rounded-[12px] px-4 h-11 text-sm focus:outline-none focus:border-zinc-300" autoComplete="off" />
            <p className="text-xs text-zinc-500 mt-1">หาได้ที่ LINE Developers Console → Provider → Channel → Messaging API → Channel access token (long-lived)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Group ID</label>
            <input name="lineGroupId" defaultValue={dbGroup ?? ""} placeholder="เช่น C1234567890abcdef1234567890abcde" className="w-full bg-zinc-50 border-2 border-zinc-200 rounded-[12px] px-4 h-11 text-sm focus:outline-none focus:border-zinc-300 font-mono" />
            <p className="text-xs text-zinc-500 mt-1">ต้องเชิญบอท (Official Account) เข้าไลน์กลุ่มก่อน แล้วดู Group ID จาก Webhook หรือเรียก <code className="bg-zinc-100 px-1 rounded">GET https://api.line.me/v2/bot/groups/...</code> หรือดู log หลังเชิญ</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 h-11 rounded-full text-sm font-medium">บันทึกการตั้งค่า LINE</button>
            <button type="reset" className="bg-white border-2 border-zinc-200 hover:bg-zinc-50 px-6 h-11 rounded-full text-sm text-zinc-700">ล้าง</button>
          </div>
          <p className="text-xs text-zinc-500">ปล่อยว่างแล้วบันทึก = ปิดการแจ้งเตือน (หรือลบ ENV ออก)</p>
        </form>

        <details className="mt-4 bg-white border border-zinc-200 rounded-[12px] px-4 py-3">
          <summary className="text-sm font-medium text-zinc-800 cursor-pointer">วิธีตั้งค่าแบบย่อ (5 ขั้น)</summary>
          <ol className="list-decimal pl-5 text-sm text-zinc-600 mt-2 space-y-1">
            <li>สร้าง LINE Official Account ที่ <code className="bg-zinc-100 px-1 rounded">developers.line.biz</code> → สร้าง Channel แบบ Messaging API</li>
            <li>คัดลอก <strong>Channel access token (long-lived)</strong> มาวางช่องบน</li>
            <li>เพิ่มบอทเป็นเพื่อน แล้ว <strong>เชิญบอทเข้ากลุ่มไลน์</strong> ที่ต้องการแจ้ง</li>
            <li>ดู Group ID: วิธีง่ายสุดคือตั้ง Webhook เป็น <code className="bg-zinc-100 px-1 rounded">https://{"<โดเมนของคุณ>"}/api/line/webhook</code> แล้วส่งข้อความในกลุ่ม — ดู log บน Vercel จะเห็น groupId</li>
            <li>วาง Group ID ลงช่องบนแล้วบันทึก — จากนั้นปุ่ม “ส่งแจ้ง LINE กลุ่ม” จะใช้งานได้</li>
          </ol>
          <p className="text-xs text-zinc-500 mt-2">ทางเลือก: ตั้ง ENV บน Vercel เป็น <code className="bg-zinc-100 px-1 rounded">LINE_CHANNEL_ACCESS_TOKEN</code> และ <code className="bg-zinc-100 px-1 rounded">LINE_GROUP_ID</code> แทนการกรอกในหน้านี้ก็ได้</p>
        </details>
      </div>
    </div>
  );
}
