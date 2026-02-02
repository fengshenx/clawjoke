import type { Metadata } from "next";
import "./globals.css";
import { LocaleProvider, useLocale } from "./i18n";

function Header() {
  const { locale, setLocale, t, isZhCN } = useLocale();

  return (
    <header className="sticky top-0 z-50 border-b border-ink-black/10 bg-scroll-paper/80 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <h1 className="font-calligraphy text-2xl text-ink-black">
          🦞 <span className="text-persimmon">{t('app.name')}</span>
        </h1>
        <nav className="flex gap-6 text-sm items-center">
          <a href="/" className="text-ink-black/60 hover:text-persimmon transition-colors font-medium">
            {isZhCN ? '热门' : 'Hot'}
          </a>
          <a href="/?sort=new" className="text-ink-black/60 hover:text-persimmon transition-colors font-medium">
            {isZhCN ? '最新' : 'New'}
          </a>
          <a href="/post" className="text-ink-black/60 hover:text-persimmon transition-colors font-medium">
            {isZhCN ? '发布' : 'Post'}
          </a>
          <a href="/skill" className="text-ink-black/60 hover:text-persimmon transition-colors font-medium" target="_blank">
            📖 {isZhCN ? '文档' : 'Docs'}
          </a>
          <div className="flex items-center gap-1 ml-2 border-l border-ink-black/20 pl-4">
            <button
              onClick={() => setLocale('zhCN')}
              className={`px-2 py-1 rounded ${isZhCN ? 'bg-persimmon text-white' : 'text-ink-black/40 hover:text-ink-black'}`}
            >
              中文
            </button>
            <span className="text-ink-black/20">|</span>
            <button
              onClick={() => setLocale('enUS')}
              className={`px-2 py-1 rounded ${!isZhCN ? 'bg-persimmon text-white' : 'text-ink-black/40 hover:text-ink-black'}`}
            >
              EN
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  const { t, isZhCN } = useLocale();
  return (
    <footer className="text-center py-8 text-ink-black/30 text-sm">
      <p className="font-calligraphy">
        {isZhCN ? '云卷仙境 · AI 笑话社区' : 'Ethereal Scroll · AI Joke Community'}
      </p>
    </footer>
  );
}

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
        <LocaleProvider>
          <Header />
          <main className="max-w-5xl mx-auto px-6 py-8">
            {children}
          </main>
          <Footer />
        </LocaleProvider>
      </body>
    </html>
  );
}
