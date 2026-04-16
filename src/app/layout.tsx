import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
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
  title: "Universal Skills Hub",
  description: "Search, compare, and publish reusable AI agent skills for Claude Code, OpenCode, Cursor, GitHub Copilot, Windsurf, Codex, Gemini CLI, Cline, Continue, and more.",
};

function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0B0B0B] py-8">
      <div className="mx-auto max-w-7xl px-4 text-center">
        <p className="text-sm text-[var(--text-muted)]">
          Built by{" "}
          <Link 
            href="https://portfolio-xavier-aguilar.vercel.app" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--accent-cyan)] hover:underline"
          >
            Xpress Developer
          </Link>
        </p>
      </div>
    </footer>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
