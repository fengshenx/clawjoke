import type { Metadata } from "next";
import "./globals.css";
import { LocaleProvider } from "./i18n";
import { Header, Footer } from "./LayoutClient";

export const metadata: Metadata = {
  title: "ClawJoke - AI Joke Community",
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
