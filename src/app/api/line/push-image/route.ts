import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { lineImages } from "@/lib/db/schema";
import { getLineConfig } from "@/lib/line";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { dataUrl?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const dataUrl = body?.dataUrl?.trim();
  if (!dataUrl || !dataUrl.startsWith("data:image")) {
    return Response.json({ ok: false, error: "dataUrl ไม่ถูกต้อง" }, { status: 400 });
  }

  const base64 = dataUrl.split(",")[1];
  if (!base64 || base64.length < 100) {
    return Response.json({ ok: false, error: "รูปภาพว่างเปล่า" }, { status: 400 });
  }

  // จำกัดขนาด ~ 2MB base64 (~1.5MB binary) ป้องกัน DB บวม
  if (base64.length > 3_000_000) {
    return Response.json({ ok: false, error: "รูปภาพใหญ่เกินไป" }, { status: 400 });
  }

  const cfg = await getLineConfig();
  if (!cfg) {
    return Response.json({ ok: false, error: "ยังไม่ได้ตั้งค่า LINE: กรุณาเชิญบอท @648xklvy เข้ากลุ่ม จัดสอนแทนอนุบาลหนองควาย แล้วพิมพ์ สวัสดี ในกลุ่มเพื่อเชื่อมอัตโนมัติ หรือตั้งค่าที่ /settings#line" }, { status: 400 });
  }

  // Group ID ต้องขึ้นต้นด้วย C
  if (!cfg.groupId.startsWith("C")) {
    return Response.json({ ok: false, error: `Group ID ไม่ถูกต้อง (${cfg.groupId.slice(0,1)}...): ต้องเป็นรหัสกลุ่มที่ขึ้นต้นด้วย C — กรุณาเชิญบอทเข้ากลุ่ม จัดสอนแทนอนุบาลหนองควาย แล้วพิมพ์ สวัสดี ในกลุ่ม` }, { status: 400 });
  }

  const id = randomUUID().replaceAll("-", "").slice(0, 16);

  try {
    await db.insert(lineImages).values({ id, data: base64 });
  } catch (e) {
    console.error("[line push-image] db insert failed", e);
    return Response.json({ ok: false, error: "บันทึกรูปไม่สำเร็จ" }, { status: 500 });
  }

  const origin = new URL(req.url).origin;
  // ใช้ origin ปัจจุบันเพื่อให้ LINE ดึงรูปได้ (ต้องเป็น https สาธารณะ)
  const imageUrl = `${origin}/api/line/image/${id}`;

  // ส่งเป็นรูปภาพไปกลุ่มแบบอัตโนมัติ
  const lineRes = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: cfg.groupId,
      messages: [
        {
          type: "image",
          originalContentUrl: imageUrl,
          previewImageUrl: imageUrl,
        },
      ],
    }),
  });

  if (!lineRes.ok) {
    const errText = await lineRes.text().catch(() => "");
    console.error("[LINE push image] failed", lineRes.status, errText);
    // ลบรูปที่บันทึกไว้ถ้าส่งไม่สำเร็จ (ไม่บังคับ)
    // await db.delete(lineImages).where(eq(lineImages.id, id)).catch(()=>{});
    return Response.json({ ok: false, error: `LINE ส่งไม่สำเร็จ ${lineRes.status}: ${errText.slice(0, 300)}` }, { status: 500 });
  }

  return Response.json({ ok: true, message: "ส่งรูปภาพไปไลน์กลุ่ม จัดสอนแทนอนุบาลหนองควาย แล้ว ✓", imageUrl });
}
