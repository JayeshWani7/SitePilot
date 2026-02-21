"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/context/AuthContext";

type Theme = "dark-graphite" | "dark-indigo" | "dark-emerald" | "light-minimal";
const THEMES: Theme[] = ["dark-graphite", "dark-indigo", "dark-emerald", "light-minimal"];
const THEME_LABELS: Record<Theme, string> = {
  "dark-graphite": "Dark Graphite",
  "dark-indigo": "Dark Indigo",
  "dark-emerald": "Dark Emerald",
  "light-minimal": "Light",
};

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "⌂" },
  { href: "/projects", label: "Projects", icon: "📁" },
  { href: "/lifecycle", label: "Lifecycle", icon: "🔄" },
  { href: "/analytics", label: "Analytics", icon: "📈" },
  { href: "/governance", label: "Governance", icon: "⚖️" },
];

function NavContent({ theme, onThemeChange }: { theme: Theme; onThemeChange: (v: string) => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, currentTenant, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  function handleLogout() { logout(); router.push("/login"); }

  // Close menu on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = user?.firstName
    ? `${user.firstName[0]}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : (user?.email?.[0] ?? "?").toUpperCase();

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName ?? ""}`.trim()
    : user?.email ?? "";

  return (
    <div style={{
      width: "100%",
      background: "color-mix(in srgb, var(--bg-elevated) 85%, transparent)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderBottom: "1px solid color-mix(in srgb, var(--border) 80%, transparent)",
      boxShadow: "0 4px 24px rgba(0,0,0,0.22)",
      position: "sticky",
      top: 0,
      zIndex: 100,
    }}>
      {/* ── Row 1: Brand | User controls ─────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 28px", height: 56, borderBottom: "1px solid color-mix(in srgb, var(--border) 50%, transparent)",
      }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 10, height: 10, borderRadius: "50%",
            background: "linear-gradient(135deg, var(--primary), var(--accent))",
            boxShadow: "0 0 0 4px color-mix(in srgb, var(--primary) 22%, transparent)",
            flexShrink: 0,
          }} />
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontSize: "1.18rem", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)" }}>
              SitePilot
            </span>
            {currentTenant && (
              <>
                <span style={{ color: "var(--border)", fontWeight: 300, fontSize: "1rem", margin: "0 2px" }}>:</span>
                <span style={{
                  fontSize: "0.9rem", fontWeight: 600,
                  background: "linear-gradient(90deg, var(--primary), var(--accent))",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                }}>
                  {currentTenant.display_name}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Theme switcher — icon cycle */}
          <div style={{ display: "flex", gap: 8 }}>
            {THEMES.map(t => (
              <button key={t} onClick={() => onThemeChange(t)} title={THEME_LABELS[t]} style={{
                width: 8, height: 8, borderRadius: "50%", border: "none", cursor: "pointer", padding: 0,
                background: t === "dark-indigo" ? "#6a7bfd"
                  : t === "dark-emerald" ? "#2ec89f"
                    : t === "light-minimal" ? "#d8e0ee"
                      : "#555e72",
                outline: theme === t ? "2px solid var(--accent)" : "none",
                outlineOffset: 2,
                transform: theme === t ? "scale(1.4)" : "scale(1)",
                transition: "transform 0.15s",
              }} />
            ))}
          </div>

          {/* User avatar + dropdown */}
          {user && (
            <div ref={menuRef} style={{ position: "relative" }}>
              <button onClick={() => setUserMenuOpen(v => !v)} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "5px 10px 5px 5px",
                borderRadius: 999, border: "1px solid var(--border)", cursor: "pointer",
                background: userMenuOpen
                  ? "color-mix(in srgb, var(--primary) 15%, var(--surface))"
                  : "var(--surface)",
                transition: "all 0.15s",
              }}>
                {/* Avatar circle */}
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg, var(--primary), var(--accent))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.72rem", fontWeight: 800, color: "#fff",
                }}>
                  {initials}
                </div>
                <div style={{ textAlign: "left", lineHeight: 1.2 }}>
                  <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap" }}>
                    {displayName}
                  </p>
                  <p style={{ margin: 0, fontSize: "0.7rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    {user.email}
                  </p>
                </div>
                <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginLeft: 2 }}>
                  {userMenuOpen ? "▲" : "▼"}
                </span>
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <div style={{
                  position: "absolute", top: "calc(100% + 8px)", right: 0, width: 210,
                  background: "var(--surface)", borderRadius: 12, border: "1px solid var(--border)",
                  boxShadow: "0 12px 32px rgba(0,0,0,0.28)", overflow: "hidden", zIndex: 200,
                  animation: "fadeSlideDown 0.15s ease",
                }}>
                  <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", background: "color-mix(in srgb, var(--primary) 6%, transparent)" }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: "50%", margin: "0 auto 8px",
                      background: "linear-gradient(135deg, var(--primary), var(--accent))",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "1rem", fontWeight: 800, color: "#fff",
                    }}>{initials}</div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: "0.88rem", textAlign: "center", color: "var(--text)" }}>{displayName}</p>
                    <p style={{ margin: "2px 0 0", fontSize: "0.75rem", textAlign: "center", color: "var(--text-muted)" }}>{user.email}</p>
                    {currentTenant && (
                      <p style={{
                        margin: "6px 0 0", fontSize: "0.72rem", textAlign: "center", textTransform: "capitalize",
                        color: "var(--primary)", fontWeight: 700
                      }}>
                        {currentTenant.role} @ {currentTenant.display_name}
                      </p>
                    )}
                  </div>
                  <div style={{ padding: 8 }}>
                    <button onClick={handleLogout} style={{
                      width: "100%", padding: "9px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                      background: "transparent", textAlign: "left", fontSize: "0.84rem", fontWeight: 600,
                      color: "var(--danger)", display: "flex", alignItems: "center", gap: 8, transition: "background 0.1s",
                    }}
                      onMouseEnter={e => (e.currentTarget.style.background = "color-mix(in srgb, var(--danger) 10%, transparent)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <span>⎋</span> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Row 2: Nav links ─────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 2, padding: "0 24px", height: 44 }}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
          return (
            <Link key={item.href} href={item.href} style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "5px 13px", borderRadius: 8, fontSize: "0.84rem", fontWeight: active ? 700 : 500,
              color: active ? "var(--text)" : "var(--text-muted)",
              background: active
                ? "color-mix(in srgb, var(--primary) 18%, var(--surface))"
                : "transparent",
              borderBottom: active ? "2px solid var(--primary)" : "2px solid transparent",
              textDecoration: "none", transition: "all 0.15s", letterSpacing: "0.01em",
            }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.background = "color-mix(in srgb, var(--border) 30%, transparent)"; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "transparent"; } }}
            >
              <span style={{ fontSize: "0.9rem" }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}

        {/* Separator */}
        <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 6px", flexShrink: 0 }} />

        {/* Builder — accent styled */}
        {(() => {
          const active = pathname.startsWith("/builder");
          return (
            <Link href="/builder" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "5px 14px", borderRadius: 8, fontSize: "0.84rem", fontWeight: 700,
              color: active ? "#fff" : "var(--accent)",
              background: active
                ? "linear-gradient(135deg, var(--primary), var(--accent))"
                : "color-mix(in srgb, var(--accent) 10%, transparent)",
              border: "1px solid",
              borderColor: active ? "transparent" : "color-mix(in srgb, var(--accent) 35%, var(--border))",
              textDecoration: "none", transition: "all 0.18s",
              boxShadow: active ? "0 2px 12px color-mix(in srgb, var(--accent) 30%, transparent)" : "none",
            }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "color-mix(in srgb, var(--accent) 20%, transparent)"; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "color-mix(in srgb, var(--accent) 10%, transparent)"; } }}
            >
              🌐 Builder
            </Link>
          );
        })()}
      </div>
    </div>
  );
}

export function AppFrame({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark-graphite");

  useEffect(() => {
    const saved = localStorage.getItem("sitepilot.theme") as Theme | null;
    const initial = saved && THEMES.includes(saved) ? saved : "dark-graphite";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  function onThemeChange(value: string) {
    const next = value as Theme;
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("sitepilot.theme", next);
  }

  return (
    <AuthProvider>
      <style>{`
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="sp-shell">
        <NavContent theme={theme} onThemeChange={onThemeChange} />
        <main style={{ padding: "0 24px 24px" }}>{children}</main>
        <footer className="sp-footer" style={{ padding: "20px 24px" }}>
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
    </AuthProvider>
  );
}
