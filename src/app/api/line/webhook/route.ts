import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { schoolSettings } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("ok", { status: 200 });
  }

  // Log สำหรับดู Group ID บน Vercel Logs
  console.log("[LINE webhook]", JSON.stringify(body).slice(0, 4000));

  const events = (body as { events?: { source?: { type?: string; groupId?: string; userId?: string }; type?: string }[] })?.events ?? [];
  const groupId = events.find((e) => e.source?.type === "group" && e.source?.groupId)?.source?.groupId;

  if (groupId) {
    console.log(`[LINE] Detected groupId: ${groupId}`);
    try {
      const row = await db.query.schoolSettings.findFirst();
      if (row && !row.lineGroupId) {
        await db.update(schoolSettings).set({ lineGroupId: groupId, updatedAt: new Date().toISOString() }).where(eq(schoolSettings.id, row.id));
        console.log(`[LINE] Auto-saved groupId to DB`);
      } else if (!row) {
        await db.insert(schoolSettings).values({ schoolName: "โรงเรียนประถม", lineGroupId: groupId });
        console.log(`[LINE] Created settings with groupId`);
      }
    } catch (e) {
      console.error("[LINE] Failed to auto-save groupId", e);
    }
  }

  return new Response("ok", { status: 200 });
}

export async function GET() {
  return new Response("LINE webhook is running. POST events here. Set this URL in LINE Developers Console → Messaging API → Webhook URL.", { status: 200 });
}
