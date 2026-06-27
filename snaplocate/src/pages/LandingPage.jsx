import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { GoogleLogin } from "@react-oauth/google";

// ── Logo Mark ─────────────────────────────────────────────
const LogoMark = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="200" rx="44" fill="#4E46E5" />
    {[
      ["66,38", "100,38"], ["100,38", "134,38"], ["66,38", "66,72"],
      ["66,72", "66,106"], ["66,106", "100,106"], ["100,106", "134,106"],
      ["134,106", "134,140"], ["134,140", "134,174"],
      ["66,174", "100,174"], ["100,174", "134,174"],
    ].map(([a, b], i) => {
      const [x1, y1] = a.split(",");
      const [x2, y2] = b.split(",");
      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.45)" strokeWidth="2.5" />;
    })}
    {[
      [66, 38, 1], [100, 38, 1], [134, 38, 1],
      [66, 72, 1], [66, 106, 1], [100, 106, 1], [134, 106, 1],
      [134, 140, 0.75], [66, 174, 0.75], [100, 174, 0.75], [134, 174, 0.75],
    ].map(([cx, cy, op], i) => (
      <circle key={i} cx={cx} cy={cy} r="9" fill="white" opacity={op} />
    ))}
  </svg>
);

// ── Data ──────────────────────────────────────────────────
const FEATURES = [
  { icon: "🔄", title: "LMS Auto-Sync", desc: "Connect your Moodle account to automatically sync courses, assignments, and grades into one dashboard." },
  { icon: "🧑‍🏫", title: "Faculty Directory", desc: "Search professors, view cabin numbers, office hours, and send meeting requests instantly." },
  { icon: "🛍️", title: "Campus Marketplace", desc: "Buy and sell textbooks, electronics, and dorm essentials safely within your university network." },
  { icon: "🔍", title: "Lost & Found", desc: "Report lost items or claim found ones. Integrated chat system to coordinate item returns securely." },
  { icon: "📚", title: "Academic Hub", desc: "Access native PYQs, assignments, and course materials. Built-in gradebook and attendance tracking." },
  { icon: "🏛️", title: "Societies & Clubs", desc: "Discover technical, cultural, and sports societies with contacts and event listings all in one place." },
  { icon: "🏪", title: "Shops & Eateries", desc: "View canteen menus, operating hours, and find exactly where to eat between classes." },
  { icon: "📡", title: "Wi-Fi Hotspots", desc: "Find high-speed Wi-Fi zones across campus — hostels, labs, library, and student union." },
  { icon: "🤝", title: "Campus Support", desc: "Centralized IT helpdesk, finance, academics, hostel, and emergency support contacts." },
];

const STATS = [
  { val: "15+", label: "Campus Modules" },
  { val: "3", label: "User Roles" },
  { val: "Auto", label: "Moodle Sync" },
  { val: "100%", label: "Campus Verified" },
  { val: "AWS", label: "Cloud Hosted" },
  { val: "PgSQL", label: "Database" },
];

const STEPS = [
  { n: "01", title: "Sign in with Google", desc: "Use your university email (@thapar.edu) to get instant, role-based access — Student, Faculty, or Admin. No manual signup." },
  { n: "02", title: "Sync & Discover", desc: "Connect Moodle to sync your timetable, then explore the marketplace, faculty directory, and societies." },
  { n: "03", title: "Get there. Get things done.", desc: "Track attendance, request meetings, buy textbooks, and chat with peers. SnapLocate handles the rest." },
];

const ROLES = [
  {
    emoji: "🎓", role: "Students", tag: "PRIMARY USERS", accentClass: "student",
    desc: "Sync Moodle courses, find professors, track attendance, buy textbooks, report lost items, and discover societies — all from one dashboard.",
    features: ["LMS Sync", "Faculty Requests", "Academic Hub", "Marketplace", "Lost & Found", "Societies"],
  },
  {
    emoji: "🧑‍🏫", role: "Faculty", tag: "FACULTY OS", accentClass: "faculty",
    desc: "Manage your public profile, respond to student meeting requests, upload course materials, track attendance, and stay connected.",
    features: ["Profile Management", "Request Inbox", "Resource Upload", "Attendance Marking"],
  },
  {
    emoji: "🛡️", role: "Admins", tag: "ADMIN OS", accentClass: "admin",
    desc: "Full CRUD access to platform data. Manage classrooms, approve societies, oversee marketplace, and keep campus data accurate.",
    features: ["Data Control", "Broadcasts", "Society Approval", "User Management"],
  },
];

const DASH_CARDS = [
  { label: "UP NEXT", val: "9:40 AM · Machine Learning", sub: "Lab · L-302 · UPCOMING", pct: 90 },
  { label: "LMS SYNC", val: "Moodle Connected", sub: "Last synced: 2m ago", pct: 100 },
  { label: "MARKETPLACE", val: "3 new listings", sub: "Textbooks · Electronics", pct: 40 },
  { label: "LOST & FOUND", val: "1 new match", sub: "Black laptop bag", pct: 20 },
];

const SIDEBAR_ITEMS = ["Dashboard", "LMS Hub", "Professors", "Marketplace", "Lost & Found", "Societies", "Support"];

// ── Light Theme Tokens ─────────────────────────────────────
// bg-page:    #FFFFFF
// bg-surface: #F8FAFC
// bg-card:    #FFFFFF
// border:     #E2E8F0
// text-main:  #0F172A
// text-muted: #64748B
// text-nav:   #64748B
// accent:     #4E46E5
// accent-txt: #4E46E5

// ── Subcomponents ─────────────────────────────────────────

function Navbar({ onAuth }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      style={{
        position: "sticky", top: 0, zIndex: 100,
        background: scrolled ? "rgba(255,255,255,0.97)" : "rgba(255,255,255,0.88)",
        backdropFilter: "blur(14px)",
        borderBottom: "1px solid #E2E8F0",
        height: 68,
        display: "flex", alignItems: "center",
        padding: "0 80px",
        transition: "background 0.3s",
        boxShadow: scrolled ? "0 1px 12px rgba(15,23,42,0.06)" : "none",
      }}
    >
      {/* Logo */}
      <a href="#" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
        <LogoMark size={34} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex" }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", letterSpacing: -0.4 }}>Snap</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#4E46E5", letterSpacing: -0.4 }}>Locate</span>
          </div>
          <span style={{ fontSize: 8, fontWeight: 600, color: "rgba(78,70,229,0.55)", letterSpacing: "2px" }}>CAMPUS OS</span>
        </div>
      </a>

      {/* Nav links */}
      <div style={{ display: "flex", marginLeft: 80, flex: 1, gap: 0 }}>
        {["Features", "How It Works", "For Students", "For Faculty"].map((l) => (
          <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`}
            style={{ fontSize: 13, color: "#64748B", textDecoration: "none", padding: "8px 20px", transition: "color 0.2s" }}
            onMouseEnter={e => e.target.style.color = "#0F172A"}
            onMouseLeave={e => e.target.style.color = "#64748B"}
          >{l}</a>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 12 }}>
        <a href="#" onClick={(e) => { e.preventDefault(); onAuth("login"); }} style={{
          fontSize: 13, fontWeight: 500, color: "#64748B", padding: "8px 20px",
          border: "1px solid #E2E8F0", borderRadius: 8, textDecoration: "none",
          transition: "all 0.2s",
        }}
          onMouseEnter={e => { e.target.style.borderColor = "#4E46E5"; e.target.style.color = "#4E46E5"; }}
          onMouseLeave={e => { e.target.style.borderColor = "#E2E8F0"; e.target.style.color = "#64748B"; }}
        >Sign In</a>
        <a href="#" onClick={(e) => { e.preventDefault(); onAuth("register"); }} style={{
          fontSize: 13, fontWeight: 600, color: "#fff", padding: "9px 20px",
          background: "#4E46E5", borderRadius: 8, textDecoration: "none",
          transition: "opacity 0.2s",
        }}
          onMouseEnter={e => e.target.style.opacity = "0.88"}
          onMouseLeave={e => e.target.style.opacity = "1"}
        >Get Started →</a>
      </div>
    </nav>
  );
}

function DotGridMark({ style }) {
  return (
    <svg style={style} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      {[["66,38", "100,38"], ["100,38", "134,38"], ["66,38", "66,106"], ["66,106", "134,106"], ["134,106", "134,174"], ["66,174", "134,174"]].map(([a, b], i) => {
        const [x1, y1] = a.split(","); const [x2, y2] = b.split(",");
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(78,70,229,0.12)" strokeWidth="3" />;
      })}
      {[[66, 38, 0.18], [100, 38, 0.09], [134, 38, 0.18], [66, 72, 0.14], [66, 106, 0.18], [100, 106, 0.09], [134, 106, 0.18], [134, 140, 0.09], [66, 174, 0.09], [100, 174, 0.06], [134, 174, 0.09]].map(([cx, cy, op], i) => (
        <circle key={i} cx={cx} cy={cy} r="9" fill={`rgba(78,70,229,${op})`} />
      ))}
    </svg>
  );
}

function DashboardPreview() {
  return (
    <div style={{
      border: "1px solid #E2E8F0", borderBottom: "none",
      borderRadius: "16px 16px 0 0",
      background: "#F8FAFC", display: "flex",
      height: 200, overflow: "hidden",
      boxShadow: "0 -8px 40px rgba(78,70,229,0.07)",
    }}>
      {/* Sidebar */}
      <div style={{ width: 180, flexShrink: 0, background: "#F1F5F9", padding: "14px 10px", borderRight: "1px solid #E2E8F0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, padding: "0 6px" }}>
          <LogoMark size={20} />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#0F172A" }}>Snap</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#4E46E5" }}>Locate</span>
        </div>
        {SIDEBAR_ITEMS.map((item, i) => (
          <div key={item} style={{
            fontSize: 9, padding: "4px 8px", borderRadius: 4,
            color: i === 0 ? "#4E46E5" : "#94A3B8",
            fontWeight: i === 0 ? 600 : 400,
            background: i === 0 ? "rgba(78,70,229,0.08)" : "transparent",
          }}>{item}</div>
        ))}
      </div>
      {/* Main */}
      <div style={{ flex: 1, padding: "20px 24px" }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginBottom: 4 }}>Good morning, Raushan 👋</div>
        <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 16 }}>Here is what is happening on campus today.</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          {DASH_CARDS.map((c) => (
            <div key={c.label} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 8, fontWeight: 600, color: "#4E46E5", letterSpacing: "1.5px", marginBottom: 6 }}>{c.label}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", letterSpacing: -0.3, marginBottom: 4 }}>{c.val}</div>
              <div style={{ fontSize: 10, color: "#94A3B8", marginBottom: 8 }}>{c.sub}</div>
              <div style={{ height: 3, background: "#E2E8F0", borderRadius: 2 }}>
                <div style={{ height: 3, width: `${c.pct}%`, background: "#4E46E5", borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Hero({ onAuth }) {
  return (
    <section style={{ position: "relative", overflow: "hidden", padding: "80px 80px 0", background: "#FFFFFF", minHeight: 800 }}>
      {/* Glow */}
      <div style={{
        position: "absolute", right: -60, top: 80, width: 700, height: 600,
        background: "radial-gradient(ellipse at center, rgba(78,70,229,0.07) 0%, transparent 70%)",
        borderRadius: "50%", pointerEvents: "none",
      }} />
      {/* Ambient dot mark */}
      <DotGridMark style={{
        position: "absolute", right: 80, top: 120,
        width: 420, height: 420, pointerEvents: "none",
      }} />

      {/* Badge */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        background: "rgba(78,70,229,0.06)", border: "1px solid rgba(78,70,229,0.18)",
        borderRadius: 20, padding: "6px 16px",
        fontSize: 12, fontWeight: 600, color: "#4E46E5",
        marginBottom: 28,
      }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10B981", flexShrink: 0, display: "inline-block" }} />
        920+ students · Live on AWS
      </div>

      {/* Headline */}
      <h1 style={{
        fontSize: "clamp(56px, 6vw, 88px)", fontWeight: 800,
        letterSpacing: "-4px", lineHeight: 1.0, color: "#0F172A", margin: 0,
      }}>
        Your Campus.<br />
        <span style={{ color: "#4E46E5" }}>One OS.</span>
      </h1>

      <p style={{
        fontSize: 18, color: "#64748B", lineHeight: 1.75,
        maxWidth: 560, margin: "28px 0 36px", letterSpacing: -0.2,
      }}>
        SnapLocate replaces every scattered university portal with one fast, beautiful platform — for students, faculty, and admins.
      </p>

      {/* CTAs */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
        <a href="#" onClick={(e) => { e.preventDefault(); onAuth("register"); }} style={{
          fontSize: 15, fontWeight: 600, color: "#fff",
          padding: "14px 28px", borderRadius: 12,
          background: "#4E46E5", textDecoration: "none",
          transition: "opacity 0.2s",
          display: "inline-block",
        }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >Explore Campus →</a>
        <a href="#features" style={{
          fontSize: 15, fontWeight: 500, color: "#64748B",
          padding: "14px 28px", borderRadius: 12,
          background: "transparent", border: "1px solid #E2E8F0",
          textDecoration: "none", transition: "all 0.2s",
          display: "inline-block",
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#4E46E5"; e.currentTarget.style.color = "#4E46E5"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.color = "#64748B"; }}
        >View Features</a>
      </div>

      <p style={{ fontSize: 12, color: "#94A3B8", letterSpacing: "0.3px", marginBottom: 48 }}>
        No signup required · Use university email
      </p>

      <DashboardPreview />
    </section>
  );
}

function StatsBar() {
  return (
    <div style={{
      background: "#F8FAFC",
      borderTop: "1px solid #E2E8F0", borderBottom: "1px solid #E2E8F0",
      padding: "0 80px", display: "flex", alignItems: "center", height: 96,
    }}>
      {STATS.map((s, i) => (
        <div key={s.val} style={{ display: "flex", alignItems: "center", flex: 1 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: "#0F172A", letterSpacing: -1, lineHeight: 1 }}>{s.val}</span>
            <span style={{ fontSize: 11, color: "#94A3B8" }}>{s.label}</span>
          </div>
          {i < STATS.length - 1 && <div style={{ width: 1, height: 56, background: "#E2E8F0", marginLeft: "auto" }} />}
        </div>
      ))}
    </div>
  );
}

function Features() {
  const [hovered, setHovered] = useState(null);
  return (
    <section id="features" style={{ padding: "96px 80px", background: "#FFFFFF" }}>
      <span style={{ fontSize: 10, fontWeight: 600, color: "#4E46E5", letterSpacing: "3px", display: "block", marginBottom: 16 }}>
        PLATFORM FEATURES
      </span>
      <h2 style={{ fontSize: "clamp(36px,3.6vw,52px)", fontWeight: 700, color: "#0F172A", letterSpacing: -2, lineHeight: 1.15, margin: 0 }}>
        One platform.<br />Every corner of campus.
      </h2>
      <p style={{ fontSize: 16, color: "#64748B", lineHeight: 1.75, maxWidth: 600, margin: "16px 0 48px" }}>
        From finding a professor to recovering a lost item — all in one tab.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
        {FEATURES.map((f, i) => (
          <div key={f.title}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{
              background: hovered === i ? "#FAFAFE" : "#FFFFFF",
              border: `1px solid ${hovered === i ? "rgba(78,70,229,0.3)" : "#E2E8F0"}`,
              borderRadius: 16, padding: 24,
              position: "relative", overflow: "hidden",
              transform: hovered === i ? "translateY(-2px)" : "translateY(0)",
              transition: "all 0.2s",
              cursor: "default",
              boxShadow: hovered === i ? "0 8px 24px rgba(78,70,229,0.08)" : "none",
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 16, border: "1px solid #E2E8F0" }}>
              {f.icon}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginBottom: 8, letterSpacing: -0.3 }}>{f.title}</div>
            <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.7 }}>{f.desc}</div>
            {/* Accent line */}
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0, height: 3,
              background: "#4E46E5", borderRadius: "0 0 16px 16px",
              opacity: hovered === i ? 1 : 0, transition: "opacity 0.2s",
            }} />
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" style={{ padding: "96px 80px", background: "#F8FAFC", borderTop: "1px solid #E2E8F0" }}>
      <span style={{ fontSize: 10, fontWeight: 600, color: "#4E46E5", letterSpacing: "3px", display: "block", marginBottom: 16 }}>
        HOW IT WORKS
      </span>
      <h2 style={{ fontSize: "clamp(36px,3.6vw,44px)", fontWeight: 700, color: "#0F172A", letterSpacing: -2, margin: 0 }}>
        Three steps to your campus.
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 0, marginTop: 64, position: "relative" }}>
        {STEPS.map((s, i) => (
          <div key={s.n} style={{ paddingRight: 48, position: "relative" }}>
            {/* Dashed connector */}
            {i < 2 && (
              <div style={{
                position: "absolute", top: 44, right: 0, width: 48, height: 1,
                backgroundImage: "repeating-linear-gradient(90deg,#CBD5E1 0,#CBD5E1 4px,transparent 4px,transparent 8px)",
              }} />
            )}
            <div style={{ fontSize: 52, fontWeight: 700, color: "#E2E8F0", letterSpacing: -2, lineHeight: 1, marginBottom: 24 }}>{s.n}</div>
            <div style={{ fontSize: 19, fontWeight: 600, color: "#0F172A", marginBottom: 12, letterSpacing: -0.5 }}>{s.title}</div>
            <div style={{ fontSize: 13, color: "#64748B", lineHeight: 1.75, maxWidth: 360 }}>{s.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function UserRoles() {
  const accentMap = {
    student: { bar: "#4E46E5", tag: { bg: "rgba(78,70,229,0.08)", color: "#4E46E5" } },
    faculty: { bar: "#059669", tag: { bg: "rgba(5,150,105,0.08)", color: "#059669" } },
    admin:   { bar: "#7C3AED", tag: { bg: "rgba(124,58,237,0.08)", color: "#7C3AED" } },
  };

  return (
    <section id="for-students" style={{ padding: "96px 80px", background: "#FFFFFF", borderTop: "1px solid #E2E8F0" }}>
      <span style={{ fontSize: 10, fontWeight: 600, color: "#4E46E5", letterSpacing: "3px", display: "block", marginBottom: 16 }}>
        BUILT FOR EVERY ROLE
      </span>
      <h2 style={{ fontSize: "clamp(36px,3.6vw,44px)", fontWeight: 700, color: "#0F172A", letterSpacing: -2, margin: 0 }}>
        Your role. Your dashboard.
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 28, marginTop: 64 }}>
        {ROLES.map((r) => {
          const acc = accentMap[r.accentClass];
          return (
            <div key={r.role} style={{
              background: "#FFFFFF", border: "1px solid #E2E8F0",
              borderRadius: 16, padding: 28,
              position: "relative", overflow: "hidden",
              boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
            }}>
              {/* Top bar */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: acc.bar }} />
              {/* Tag */}
              <span style={{
                display: "inline-block", fontSize: 9, fontWeight: 600, letterSpacing: "2px",
                padding: "5px 10px", borderRadius: 6, marginBottom: 14,
                background: acc.tag.bg, color: acc.tag.color,
              }}>{r.tag}</span>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", marginBottom: 12, letterSpacing: -0.4 }}>
                {r.emoji}&nbsp;&nbsp;{r.role}
              </div>
              <p style={{ fontSize: 12, color: "#64748B", lineHeight: 1.75, marginBottom: 20 }}>{r.desc}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {r.features.map((f) => (
                  <span key={f} style={{
                    fontSize: 9, color: "#64748B", padding: "4px 10px",
                    border: "1px solid #E2E8F0", borderRadius: 5,
                    background: "#F8FAFC",
                  }}>{f}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SocialProof() {
  return (
    <div style={{
      background: "#F8FAFC",
      borderTop: "1px solid #E2E8F0", borderBottom: "1px solid #E2E8F0",
      padding: "64px 80px",
      display: "flex", alignItems: "flex-start", gap: 32,
    }}>
      <div style={{ fontSize: 120, fontWeight: 700, color: "#E2E8F0", lineHeight: 0.8, flexShrink: 0, marginTop: 16 }}>"</div>
      <div style={{ flex: 1 }}>
        <p style={{
          fontSize: "clamp(18px,2vw,26px)", fontWeight: 600,
          color: "#0F172A", lineHeight: 1.6, letterSpacing: -0.5, marginBottom: 20,
        }}>
          SnapLocate replaced four different portals I had to check every morning.
          Now it's literally just one tab — professors, notes, marketplace, everything.
        </p>
        <p style={{ fontSize: 13, color: "#94A3B8" }}>— CSE Student, Thapar Institute · Batch 2024</p>
      </div>
      <div style={{
        flexShrink: 0, alignSelf: "center",
        display: "flex", alignItems: "center", gap: 8,
        border: "1px solid #E2E8F0", borderRadius: 20,
        padding: "10px 18px", fontSize: 11, color: "#059669",
        background: "#FFFFFF",
      }}>
        <span style={{
          width: 7, height: 7, borderRadius: "50%", background: "#10B981",
          animation: "pulse 2s infinite", display: "inline-block", flexShrink: 0,
        }} />
        Live · snaplocate.in
      </div>
    </div>
  );
}

function CTASection({ onAuth }) {
  return (
    <section style={{
      background: "#4E46E5", padding: "96px 80px",
      textAlign: "center", position: "relative", overflow: "hidden",
    }}>
      {/* Subtle inner glow */}
      <div style={{
        position: "absolute", left: "50%", top: "50%",
        transform: "translate(-50%,-50%)",
        width: 800, height: 400,
        background: "radial-gradient(ellipse at center, rgba(255,255,255,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <h2 style={{
        fontSize: "clamp(36px,4vw,56px)", fontWeight: 700,
        color: "#fff", letterSpacing: -2.5, marginBottom: 20, position: "relative",
      }}>Your campus is waiting.</h2>
      <p style={{
        fontSize: 16, color: "rgba(199,196,255,0.85)", lineHeight: 1.75,
        maxWidth: 640, margin: "0 auto 36px", position: "relative",
      }}>
        Join 920+ students already using SnapLocate at Thapar Institute of Engineering &amp; Technology.
      </p>
      <a href="#" onClick={(e) => { e.preventDefault(); onAuth("register"); }} style={{
        display: "inline-block", position: "relative",
        background: "#fff", color: "#4E46E5",
        fontSize: 15, fontWeight: 600,
        padding: "16px 40px", borderRadius: 14,
        textDecoration: "none", marginBottom: 16,
        transition: "transform 0.15s, opacity 0.2s",
      }}
        onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
        onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
      >
        Get Started Free — It Takes 10 Seconds →
      </a>
      <p style={{ fontSize: 11, color: "rgba(199,196,255,0.6)", letterSpacing: "0.2px", position: "relative" }}>
        University email required · No credit card · Instant role-based access
      </p>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{ background: "#F8FAFC", borderTop: "1px solid #E2E8F0", padding: "48px 80px 32px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
        {/* Brand */}
        <div>
          <a href="#" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 8 }}>
            <LogoMark size={28} />
            <div style={{ display: "flex" }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>Snap</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#4E46E5" }}>Locate</span>
            </div>
          </a>
          <p style={{ fontSize: 11, color: "#94A3B8" }}>Campus OS · Thapar Institute of Engineering &amp; Technology, Patiala</p>
        </div>
        {/* Links */}
        <div style={{ display: "flex", gap: 40, alignItems: "center" }}>
          {["Features", "How It Works", "For Faculty", "Admin", "Privacy", "GitHub"].map((l) => (
            <a key={l} href="#" style={{ fontSize: 12, color: "#94A3B8", textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={e => e.target.style.color = "#0F172A"}
              onMouseLeave={e => e.target.style.color = "#94A3B8"}
            >{l}</a>
          ))}
        </div>
        <a href="#" style={{ fontSize: 12, color: "#4E46E5", textDecoration: "none" }}>snaplocate.in →</a>
      </div>
      <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: 24, display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, color: "#94A3B8" }}>© 2026 SnapLocate · Built by Raushan Raj · Thapar Institute</span>
        <span style={{ fontSize: 11, color: "#94A3B8" }}>AWS · React · Node.js · PostgreSQL</span>
      </div>
    </footer>
  );
}

// ── Auth Modal Component ───────────────────────────────────
function AuthModal({ mode, onClose, setMode }) {
  const navigate = useNavigate();
  const { login, register, loginWithGoogle } = useAuth();
  
  const [form, setForm] = useState({ email: '', password: '', full_name: '', role: 'student' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const setF = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleRedirect = (user) => {
    onClose();
    if (user.role === 'admin') navigate('/admin/dashboard', { replace: true });
    else if (user.role === 'faculty') navigate('/faculty/dashboard', { replace: true });
    else navigate('/dashboard', { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password || (mode === 'register' && !form.full_name)) { 
      setError('Please fill in all fields.'); 
      return; 
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await login({ email: form.email, password: form.password });
        handleRedirect(res.user);
      } else {
        const res = await register(form);
        onClose();
        navigate('/verify-otp', { state: { email: form.email, dev_otp: res.dev_otp || '' } });
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');
    try {
      const res = await loginWithGoogle(credentialResponse.credential);
      handleRedirect(res.user);
    } catch (err) {
      setError(err.message || 'Google login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20
    }}>
      <div style={{
        background: '#fff', borderRadius: 24, width: '100%', maxWidth: 420,
        padding: '36px 32px', position: 'relative',
        boxShadow: '0 24px 80px rgba(0,0,0,0.1)'
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 20, right: 20,
          background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94A3B8'
        }}>✕</button>

        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
            {mode === 'login' ? 'Welcome back 👋' : 'Create an account 🚀'}
          </h2>
          <p style={{ fontSize: 15, color: '#64748B' }}>
            {mode === 'login' ? 'Sign in to your SnapLocate account' : 'Join SnapLocate and sync your campus'}
          </p>
        </div>

        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10,
            padding: '10px 14px', marginBottom: 16,
          }}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#991b1b' }}>{error}</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google Login was unsuccessful.')}
            useOneTap
            shape="pill"
            theme="outline"
            size="large"
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
          <span style={{ fontSize: 12, fontWeight: 500, color: '#64748B', margin: '0 12px' }}>OR</span>
          <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {mode === 'register' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Full Name</label>
              <input type="text" placeholder="John Doe" value={form.full_name} onChange={setF('full_name')}
                style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none' }}
                onFocus={e => e.target.style.borderColor = '#4f46e5'} onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Email address</label>
            <input type="email" placeholder="you@university.edu" value={form.email} onChange={setF('email')}
              style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none' }}
              onFocus={e => e.target.style.borderColor = '#4f46e5'} onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Password</label>
              <button type="button" onClick={() => setShowPass(!showPass)} style={{ background: 'none', border: 'none', fontSize: 13, color: '#4E46E5', cursor: 'pointer', fontWeight: 500 }}>
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>
            <input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={setF('password')}
              style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none' }}
              onFocus={e => e.target.style.borderColor = '#4f46e5'} onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '13px', marginTop: 4, background: '#4E46E5', color: '#fff',
            border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer',
            opacity: loading ? 0.7 : 1, transition: 'background 0.2s'
          }}>
            {loading ? 'Processing...' : (mode === 'login' ? 'Sign In →' : 'Create Account →')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: 13, color: '#64748B' }}>
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setForm({ email: '', password: '', full_name: '', role: 'student' }); }} style={{
            background: 'none', border: 'none', fontSize: 13, fontWeight: 600, color: '#4E46E5', cursor: 'pointer'
          }}>
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────
export default function SnapLocateLanding() {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  const openAuth = (mode) => {
    setAuthMode(mode);
    setShowAuth(true);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #FFFFFF;
          color: #0F172A;
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
        @media (max-width: 1024px) {
          .features-grid { grid-template-columns: repeat(2,1fr) !important; }
          .roles-grid { grid-template-columns: 1fr !important; }
          .steps-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
          nav, section, footer, .stats-bar, .quote-section {
            padding-left: 32px !important;
            padding-right: 32px !important;
          }
        }
        @media (max-width: 640px) {
          .features-grid { grid-template-columns: 1fr !important; }
          .dash-cards { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>

      <Navbar onAuth={openAuth} />
      <Hero onAuth={openAuth} />
      <StatsBar />
      <Features />
      <HowItWorks />
      <UserRoles />
      <SocialProof />
      <CTASection onAuth={openAuth} />
      <Footer />

      {showAuth && (
        <AuthModal 
          mode={authMode} 
          setMode={setAuthMode} 
          onClose={() => setShowAuth(false)} 
        />
      )}
    </>
  );
}