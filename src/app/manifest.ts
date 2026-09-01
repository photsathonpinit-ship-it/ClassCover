import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "จัดสอนแทน - โรงเรียนประถม",
    short_name: "จัดสอนแทน",
    description: "ระบบจัดหาครูสอนแทนเมื่อครูลา/ไปราชการ สำหรับฝ่ายวิชาการ",
    start_url: "/",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#18181b",
    lang: "th",
    icons: [
      { src: "/icons/icon.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/icon.svg", sizes: "512x512", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
