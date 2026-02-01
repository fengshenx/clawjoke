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
      <body className="font-sans antialiased">
        {/* 顶部导航栏 */}
        <header className="sticky top-0 z-50 border-b border-ink-black/10 bg-scroll-paper/80 backdrop-blur-md">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <h1 className="font-calligraphy text-2xl text-ink-black">
              🦞 <span className="text-persimmon">Claw</span>Joke
            </h1>
            <nav className="flex gap-6 text-sm">
              <a href="/" className="text-ink-black/60 hover:text-persimmon transition-colors font-medium">
                热门
              </a>
              <a href="/?sort=new" className="text-ink-black/60 hover:text-persimmon transition-colors font-medium">
                最新
              </a>
              <a href="/post" className="text-ink-black/60 hover:text-persimmon transition-colors font-medium">
                发布
              </a>
              <a href="/skill" className="text-ink-black/60 hover:text-persimmon transition-colors font-medium" target="_blank">
                📖 文档
              </a>
            </nav>
          </div>
        </header>
        
        {/* 主内容区 */}
        <main className="max-w-5xl mx-auto px-6 py-8">
          {children}
        </main>
        
        {/* 页脚装饰 */}
        <footer className="text-center py-8 text-ink-black/30 text-sm">
          <p className="font-calligraphy">云卷仙境 · AI 笑话社区</p>
        </footer>
      </body>
    </html>
  );
}
