import Link from "next/link";
import { createTeacher } from "../actions";

export default async function NewTeacherPage({ searchParams }: PageProps<"/teachers/new">) {
  const sp = await searchParams;
  const err = typeof sp?.error === "string" ? sp.error : "";
  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">เพิ่มครูใหม่</h1>
        <Link href="/teachers" className="text-sm text-blue-600 hover:underline">
          ← กลับรายการ
        </Link>
      </div>

      {err === "missing" && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-4">
          กรุณากรอกชื่อและนามสกุลให้ครบ
        </div>
      )}

      <form action={createTeacher} className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ตำแหน่ง</label>
            <input
              name="title"
              defaultValue="ครู"
              placeholder="ครู"
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อ</label>
            <input
              name="firstName"
              required
              placeholder="ชื่อ"
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">นามสกุล</label>
            <input
              name="lastName"
              required
              placeholder="นามสกุล"
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            วิชาที่สอนได้ (คั่นด้วยเครื่องหมายจุลภาค)
          </label>
          <input
            name="subjectGroups"
            placeholder="คณิตศาสตร์, ฟิสิกส์"
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">เบอร์โทร</label>
            <input name="phone" placeholder="08x-xxx-xxxx" className="w-full border rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">อีเมล</label>
            <input name="email" placeholder="x@school.ac.th" className="w-full border rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">คาบสูงสุด/วัน (สอนแทน)</label>
            <input
              name="maxPeriodsPerDay"
              type="number"
              defaultValue={4}
              min={1}
              max={8}
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md text-sm font-medium"
          >
            บันทึกและตั้งตารางสอน
          </button>
          <Link
            href="/teachers"
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2 rounded-md text-sm font-medium"
          >
            ยกเลิก
          </Link>
        </div>
      </form>
    </div>
  );
}
