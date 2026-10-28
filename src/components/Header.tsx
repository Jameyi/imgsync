"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, Moon, Sun, X } from "lucide-react";

function BrandMark() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true" className="brand-mark-svg">
      <rect width="28" height="28" rx="7" fill="var(--blue)" />
      <path d="M7 7h7v7H7zM14 14h7v7h-7z" fill="var(--background)" opacity=".9" />
      <path d="M14 7h7v7h-7zM7 14h7v7H7z" fill="var(--surface)" opacity=".92" />
    </svg>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  function toggleTheme() {
    const dark =
      document.documentElement.dataset.theme === "dark" ||
      (!document.documentElement.dataset.theme &&
        matchMedia("(prefers-color-scheme: dark)").matches);
    const next = !dark;
    document.documentElement.dataset.theme = next ? "dark" : "light";
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  }

  const navigation = [
    ["Tools", "/tools"],
    ["Guides", "/articles"],
    ["Docs", "/docs"],
    ["About", "/about"],
  ];

  return (
    <header className="site-head">
      <div className="wrap head-inner">
        <Link className="brand" href="/" aria-label="ImgSync home">
          <BrandMark />
          <span className="brand-name">ImgSync</span>
          <span className="brand-sub">/ studio</span>
        </Link>
        <nav
          id="main-navigation"
          className={open ? "nav is-open" : "nav"}
          aria-label="Main navigation"
        >
          {navigation.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              aria-current={pathname.startsWith(href) ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="head-actions">
          <button
            className="icon-btn"
            onClick={toggleTheme}
            aria-label="Toggle color theme"
          >
            <Moon size={17} className="icon-moon" />
            <Sun size={17} className="icon-sun" />
          </button>
          <Link className="btn btn-primary header-start" href="/tools/remove-white-background">
            Start free
            <span className="arr" aria-hidden="true">→</span>
          </Link>
          <button
            className="icon-btn menu-button"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-controls="main-navigation"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
}
