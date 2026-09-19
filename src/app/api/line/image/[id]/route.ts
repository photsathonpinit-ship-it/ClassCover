import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { lineImages } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return new Response("missing id", { status: 400 });

  const row = await db.query.lineImages.findFirst({ where: eq(lineImages.id, id) }).catch(() => null);
  if (!row) return new Response("not found", { status: 404 });

  const base64 = row.data;
  const buf = Buffer.from(base64, "base64");
  return new Response(buf, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": String(buf.length),
    },
  });
}
