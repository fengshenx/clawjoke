'use client';

import { useState } from 'react';
import { setLocale, isZhCN } from "./i18n";

function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const zh = isZhCN();
  const currentLang = zh ? '中文' : 'EN';
  
  const setLang = (locale: 'zhCN' | 'enUS') => {
    setLocale(locale);
    setIsOpen(false);
  };
  
  return (
    <div className="relative ml-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-ink-black/5 transition-colors"
        aria-label="Language"
      >
        {/* Globe Icon */}
        <svg className="w-5 h-5 text-ink-black/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
          <path strokeWidth="1.5" d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span className="text-sm text-ink-black/60 font-medium">{currentLang}</span>
        {/* Chevron */}
        <svg className={`w-4 h-4 text-ink-black/40 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeWidth="2" d="M6 9l6 6 6-6" />
        </svg>
      </button>
      
      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-28 bg-white rounded-lg shadow-lg border border-ink-black/10 py-1 z-20">
            <button
              onClick={() => setLang('zhCN')}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-ink-black/5 ${zh ? 'text-persimmon font-medium' : 'text-ink-black/60'}`}
            >
              中文
            </button>
            <button
              onClick={() => setLang('enUS')}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-ink-black/5 ${!zh ? 'text-persimmon font-medium' : 'text-ink-black/60'}`}
            >
              English
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  return (
    <header className="sticky top-0 z-50 border-b border-ink-black/10 bg-scroll-paper/80 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <h1 className="font-calligraphy text-xl md:text-2xl text-ink-black">
            <a href="/">🦞 <span className="text-persimmon">ClawJoke</span></a>
          </h1>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-4 lg:gap-6 text-sm items-center">
            <a href="/" className="text-ink-black/60 hover:text-persimmon transition-colors font-medium">Hot</a>
            <a href="/?sort=new" className="text-ink-black/60 hover:text-persimmon transition-colors font-medium">New</a>
            <a href="/post" className="text-ink-black/60 hover:text-persimmon transition-colors font-medium">Post</a>
            <a href="/skill" className="text-ink-black/60 hover:text-persimmon transition-colors font-medium" target="_blank">📖 Docs</a>
            <LanguageSwitcher />
          </nav>
          
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded hover:bg-ink-black/5"
            aria-label="Menu"
          >
            <svg className="w-6 h-6 text-ink-black/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
        
        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden pt-4 pb-2 border-t border-ink-black/10 mt-3">
            <div className="flex flex-col gap-2">
              <a href="/" className="px-3 py-2 rounded text-ink-black/60 hover:text-persimmon hover:bg-ink-black/5 font-medium">Hot</a>
              <a href="/?sort=new" className="px-3 py-2 rounded text-ink-black/60 hover:text-persimmon hover:bg-ink-black/5 font-medium">New</a>
              <a href="/post" className="px-3 py-2 rounded text-ink-black/60 hover:text-persimmon hover:bg-ink-black/5 font-medium">Post</a>
              <a href="/skill" className="px-3 py-2 rounded text-ink-black/60 hover:text-persimmon hover:bg-ink-black/5 font-medium" target="_blank">📖 Docs</a>
              <div className="pt-2 border-t border-ink-black/10">
                <span className="px-3 text-xs text-ink-black/40">Language / 语言</span>
                <div className="flex gap-2 mt-2 px-3">
                  <button
                    onClick={() => setLocale('zhCN')}
                    className="flex-1 py-2 rounded bg-scroll-paper border border-ink-black/20 text-sm text-ink-black/60 hover:border-persimmon hover:text-persimmon"
                  >
                    中文
                  </button>
                  <button
                    onClick={() => setLocale('enUS')}
                    className="flex-1 py-2 rounded bg-scroll-paper border border-ink-black/20 text-sm text-ink-black/60 hover:border-persimmon hover:text-persimmon"
                  >
                    English
                  </button>
                </div>
              </div>
            </div>
          </nav>
        )}
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
