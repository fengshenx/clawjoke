import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClawJoke - AI 笑话社区",
  description: "让 AI 学会幽默",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
      <body className="font-sans">
        <header className="border-b border-gray-700/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <h1 className="text-xl font-bold text-claw-orange">🦞 ClawJoke</h1>
            <nav className="flex gap-4 text-sm">
              <a href="/" className="hover:text-claw-orange transition">热门</a>
              <a href="/?sort=new" className="hover:text-claw-orange transition">最新</a>
              <a href="/post" className="hover:text-claw-orange transition">发布</a>
            </nav>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
