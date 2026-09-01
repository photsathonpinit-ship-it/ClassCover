"use client";

import { useState } from "react";
import Link from "next/link";

const navItems = [
  { href: "/", label: "แดชบอร์ด" },
  { href: "/calendar", label: "ปฏิทิน" },
  { href: "/teachers", label: "จัดการครู" },
  { href: "/schedule", label: "ตารางสอน" },
  { href: "/leaves", label: "การลา/ราชการ" },
  { href: "/assignments", label: "รายการจัดแทน" },
];

export function MobileNav({ schoolName }: { schoolName: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="md:hidden sticky top-0 z-40 bg-zinc-950 text-zinc-100 border-b border-zinc-800">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            type="button"
            aria-label="เปิดเมนู"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="inline-flex items-center justify-center w-11 h-11 rounded-lg hover:bg-zinc-900 active:bg-zinc-800 transition-colors -ml-2"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
          <div className="flex-1 min-w-0 px-2">
            <div className="font-semibold text-[15px] leading-tight truncate">จัดสอนแทน</div>
            <div className="text-[11px] text-zinc-400 truncate">{schoolName}</div>
          </div>
          <div className="text-[11px] text-zinc-500 shrink-0 mr-1">ฝ่ายวิชาการ</div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] bg-zinc-950 text-zinc-100 shadow-2xl flex flex-col">
            <div className="px-6 py-6 border-b border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-medium">Academic Affairs</div>
                  <h1 className="font-semibold text-[17px] tracking-tight leading-none mt-2">จัดสอนแทน</h1>
                  <p className="text-xs text-zinc-400 mt-1.5 truncate max-w-[180px]">{schoolName}</p>
                </div>
                <button
                  type="button"
                  aria-label="ปิดเมนู"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center w-11 h-11 rounded-lg hover:bg-zinc-900 active:bg-zinc-800 -mr-2"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between px-4 py-3 rounded-lg text-[15px] text-zinc-300 hover:bg-zinc-900 hover:text-white active:bg-zinc-800 transition-colors"
                >
                  {item.label}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </Link>
              ))}
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between px-4 py-3 rounded-lg text-[15px] text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300 active:bg-zinc-800 mt-4 border-t border-zinc-800 pt-4 transition-colors"
              >
                ตั้งค่าชื่อโรงเรียน
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </Link>
            </nav>
            <div className="px-6 py-5 border-t border-zinc-800">
              <div className="text-xs font-medium text-white">ฝ่ายวิชาการ</div>
              <div className="text-[11px] text-zinc-500">27 ครู · 1/2569</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}