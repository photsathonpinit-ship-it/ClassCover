"use client";

import { useFormStatus } from "react-dom";

export function FormProgressBar() {
  const { pending } = useFormStatus();
  if (!pending) return null;
  return (
    <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
      <div className="h-full w-full bg-blue-600 rounded-full animate-pulse" style={{ animation: "pulse 0.8s ease-in-out infinite" }} />
    </div>
  );
}

export function TopFormProgressBar() {
  const { pending } = useFormStatus();
  if (!pending) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-[99] h-1 bg-blue-600 animate-pulse pointer-events-none" />
  );
}

export function SubmitButton({
  children,
  className,
  pendingText = "กำลังบันทึก...",
}: {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className + (pending ? " opacity-60 pointer-events-none" : "")}>
      {pending ? pendingText : children}
    </button>
  );
}
