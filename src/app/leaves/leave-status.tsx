export function LeaveStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
  };
  const labels: Record<string, string> = {
    pending: "รออนุมัติ",
    approved: "อนุมัติแล้ว",
    rejected: "ไม่อนุมัติ",
  };
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded ${styles[status] || ""}`}>
      {labels[status] || status}
    </span>
  );
}
