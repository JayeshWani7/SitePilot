"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

const FEATURES = [
  {
    icon: "🤖",
    title: "Autonomous Operations",
    desc: "SitePilot runs your website like a business — making decisions, optimising content, and responding to traffic patterns without manual intervention.",
  },
  {
    icon: "📊",
    title: "Real-Time Analytics",
    desc: "Live dashboards covering SEO readiness, conversion health, traffic growth, and brand consistency — all in one place.",
  },
  {
    icon: "🔐",
    title: "Multi-Tenant Security",
    desc: "Enterprise-grade row-level security with full tenant isolation. Every team's data stays separate with zero cross-tenant leakage.",
  },
  {
    icon: "⚡",
    title: "AI Governance",
    desc: "Every autonomous action is logged, auditable, and explainable. You stay in control while the AI does the heavy lifting.",
  },
  {
    icon: "🎯",
    title: "Lifecycle Intelligence",
    desc: "Track your site from onboarding to monetisation with eight intelligent stages that adapt to your growth trajectory.",
  },
  {
    icon: "🚀",
    title: "Instant Scaling",
    desc: "From a solo project to an agency managing hundreds of tenants — SitePilot scales horizontally with no configuration required.",
  },
];

const METRICS = [
  { value: "10×", label: "Faster Launch" },
  { value: "98%", label: "Uptime SLA" },
  { value: "40%", label: "More Conversions" },
  { value: "5 min", label: "Setup Time" },
];

const TESTIMONIALS = [
  {
    quote: "SitePilot cut our time-to-launch from three weeks to two days. The AI governance feature alone is worth the switch.",
    name: "Priya Mehta",
    role: "CTO, LaunchBridge",
    avatar: "P",
    color: "#6366f1",
  },
  {
    quote: "Managing 60 client sites used to be chaos. Now everything is isolated, monitored, and self-healing. Incredible product.",
    name: "Marcus Cole",
    role: "Agency Owner, WebFront",
    avatar: "M",
    color: "#22d3ee",
  },
  {
    quote: "The analytics and lifecycle tracking gave us visibility we never had before. We hit monetisation stage in under a month.",
    name: "Sana Qureshi",
    role: "Head of Growth, Novu",
    avatar: "S",
    color: "#f4b942",
  },
];

export default function HomePage() {
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactStatus, setContactStatus] = useState<"idle" | "sent">("idle");

  const handleContact = (e: FormEvent) => {
    e.preventDefault();
    // Simulate send
    setContactStatus("sent");
    setContactName("");
    setContactEmail("");
    setContactMessage("");
    setTimeout(() => setContactStatus("idle"), 4000);
  };

  return (
    <div style={{ overflowX: "hidden" }}>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section
        style={{
          minHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "80px 24px 60px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow orbs */}
        <div style={{
          position: "absolute", top: "10%", left: "15%",
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, color-mix(in srgb, var(--primary) 18%, transparent), transparent 70%)",
          filter: "blur(60px)", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "5%", right: "10%",
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, color-mix(in srgb, var(--accent) 14%, transparent), transparent 70%)",
          filter: "blur(60px)", pointerEvents: "none",
        }} />

        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "6px 16px", borderRadius: 999,
          border: "1px solid color-mix(in srgb, var(--primary) 50%, var(--border))",
          background: "color-mix(in srgb, var(--primary) 10%, transparent)",
          fontSize: "0.8rem", color: "var(--primary)", fontWeight: 600,
          marginBottom: 28, letterSpacing: "0.04em",
        }}>
          <span>✦</span> Autonomous Business Operating System
        </div>

        <h1 style={{
          fontSize: "clamp(2.4rem, 6vw, 4.5rem)",
          fontWeight: 800,
          lineHeight: 1.1,
          margin: "0 0 24px",
          maxWidth: 780,
          background: "linear-gradient(135deg, var(--text) 0%, color-mix(in srgb, var(--primary) 80%, var(--text)) 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>
          Your Website,<br />Running on Autopilot
        </h1>

        <p style={{
          fontSize: "clamp(1rem, 2vw, 1.2rem)",
          color: "var(--text-muted)",
          maxWidth: 620,
          lineHeight: 1.7,
          margin: "0 0 40px",
        }}>
          SitePilot intelligently manages your web presence — handling SEO, content, analytics,
          and operations autonomously so your team can focus on what matters.
        </p>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
          <Link
            href="/signup"
            className="sp-btn sp-primary"
            style={{ padding: "14px 32px", fontSize: "1rem", fontWeight: 700, borderRadius: 999 }}
          >
            Get Started Free →
          </Link>
          <Link
            href="/dashboard"
            className="sp-btn"
            style={{
              padding: "14px 32px", fontSize: "1rem", borderRadius: 999,
              border: "1px solid var(--border)",
              background: "color-mix(in srgb, var(--surface) 60%, transparent)",
            }}
          >
            View Dashboard
          </Link>
        </div>

        {/* Hero stat bar */}
        <div style={{
          display: "flex", gap: 40, marginTop: 64, flexWrap: "wrap",
          justifyContent: "center",
        }}>
          {METRICS.map((m) => (
            <div key={m.label} style={{ textAlign: "center" }}>
              <p style={{
                margin: 0, fontSize: "2rem", fontWeight: 800,
                background: "linear-gradient(135deg, var(--primary), var(--accent))",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>{m.value}</p>
              <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 500 }}>
                {m.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHY SITEPILOT ────────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <span style={{
            display: "inline-block", padding: "4px 14px", borderRadius: 999,
            background: "color-mix(in srgb, var(--accent) 12%, transparent)",
            border: "1px solid color-mix(in srgb, var(--accent) 40%, var(--border))",
            color: "var(--accent)", fontSize: "0.78rem", fontWeight: 600,
            letterSpacing: "0.05em", marginBottom: 16, textTransform: "uppercase",
          }}>Why SitePilot</span>
          <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800, margin: "0 0 16px" }}>
            Everything your site needs,<br />handled automatically
          </h2>
          <p style={{ color: "var(--text-muted)", maxWidth: 520, margin: "0 auto", fontSize: "1rem", lineHeight: 1.7 }}>
            Stop juggling tools. SitePilot unifies operations, intelligence, and governance in a single autonomous platform.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 20,
        }}>
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="sp-card"
              style={{
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                cursor: "default",
                borderTop: `2px solid ${i % 2 === 0 ? "var(--primary)" : "var(--accent)"}`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 16px 40px rgba(0,0,0,0.25)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLElement).style.boxShadow = "";
              }}
            >
              <div style={{
                fontSize: "2rem", marginBottom: 14,
                width: 52, height: 52, borderRadius: 14,
                background: i % 2 === 0
                  ? "color-mix(in srgb, var(--primary) 15%, transparent)"
                  : "color-mix(in srgb, var(--accent) 15%, transparent)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {f.icon}
              </div>
              <h3 style={{ margin: "0 0 10px", fontSize: "1.05rem", fontWeight: 700 }}>{f.title}</h3>
              <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SOCIAL PROOF / TESTIMONIALS ──────────────────────────────── */}
      <section style={{
        padding: "80px 24px",
        background: "color-mix(in srgb, var(--surface) 60%, transparent)",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)", fontWeight: 800, margin: "0 0 12px" }}>
              Trusted by builders worldwide
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
              Teams from startups to agencies ship smarter with SitePilot.
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
          }}>
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="sp-card" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <p style={{
                  margin: 0, fontSize: "0.95rem", lineHeight: 1.7,
                  color: "var(--text)", fontStyle: "italic",
                }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: "auto" }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                    background: `linear-gradient(135deg, ${t.color}, var(--primary))`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 800, fontSize: "1rem", color: "#fff",
                  }}>
                    {t.avatar}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: "0.9rem" }}>{t.name}</p>
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px", maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
        <span style={{
          display: "inline-block", padding: "4px 14px", borderRadius: 999,
          background: "color-mix(in srgb, var(--primary) 12%, transparent)",
          border: "1px solid color-mix(in srgb, var(--primary) 40%, var(--border))",
          color: "var(--primary)", fontSize: "0.78rem", fontWeight: 600,
          letterSpacing: "0.05em", marginBottom: 16, textTransform: "uppercase",
        }}>How it works</span>
        <h2 style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)", fontWeight: 800, margin: "0 0 56px" }}>
          Up and running in minutes
        </h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 0,
          position: "relative",
        }}>
          {[
            { step: "01", title: "Sign up", desc: "Create your account and set up your organisation in under 5 minutes." },
            { step: "02", title: "Connect", desc: "Add your domain, invite team members, and configure your subscription plan." },
            { step: "03", title: "Launch", desc: "SitePilot takes over — monitoring, optimising, and reporting autonomously." },
            { step: "04", title: "Scale", desc: "Add tenants, track lifecycle stages, and grow without the operational overhead." },
          ].map((item, i) => (
            <div key={item.step} style={{
              padding: "28px 24px",
              borderLeft: i > 0 ? "1px solid var(--border)" : "none",
              position: "relative",
            }}>
              <p style={{
                margin: "0 0 12px",
                fontSize: "2.5rem", fontWeight: 800, lineHeight: 1,
                background: "linear-gradient(135deg, var(--primary), var(--accent))",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                opacity: 0.7,
              }}>{item.step}</p>
              <h3 style={{ margin: "0 0 8px", fontWeight: 700 }}>{item.title}</h3>
              <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.88rem", lineHeight: 1.65 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CONTACT ──────────────────────────────────────────────────── */}
      <section
        id="contact"
        style={{
          padding: "80px 24px",
          background: "color-mix(in srgb, var(--surface) 60%, transparent)",
          borderTop: "1px solid var(--border)",
        }}
      >
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <span style={{
              display: "inline-block", padding: "4px 14px", borderRadius: 999,
              background: "color-mix(in srgb, var(--accent) 12%, transparent)",
              border: "1px solid color-mix(in srgb, var(--accent) 40%, var(--border))",
              color: "var(--accent)", fontSize: "0.78rem", fontWeight: 600,
              letterSpacing: "0.05em", marginBottom: 16, textTransform: "uppercase",
            }}>Contact Us</span>
            <h2 style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)", fontWeight: 800, margin: "0 0 12px" }}>
              Let&apos;s build something together
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.7 }}>
              Have questions, partnership ideas, or want a custom demo? Drop us a message and we&apos;ll get back within 24 hours.
            </p>
          </div>

          <div className="sp-card">
            {contactStatus === "sent" ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ fontSize: "3rem", marginBottom: 16 }}>✅</div>
                <h3 style={{ margin: "0 0 8px" }}>Message sent!</h3>
                <p style={{ color: "var(--text-muted)", margin: 0 }}>
                  We&apos;ll get back to you within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleContact} className="sp-form">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <label>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>
                      Your name
                    </span>
                    <input
                      type="text"
                      placeholder="Jane Doe"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                    />
                  </label>
                  <label>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>
                      Email address
                    </span>
                    <input
                      type="email"
                      placeholder="you@company.com"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                    />
                  </label>
                </div>
                <label>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>
                    Message
                  </span>
                  <textarea
                    placeholder="Tell us what you're building…"
                    required
                    rows={5}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    style={{
                      width: "100%", resize: "vertical", minHeight: 120,
                      padding: "10px 14px", borderRadius: 10,
                      border: "1px solid var(--border)",
                      background: "var(--bg-elevated)",
                      color: "var(--text)", fontSize: "0.95rem",
                      fontFamily: "inherit",
                    }}
                  />
                </label>
                <button
                  type="submit"
                  className="sp-btn sp-primary"
                  style={{ width: "100%", padding: "13px", fontSize: "1rem", fontWeight: 700, borderRadius: 999, marginTop: 4 }}
                >
                  Send Message →
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────────────── */}
      <section style={{
        padding: "80px 24px",
        textAlign: "center",
        background: "linear-gradient(135deg, color-mix(in srgb, var(--primary) 12%, transparent), color-mix(in srgb, var(--accent) 8%, transparent))",
        borderTop: "1px solid color-mix(in srgb, var(--primary) 30%, var(--border))",
      }}>
        <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800, margin: "0 0 16px" }}>
          Ready to put your site on autopilot?
        </h2>
        <p style={{ color: "var(--text-muted)", maxWidth: 480, margin: "0 auto 36px", fontSize: "1rem", lineHeight: 1.7 }}>
          Join thousands of builders who ship faster, grow smarter, and sleep better with SitePilot.
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/signup"
            className="sp-btn sp-primary"
            style={{ padding: "14px 36px", fontSize: "1rem", fontWeight: 700, borderRadius: 999 }}
          >
            Start for Free
          </Link>
          <a
            href="#contact"
            className="sp-btn"
            style={{
              padding: "14px 36px", fontSize: "1rem", borderRadius: 999,
              border: "1px solid var(--border)",
              background: "color-mix(in srgb, var(--surface) 60%, transparent)",
            }}
          >
            Talk to us
          </a>
        </div>
      </section>

    </div>
  );
}
