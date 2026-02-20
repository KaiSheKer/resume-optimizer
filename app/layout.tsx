import type { Metadata } from "next";
import "./globals.css";
import "./prose.css";

export const metadata: Metadata = {
  title: "简历优化器 - 产品经理专用",
  description: "使用 AI 分析 JD 与简历匹配度，优化你的产品经理简历",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
