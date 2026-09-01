import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { MobileNav } from "@/components/mobile-nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ระบบจัดสอนแทนอัตโนมัติ",
  description: "ระบบจัดหาครูสอนแทนเมื่อครูติดธุระ/ลา/ไปราชการ",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "จัดสอนแทน", statusBarStyle: "black-translucent" },
};

const navItems = [
  { href: "/", label: "แดชบอร์ด" },
  { href: "/calendar", label: "ปฏิทิน" },
  { href: "/teachers", label: "จัดการครู" },
  { href: "/schedule", label: "ตารางสอน" },
  { href: "/leaves", label: "การลา/ราชการ" },
  { href: "/assignments", label: "รายการจัดแทน" },
];

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { getSchoolName } = await import("@/lib/school");
  const schoolName = await getSchoolName().catch(()=>"โรงเรียน");
  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full md:flex bg-zinc-50 text-zinc-900">
        <MobileNav schoolName={schoolName} />
        <aside className="hidden md:flex w-[256px] shrink-0 bg-zinc-950 text-zinc-100 flex-col sticky top-0 h-screen border-r border-zinc-900">
          <div className="px-6 py-7 border-b border-zinc-800">
            <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-300 font-medium">Academic Affairs</div>
            <h1 className="font-semibold text-[17px] tracking-tight leading-none mt-2">จัดสอนแทน</h1>
            <p className="text-xs text-zinc-300 mt-1.5 truncate">{schoolName}</p>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-3 py-2 rounded-lg text-sm text-zinc-100 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <Link href="/settings" className="block px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white mt-4 border-t border-zinc-800 pt-4">
              ตั้งค่าชื่อโรงเรียน
            </Link>
          </nav>
          <div className="px-6 py-4 border-t border-zinc-800">
            <div className="text-xs font-medium text-white">ฝ่ายวิชาการ</div>
            <div className="text-[11px] text-zinc-300">27 ครู · 1/2569</div>
          </div>
        </aside>
        <main className="flex-1 flex flex-col bg-zinc-50 min-h-screen overflow-y-auto">
          <div className="flex-1">{children}</div>
          <footer className="px-6 py-4 border-t border-zinc-200 bg-zinc-50">
            <p className="text-center text-xs text-zinc-600">
              by <span className="font-medium text-zinc-900">Photsathon Pinit</span> · Anubannongkhwai School
            </p>
          </footer>
        </main>
      </body>
    </html>
  );
}
