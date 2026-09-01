import Link from "next/link";

export const dynamic = "force-dynamic";

export default function ImportSchedulePage() {
  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">นำเข้าตารางสอนจำนวนมาก</h1>
        <p className="text-sm text-slate-500 mt-1">สำหรับโรงใหญ่ 30-100 คน — ใช้ไฟล์ CSV เดียวจบ ไม่ต้องกรอกทีละคน</p>
        <Link href="/schedule" className="text-sm text-blue-600 hover:underline">← กลับตารางรวม</Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        <div>
          <h2 className="font-semibold mb-2">1) ดาวน์โหลดเทมเพลต</h2>
          <p className="text-sm text-slate-600 mb-3">ไฟล์ตัวอย่าง 5 แถว มีหัวคอลัมน์ครบ — เปิดด้วย Excel/Google Sheets ได้</p>
          <a href="/template-schedule.csv" download className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-sm">
            ดาวน์โหลด template-schedule.csv
          </a>
        </div>

        <div className="border-t pt-6">
          <h2 className="font-semibold mb-2">2) วิธีเตรียมไฟล์</h2>
          <ol className="list-decimal pl-5 text-sm text-slate-700 space-y-1">
            <li>คอลัมน์: <code className="bg-slate-100 px-1 rounded">ชื่อ,นามสกุล,คำนำหน้า,วัน(MON-FRI),คาบ(1-8),วิชา,ห้อง,ชั้น,กลุ่มวิชา</code></li>
            <li><code>วัน</code> ใช้ MON TUE WED THU FRI เท่านั้น</li>
            <li><code>คาบ</code> 1-8 สอดคล้องกับ 08.45→1, 09.45→2, 10.45→3, 13.00→4, 14.00→5 (กิจกรรม 08.30/พัก/PLC ไม่ต้องใส่)</li>
            <li><code>กลุ่มวิชา</code> คั่นด้วยจุลภาค เช่น <code>&quot;คณิตศาสตร์,ฟิสิกส์&quot;</code></li>
            <li>ใส่ <code>ว่าง</code> ไม่ต้องใส่แถว — ระบบถือว่าว่างอยู่แล้ว</li>
          </ol>
        </div>

        <div className="border-t pt-6">
          <h2 className="font-semibold mb-2">3) อัปโหลด (กำลังพัฒนา)</h2>
          <p className="text-sm text-slate-600 mb-3">ตอนนี้ใช้สคริปต์นำเข้าจากไฟล์ CSV ได้ทันที — ส่งไฟล์มาให้ผมรันให้ได้เลย</p>
          <div className="bg-slate-50 border rounded p-4 text-xs">
            <div>คำสั่งสำหรับแอดมิน:</div>
            <code className="block mt-2 bg-white border rounded px-3 py-2">npx tsx scripts/import-csv.ts path/to/ไฟล์.csv</code>
            <div className="mt-2 text-slate-500">สคริปต์จะสร้างครูใหม่ถ้ายังไม่มี และแทนที่ตารางสอนของครูคนนั้นทั้งหมด</div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="font-semibold mb-2">4) จากรูปภาพตารางสอน</h2>
          <p className="text-sm text-slate-600">ถ้ามีแต่รูปภาพแบบที่ส่งมา 3 ใบ — ส่งรูปมาทางแชตได้เลย ผมจะ OCR แปลงเป็น CSV ให้แล้วนำเข้าให้ (แม่น ~85% ต้องตรวจทานวิชาที่เพี้ยน)</p>
          <div className="text-sm bg-amber-50 border border-amber-200 rounded px-3 py-2 mt-2">ตัวอย่าง 3 ใบที่ส่งมา ได้นำเข้าระบบแล้ว: ณัฐพงษ์ 18 คาบ, กิติยา 18 คาบ, พรทิพย์ 23 คาบ — ดูได้ที่ <Link href="/teachers" className="text-blue-600 underline">จัดการครู</Link> และ <Link href="/schedule" className="text-blue-600 underline">ตารางสอน</Link></div>
        </div>
      </div>
    </div>
  );
}
