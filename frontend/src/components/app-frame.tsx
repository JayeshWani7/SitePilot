"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Theme = "dark-graphite" | "dark-indigo" | "dark-emerald" | "light-minimal";

const THEMES: Theme[] = [
  "dark-graphite",
  "dark-indigo",
  "dark-emerald",
  "light-minimal",
];

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/lifecycle", label: "Lifecycle" },
  { href: "/analytics", label: "Analytics" },
  { href: "/governance", label: "Governance" },
];

export function AppFrame({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark-graphite");
  const pathname = usePathname();

  useEffect(() => {
    const savedTheme = localStorage.getItem("sitepilot.theme") as Theme | null;
    const initial =
      savedTheme && THEMES.includes(savedTheme) ? savedTheme : "dark-graphite";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  function onThemeChange(value: string) {
    const nextTheme = value as Theme;
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("sitepilot.theme", nextTheme);
  }

  return (
    <div className="sp-shell">
      <header className="sp-topbar">
        <div className="sp-brand-wrap">
          <div className="sp-brand-dot" />
          <div>
            <h1>SitePilot</h1>
            <p>Autonomous Business Operating System for Websites</p>
          </div>
        </div>

        <div className="sp-actions">
          <nav className="sp-nav">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`sp-nav-link ${pathname === item.href ? "is-active" : ""}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <label className="sp-theme-picker">
            {/* <span>Theme</span> */}
            <select
              value={theme}
              onChange={(e) => onThemeChange(e.target.value)}
              suppressHydrationWarning
            >
              <option value="dark-indigo">Dark Indigo</option>
              <option value="dark-emerald">Dark Emerald</option>
              <option value="dark-graphite">Dark Graphite</option>
              <option value="light-minimal">Light Minimal</option>
            </select>
          </label>
        </div>
      </header>

      <main>{children}</main>

      <footer className="sp-footer">
        <div>
          <strong>SitePilot</strong>
          <p>Turn websites into self-operating business systems.</p>
        </div>
        <div className="sp-footer-links">
          <Link href="/">Overview</Link>
          <Link href="/analytics">Readiness</Link>
          <Link href="/governance">AI Decisions</Link>
        </div>
      </footer>
    </div>
  );
}
