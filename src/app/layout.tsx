import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

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
      <body className="min-h-full flex bg-zinc-50 text-zinc-900">
        <aside className="w-[256px] shrink-0 bg-zinc-950 text-zinc-100 flex flex-col sticky top-0 h-screen border-r border-zinc-900">
          <div className="px-6 py-7 border-b border-zinc-800">
            <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-medium">Academic Affairs</div>
            <h1 className="font-semibold text-[17px] tracking-tight leading-none mt-2">จัดสอนแทน</h1>
            <p className="text-xs text-zinc-400 mt-1.5 truncate">{schoolName}</p>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <Link href="/settings" className="block px-3 py-2 rounded-lg text-sm text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300 mt-4 border-t border-zinc-800 pt-4">
              ตั้งค่าชื่อโรงเรียน
            </Link>
          </nav>
          <div className="px-6 py-4 border-t border-zinc-800">
            <div className="text-xs font-medium text-white">ฝ่ายวิชาการ</div>
            <div className="text-[11px] text-zinc-500">27 ครู · 1/2569</div>
          </div>
        </aside>
        <main className="flex-1 overflow-y-auto bg-zinc-50 min-h-screen">{children}</main>
      </body>
    </html>
  );
}
