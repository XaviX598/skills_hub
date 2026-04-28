import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import Link from "next/link";
import { SITE_URL } from "@/lib/site-url";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Universal Skills Hub",
  "description": "Directory for AI agent skills - Claude Code, OpenCode, Cursor, Codex, MCP. Discover, share, and install reusable skills for AI coding agents.",
  "url": SITE_URL,
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": `${SITE_URL}/skills?query={search_term_string}`
    },
    "query-input": "required name=search_term_string"
  },
  "about": {
    "@type": "Thing",
    "name": "AI Agent Skills",
    "description": "Reusable instructions, prompts, and workflows for AI coding agents like Claude Code, OpenCode"
  },
  "audience": {
    "@type": "Audience",
    "name": "Software Developers",
    "description": "Developers using AI coding assistants"
  },
  "provider": {
    "@type": "Organization",
    "name": "Universal Skills Hub",
    "url": SITE_URL
  },
  "inLanguage": ["en"],
  "license": "https://github.com/xpressdev/universal-skills-hub",
  "keywords": "AI agent skills, Claude Code, OpenCode, Cursor, Windsurf, Codex, MCP, Cline, Continue, AI coding, developer skills"
};

export const metadata: Metadata = {
  title: {
    default: "Universal Skills Hub",
    template: "%s | Universal Skills Hub",
  },
  metadataBase: new URL(SITE_URL),
  description: "Search, compare, and publish reusable AI agent skills for Claude Code, OpenCode, Cursor, GitHub Copilot, Windsurf, Codex, Gemini CLI, Cline, Continue, and more.",
  keywords: ["AI agent skills", "Claude Code skills", "OpenCode skills", "Cursor skills", "MCP skills", "Codex skills", "Windsurf skills", "AI coding agents", "developer skills", "AI instructions"],
  authors: [{ name: "Xpress Developer" }],
  creator: "Xpress Developer",
  publisher: "Universal Skills Hub",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Universal Skills Hub",
    title: "Universal Skills Hub - AI Agent Skills Directory",
    description: "Search and discover reusable AI agent skills for Claude Code, OpenCode, Cursor, Windsurf, Codex, MCP, and more.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Universal Skills Hub - AI Agent Skills Directory",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Universal Skills Hub - AI Agent Skills Directory",
    description: "Discover and install skills for Claude Code, OpenCode, Cursor, Windsurf, Codex, MCP, Cline, and Continue.",
    creator: "@xpressdev",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": 0,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
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

const stripHydrationScript = `
(function() {
  var shouldStrip = function(name) {
    return name === "bis_skin_checked" ||
           name === "bis_register" ||
           name.startsWith("bis_") ||
           name.startsWith("__processed_");
  };

  var originalSetAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function(name, value) {
    if (shouldStrip(String(name))) return;
    return originalSetAttribute.call(this, name, value);
  };

  var originalSetAttributeNS = Element.prototype.setAttributeNS;
  Element.prototype.setAttributeNS = function(namespace, name, value) {
    if (shouldStrip(String(name))) return;
    return originalSetAttributeNS.call(this, namespace, name, value);
  };

  var stripElement = function(node) {
    if (!node || node.nodeType !== 1) return;
    var attrs = Array.from(node.attributes);
    for (var i = 0; i < attrs.length; i++) {
      if (shouldStrip(attrs[i].name)) {
        node.removeAttribute(attrs[i].name);
      }
    }
  };

  var stripTree = function(root) {
    if (!root || ![1, 9, 11].includes(root.nodeType)) return;
    stripElement(root);
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    var node = walker.nextNode();
    while (node) {
      stripElement(node);
      node = walker.nextNode();
    }
  };

  var clean = function() {
    stripTree(document.documentElement);
  };

  clean();
  document.addEventListener("DOMContentLoaded", clean, { once: true });
  requestAnimationFrame(clean);
  var interval = window.setInterval(clean, 50);

  var observer = new MutationObserver(function(mutations) {
    for (var i = 0; i < mutations.length; i++) {
      var mutation = mutations[i];
      if (mutation.type === "attributes") {
        stripElement(mutation.target);
      }
      for (var j = 0; j < mutation.addedNodes.length; j++) {
        stripTree(mutation.addedNodes[j]);
      }
    }
  });

  observer.observe(document.documentElement, {
    attributes: true,
    childList: true,
    subtree: true,
  });

  var stop = function() {
    clean();
    window.clearInterval(interval);
    observer.disconnect();
  };

  window.addEventListener("load", function() { window.setTimeout(stop, 30000); }, { once: true });
  window.setTimeout(stop, 30000);
})();
`;

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
      <head />
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: stripHydrationScript }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
          }}
        />
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
