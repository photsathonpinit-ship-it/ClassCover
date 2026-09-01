import type { Teacher } from "@/lib/db/schema";

export function getTeacherName(t: Pick<Teacher, "title" | "firstName" | "lastName">): string {
  return `${t.title} ${t.firstName} ${t.lastName}`;
}
