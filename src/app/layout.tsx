import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
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
        <Script id="strip-extension-hydration-attrs" strategy="beforeInteractive">
          {`
            (() => {
              const shouldStrip = (name) =>
                name === "bis_skin_checked" ||
                name === "bis_register" ||
                name.startsWith("bis_") ||
                name.startsWith("__processed_");

              const originalSetAttribute = Element.prototype.setAttribute;
              Element.prototype.setAttribute = function(name, value) {
                if (shouldStrip(String(name))) return;
                return originalSetAttribute.call(this, name, value);
              };

              const originalSetAttributeNS = Element.prototype.setAttributeNS;
              Element.prototype.setAttributeNS = function(namespace, name, value) {
                if (shouldStrip(String(name))) return;
                return originalSetAttributeNS.call(this, namespace, name, value);
              };

              const stripElement = (node) => {
                if (!node || node.nodeType !== 1) return;
                for (const attr of Array.from(node.attributes)) {
                  if (shouldStrip(attr.name)) {
                    node.removeAttribute(attr.name);
                  }
                }
              };

              const stripTree = (root) => {
                if (!root || ![1, 9, 11].includes(root.nodeType)) return;
                stripElement(root);
                const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
                let node = walker.nextNode();
                while (node) {
                  stripElement(node);
                  node = walker.nextNode();
                }
              };

              const clean = () => stripTree(document.documentElement);

              clean();
              document.addEventListener("DOMContentLoaded", clean, { once: true });
              requestAnimationFrame(clean);
              const interval = window.setInterval(clean, 50);

              const observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                  if (mutation.type === "attributes") {
                    stripElement(mutation.target);
                  }
                  for (const node of mutation.addedNodes) {
                    stripTree(node);
                  }
                }
              });

              observer.observe(document.documentElement, {
                attributes: true,
                childList: true,
                subtree: true,
              });

              const stop = () => {
                clean();
                window.clearInterval(interval);
                observer.disconnect();
              };

              window.addEventListener("load", () => window.setTimeout(stop, 30000), { once: true });
              window.setTimeout(stop, 30000);
            })();
          `}
        </Script>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
