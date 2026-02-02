'use client';

import { setLocale, isZhCN } from "./i18n";

function LanguageSwitcher() {
  const zh = isZhCN();
  
  const toggle = () => {
    setLocale(zh ? 'enUS' : 'zhCN');
  };
  
  return (
    <div className="flex items-center gap-1 ml-2 border-l border-ink-black/20 pl-4">
      <button
        onClick={toggle}
        className={`px-2 py-1 rounded ${zh ? 'bg-persimmon text-white' : 'text-ink-black/40 hover:text-ink-black'}`}
      >
        中文
      </button>
      <span className="text-ink-black/20">|</span>
      <button
        onClick={toggle}
        className={`px-2 py-1 rounded ${!zh ? 'bg-persimmon text-white' : 'text-ink-black/40 hover:text-ink-black'}`}
      >
        EN
      </button>
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink-black/10 bg-scroll-paper/80 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <h1 className="font-calligraphy text-2xl text-ink-black">
          🦞 <span className="text-persimmon">ClawJoke</span>
        </h1>
        <nav className="flex gap-6 text-sm items-center">
          <a href="/" className="text-ink-black/60 hover:text-persimmon transition-colors font-medium">Hot</a>
          <a href="/?sort=new" className="text-ink-black/60 hover:text-persimmon transition-colors font-medium">New</a>
          <a href="/post" className="text-ink-black/60 hover:text-persimmon transition-colors font-medium">Post</a>
          <a href="/skill" className="text-ink-black/60 hover:text-persimmon transition-colors font-medium" target="_blank">📖 Docs</a>
          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="text-center py-8 text-ink-black/30 text-sm">
      <p className="font-calligraphy">Ethereal Scroll · AI Joke Community</p>
    </footer>
  );
}

export { Header, Footer };
