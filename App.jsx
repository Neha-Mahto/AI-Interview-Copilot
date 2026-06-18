import { useState, useEffect, useRef } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, BarChart, Bar
} from "recharts";
import {
  Brain, Code2, Server, Database, BarChart2, Cpu, ChevronRight,
  Clock, CheckCircle, User, LogOut, Play, ArrowRight, Award,
  TrendingUp, MessageSquare, Target, Zap, Home, Timer, BookOpen,
  Terminal, Rocket, Trophy, Activity, ChevronDown, ChevronUp, X,
  Sparkles, AlertCircle, Eye, EyeOff, Send, RotateCcw, Star,
  Flame, Calendar, SkipForward, GitBranch, Layers, HardDrive,
  Globe, Shield, RefreshCw, Plus, Check, Filter
} from "lucide-react";

// ─── CONSTANTS ──────────────────────────────────────────────────────────────
const ROLES = [
  { id: "swe", label: "Software Engineer", icon: Code2, color: "#6366F1" },
  { id: "frontend", label: "Frontend Dev", icon: Globe, color: "#06B6D4" },
  { id: "backend", label: "Backend Dev", icon: Server, color: "#10B981" },
  { id: "fullstack", label: "Full Stack Dev", icon: Layers, color: "#8B5CF6" },
  { id: "data", label: "Data Analyst", icon: BarChart2, color: "#F59E0B" },
  { id: "ml", label: "ML Engineer", icon: Brain, color: "#EF4444" },
  { id: "devops", label: "DevOps Engineer", icon: GitBranch, color: "#EC4899" },
  { id: "system", label: "System Designer", icon: HardDrive, color: "#14B8A6" },
];

const DIFFICULTIES = [
  { id: "Easy", desc: "Fresher / 0–1 yr", color: "#10B981" },
  { id: "Medium", desc: "1–3 yrs exp", color: "#F59E0B" },
  { id: "Hard", desc: "3+ yrs / Senior", color: "#EF4444" },
];

const TOPICS_MAP = {
  swe: ["DSA", "OOP", "DBMS", "Operating Systems", "Computer Networks", "System Design"],
  frontend: ["HTML/CSS", "JavaScript", "React", "Performance", "Accessibility", "Web Security"],
  backend: ["REST APIs", "Databases", "Caching", "Security", "Microservices", "Message Queues"],
  fullstack: ["JavaScript", "React", "Node.js", "Databases", "REST APIs", "DevOps Basics"],
  data: ["SQL", "Python", "Statistics", "Data Visualization", "ETL Pipelines", "Machine Learning"],
  ml: ["ML Algorithms", "Deep Learning", "NLP", "MLOps", "Statistics", "Model Evaluation"],
  devops: ["Docker", "Kubernetes", "CI/CD", "AWS/GCP/Azure", "Monitoring", "Infrastructure"],
  system: ["Scalability", "CAP Theorem", "Load Balancing", "Caching Strategies", "Databases", "Availability"],
};

const MOCK_HISTORY = [
  { id: 1, date: "2024-11-10", role: "Software Engineer", difficulty: "Medium", score: 70, tech: 73, comm: 67, conf: 70, topics: ["DSA", "OOP"], qCount: 5 },
  { id: 2, date: "2024-11-18", role: "Frontend Dev", difficulty: "Medium", score: 76, tech: 80, comm: 72, conf: 76, topics: ["React", "JavaScript"], qCount: 5 },
  { id: 3, date: "2024-11-26", role: "Software Engineer", difficulty: "Hard", score: 74, tech: 77, comm: 71, conf: 74, topics: ["System Design"], qCount: 5 },
  { id: 4, date: "2024-12-04", role: "Backend Dev", difficulty: "Hard", score: 81, tech: 84, comm: 78, conf: 81, topics: ["Databases", "REST APIs"], qCount: 5 },
  { id: 5, date: "2024-12-12", role: "Software Engineer", difficulty: "Hard", score: 86, tech: 89, comm: 83, conf: 86, topics: ["DSA", "System Design"], qCount: 5 },
  { id: 6, date: "2024-12-20", role: "ML Engineer", difficulty: "Medium", score: 89, tech: 92, comm: 86, conf: 89, topics: ["ML Algorithms", "Deep Learning"], qCount: 5 },
];

// ─── AI HELPER ──────────────────────────────────────────────────────────────
const callAI = async (messages, systemPrompt = "") => {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.REACT_APP_GROQ_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt || "Return only valid JSON." },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 1500
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.choices[0].message.content;
  } catch (e) {
    throw new Error(e.message);
  }
};

const safeParseJSON = (text) => {
  let t = text.trim();
  const m = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (m) t = m[1].trim();
  return JSON.parse(t);
};

// ─── UTILS ──────────────────────────────────────────────────────────────────
const scoreColor = (s) => s >= 80 ? "#10B981" : s >= 60 ? "#F59E0B" : "#EF4444";
const scoreLabel = (s) => s >= 85 ? "Excellent 🏆" : s >= 70 ? "Good 👍" : s >= 55 ? "Average 📈" : "Needs Work 💪";
const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const avg = (arr, key) => arr.length ? Math.round(arr.reduce((a, b) => a + (b[key] || 0), 0) / arr.length) : 0;

// ─── GLOBAL CSS ─────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#020817;color:#f1f5f9;font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased}
  @keyframes blink{50%{opacity:0}}
  @keyframes bounce{0%,80%,100%{transform:scale(0.6);opacity:0.4}40%{transform:scale(1);opacity:1}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes glow{0%,100%{box-shadow:0 0 20px #6366F130}50%{box-shadow:0 0 40px #6366F160}}
  @keyframes slideIn{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}
  .fade-up{animation:fadeUp 0.45s cubic-bezier(0.16,1,0.3,1) forwards}
  .slide-in{animation:slideIn 0.3s ease forwards}
  .spin{animation:spin 0.8s linear infinite}
  ::-webkit-scrollbar{width:5px;height:5px}
  ::-webkit-scrollbar-track{background:#0f172a}
  ::-webkit-scrollbar-thumb{background:#334155;border-radius:4px}
  ::-webkit-scrollbar-thumb:hover{background:#6366F1}
  .btn-p{background:linear-gradient(135deg,#6366F1 0%,#4338CA 100%);color:#fff;border:none;cursor:pointer;transition:all 0.2s;font-family:inherit}
  .btn-p:hover{filter:brightness(1.2);transform:translateY(-1px);box-shadow:0 6px 20px #6366F140}
  .btn-p:active{transform:translateY(0)}
  .btn-p:disabled{opacity:0.5;cursor:not-allowed;transform:none}
  .btn-g{background:transparent;border:1px solid #334155;color:#94a3b8;cursor:pointer;transition:all 0.2s;font-family:inherit}
  .btn-g:hover{border-color:#6366F1;color:#818cf8;background:#6366F110}
  .card{background:#0f172a;border:1px solid #1e293b;border-radius:16px}
  .card-h{transition:all 0.2s;cursor:pointer}
  .card-h:hover{border-color:#6366F140;transform:translateY(-3px);box-shadow:0 12px 32px #6366F115}
  input,textarea,select{background:#020817;border:1px solid #334155;color:#f1f5f9;font-family:inherit;outline:none;transition:border 0.2s}
  input:focus,textarea:focus,select:focus{border-color:#6366F1;box-shadow:0 0 0 3px #6366F115}
  input::placeholder,textarea::placeholder{color:#475569}
  .tag-a{background:#6366F1;border:1px solid #6366F1;color:#fff}
  .tag-i{background:transparent;border:1px solid #334155;color:#64748b}
  .tag-i:hover{border-color:#6366F1;color:#818cf8}
  .nav-a{color:#818cf8;background:#6366F115}
  .nav-i{color:#64748b;background:transparent}
  .nav-i:hover{color:#94a3b8;background:#ffffff08}
`;

// ─── SCORE GAUGE ─────────────────────────────────────────────────────────────
function ScoreGauge({ score = 0, label, size = 120 }) {
  const r = size / 2 - 14;
  const circ = 2 * Math.PI * r;
  const off = circ - (score / 100) * circ;
  const c = scoreColor(score);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth={10} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={c} strokeWidth={10}
            strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1)" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: size / 4.2, fontWeight: 800, color: c, lineHeight: 1 }}>{score}</span>
          <span style={{ fontSize: 9, color: "#475569", marginTop: 2 }}>/ 100</span>
        </div>
      </div>
      <span style={{ fontSize: 12, color: "#64748b", textAlign: "center", lineHeight: 1.3 }}>{label}</span>
    </div>
  );
}

// ─── TYPING TEXT ─────────────────────────────────────────────────────────────
function TypingText({ text, speed = 16, onDone }) {
  const [shown, setShown] = useState(0);
  useEffect(() => { setShown(0); }, [text]);
  useEffect(() => {
    if (shown < text.length) {
      const t = setTimeout(() => setShown(s => s + 1), speed);
      return () => clearTimeout(t);
    } else if (onDone) onDone();
  }, [shown, text, speed]);
  return (
    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 15, lineHeight: 1.75, color: "#e2e8f0" }}>
      {text.slice(0, shown)}
      {shown < text.length && (
        <span style={{ display: "inline-block", width: 2, height: "1.1em", background: "#6366F1", marginLeft: 1, verticalAlign: "text-bottom", animation: "blink 1s step-end infinite" }} />
      )}
    </span>
  );
}

// ─── LOADING DOTS ─────────────────────────────────────────────────────────────
function Dots({ text = "AI is thinking" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ display: "flex", gap: 5 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#6366F1", animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite` }} />
        ))}
      </div>
      <span style={{ fontSize: 13, color: "#818cf8", fontStyle: "italic" }}>{text}...</span>
    </div>
  );
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color = "#6366F1" }) {
  return (
    <div className="card" style={{ padding: "20px 22px", display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ width: 46, height: 46, borderRadius: 12, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9", letterSpacing: -0.5 }}>{value}</div>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 1 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: color, marginTop: 3 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
function Navbar({ user, page, onNav, onShowAuth, onLogout }) {
  return (
    <nav style={{
      height: 58, borderBottom: "1px solid #1e293b", display: "flex", alignItems: "center",
      padding: "0 28px", gap: 8, position: "sticky", top: 0, zIndex: 100,
      background: "rgba(2,8,23,0.92)", backdropFilter: "blur(16px)",
    }}>
      <button onClick={() => onNav("landing")} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", marginRight: "auto" }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#6366F1,#4338CA)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Brain size={16} color="white" />
        </div>
        <span style={{ fontWeight: 800, fontSize: 16, color: "#f1f5f9", letterSpacing: -0.5 }}>
          Interview<span style={{ color: "#6366F1" }}>AI</span>
        </span>
        <span style={{ fontSize: 10, background: "#6366F120", color: "#818cf8", padding: "1px 7px", borderRadius: 100, border: "1px solid #6366F130" }}>BETA</span>
      </button>

      {user && [["dashboard", Home, "Dashboard"], ["analytics", BarChart2, "Analytics"]].map(([p, Icon, lbl]) => (
        <button key={p} onClick={() => onNav(p)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 13px", borderRadius: 9, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, transition: "all 0.2s" }}
          className={page === p ? "nav-a" : "nav-i"}>
          <Icon size={14} /> {lbl}
        </button>
      ))}

      {user ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 12px", background: "#1e293b", borderRadius: 100 }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg,#6366F1,#06B6D4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "white" }}>
              {(user.name || "U")[0].toUpperCase()}
            </div>
            <span style={{ fontSize: 13, color: "#94a3b8", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</span>
          </div>
          <button onClick={onLogout} className="btn-g" style={{ padding: "6px 13px", borderRadius: 9, fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}>
            <LogOut size={12} /> Out
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => onShowAuth("login")} className="btn-g" style={{ padding: "7px 16px", borderRadius: 9, fontSize: 13 }}>Sign In</button>
          <button onClick={() => onShowAuth("register")} className="btn-p" style={{ padding: "7px 16px", borderRadius: 9, fontSize: 13, fontWeight: 600 }}>Sign Up Free</button>
        </div>
      )}
    </nav>
  );
}

// ─── AUTH MODAL ───────────────────────────────────────────────────────────────
function AuthModal({ mode, onClose, onLogin }) {
  const [tab, setTab] = useState(mode);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!form.email || !form.password) { setErr("Please fill all required fields."); return; }
    if (tab === "register" && !form.name) { setErr("Please enter your name."); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    onLogin({ name: form.name || form.email.split("@")[0], email: form.email });
    setLoading(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(2,8,23,0.88)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div className="card fade-up" style={{ width: 420, padding: 36, position: "relative", border: "1px solid #334155" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", color: "#64748b", cursor: "pointer", display: "flex" }}>
          <X size={18} />
        </button>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,#6366F1,#4338CA)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <Brain size={24} color="white" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#f1f5f9" }}>{tab === "login" ? "Welcome back" : "Create account"}</h2>
          <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>AI-powered interview prep</p>
        </div>
        <div style={{ display: "flex", background: "#020817", borderRadius: 10, padding: 4, marginBottom: 24, gap: 4 }}>
          {[["login", "Sign In"], ["register", "Sign Up"]].map(([t, lbl]) => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.2s", background: tab === t ? "#6366F1" : "transparent", color: tab === t ? "white" : "#64748b" }}>{lbl}</button>
          ))}
        </div>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {tab === "register" && (
            <input value={form.name} onChange={set("name")} placeholder="Full Name" style={{ padding: "11px 14px", borderRadius: 10, fontSize: 14 }} />
          )}
          <input value={form.email} onChange={set("email")} type="email" placeholder="Email Address" style={{ padding: "11px 14px", borderRadius: 10, fontSize: 14 }} />
          <div style={{ position: "relative" }}>
            <input value={form.password} onChange={set("password")} type={showPw ? "text" : "password"} placeholder={tab === "register" ? "Password (min 8 chars)" : "Password"} style={{ padding: "11px 40px 11px 14px", borderRadius: 10, fontSize: 14, width: "100%" }} />
            <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#64748b", cursor: "pointer" }}>
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {err && <div style={{ color: "#f87171", fontSize: 12, background: "#EF444415", padding: "8px 12px", borderRadius: 8, border: "1px solid #EF444430" }}>{err}</div>}
          <button type="submit" className="btn-p" disabled={loading} style={{ padding: 13, borderRadius: 10, fontSize: 14, fontWeight: 700, marginTop: 4 }}>
            {loading ? <Dots text="Authenticating" /> : (tab === "login" ? "Sign In" : "Create Account")}
          </button>
        </form>
        <p style={{ textAlign: "center", color: "#64748b", fontSize: 12, marginTop: 18 }}>
          {tab === "login" ? "No account? " : "Have an account? "}
          <button onClick={() => setTab(tab === "login" ? "register" : "login")} style={{ background: "none", border: "none", color: "#6366F1", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
            {tab === "login" ? "Sign Up Free" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
}

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
function LandingPage({ onStart }) {
  const features = [
    { icon: Brain, color: "#6366F1", title: "AI Question Engine", desc: "LLM-crafted role-specific questions covering DSA, System Design, DBMS, OS, CN, and behavioral rounds." },
    { icon: Target, color: "#10B981", title: "Semantic Evaluation", desc: "Context-aware answer scoring across Technical, Communication, and Confidence dimensions." },
    { icon: MessageSquare, color: "#06B6D4", title: "Follow-Up Questions", desc: "Adaptive follow-ups that probe deeper gaps in your answers, just like a real FAANG interviewer." },
    { icon: BarChart2, color: "#F59E0B", title: "Analytics Dashboard", desc: "Track score progression, identify topic weaknesses, and visualize improvement over time." },
    { icon: Layers, color: "#8B5CF6", title: "8 Job Roles", desc: "SWE, Frontend, Backend, Full Stack, ML, Data Analyst, DevOps, System Design — all covered." },
    { icon: Rocket, color: "#EC4899", title: "Interview Readiness", desc: "Personalized AI feedback with a 30-day improvement roadmap after every session." },
  ];
  const stats = [{ v: "10K+", l: "Mock Sessions" }, { v: "8", l: "Job Roles" }, { v: "50+", l: "Topics" }, { v: "95%", l: "Satisfaction" }];

  return (
    <div style={{ minHeight: "100vh", background: "#020817" }}>
      {/* Radial bg glow */}
      <div style={{ position: "fixed", top: -200, left: "50%", transform: "translateX(-50%)", width: 800, height: 600, background: "radial-gradient(ellipse at center, #6366F108 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      {/* Hero */}
      <div className="fade-up" style={{ padding: "96px 32px 72px", maxWidth: 1100, margin: "0 auto", textAlign: "center", position: "relative" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#6366F112", border: "1px solid #6366F128", borderRadius: 100, padding: "5px 15px", marginBottom: 28, fontSize: 12, color: "#818cf8" }}>
          <Sparkles size={12} /> Powered by Claude AI · Free to Try · No Setup
        </div>
        <h1 style={{ fontSize: 62, fontWeight: 900, lineHeight: 1.08, marginBottom: 20, color: "#f1f5f9", letterSpacing: -2.5 }}>
          Master Your Next<br />
          <span style={{ background: "linear-gradient(135deg,#6366F1 0%,#818cf8 40%,#06B6D4 70%,#10B981 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Tech Interview</span>
        </h1>
        <p style={{ fontSize: 18, color: "#64748b", maxWidth: 560, margin: "0 auto 44px", lineHeight: 1.65 }}>
          AI-powered mock interviews with real-time semantic scoring, personalized feedback, and adaptive follow-ups — built for FAANG aspirants.
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn-p" onClick={onStart} style={{ padding: "15px 34px", borderRadius: 12, fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            <Play size={17} fill="white" /> Start Interview — Free
          </button>
          <button className="btn-g" style={{ padding: "15px 26px", borderRadius: 12, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
            <BarChart2 size={16} /> View Sample Report
          </button>
        </div>
        {/* Stats row */}
        <div style={{ display: "flex", justifyContent: "center", gap: 56, marginTop: 68, flexWrap: "wrap" }}>
          {stats.map(s => (
            <div key={s.v}>
              <div style={{ fontSize: 34, fontWeight: 900, color: "#f1f5f9", letterSpacing: -1 }}>{s.v}</div>
              <div style={{ fontSize: 13, color: "#475569", marginTop: 3 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div style={{ padding: "8px 32px 80px", maxWidth: 1100, margin: "0 auto" }}>
        <h2 style={{ fontSize: 34, fontWeight: 800, textAlign: "center", color: "#f1f5f9", marginBottom: 48, letterSpacing: -1 }}>
          Everything You Need to <span style={{ color: "#6366F1" }}>Get Hired</span>
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
          {features.map(f => (
            <div key={f.title} className="card card-h" style={{ padding: 24 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: f.color + "18", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                <f.icon size={21} color={f.color} />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", marginBottom: 7 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div style={{ padding: "0 32px 80px", maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
        <h2 style={{ fontSize: 30, fontWeight: 800, color: "#f1f5f9", marginBottom: 44, letterSpacing: -0.5 }}>How It Works</h2>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          {[
            { n: "01", title: "Choose Role & Topics", desc: "Pick your target role, difficulty level, and topics to focus on.", icon: Target, color: "#6366F1" },
            { n: "02", title: "AI-Powered Interview", desc: "Answer questions one by one. AI follows up based on your responses.", icon: Brain, color: "#06B6D4" },
            { n: "03", title: "Get Detailed Feedback", desc: "Receive scores, strengths, weaknesses, and a personalized roadmap.", icon: Award, color: "#10B981" },
          ].map((s, i) => (
            <div key={s.n} style={{ display: "flex", alignItems: "flex-start", gap: 0, flex: 1, minWidth: 220 }}>
              <div className="card" style={{ padding: 24, textAlign: "left", flex: 1 }}>
                <div style={{ fontSize: 11, color: s.color, fontWeight: 800, letterSpacing: 2, marginBottom: 10 }}>{s.n}</div>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: s.color + "18", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  <s.icon size={18} color={s.color} />
                </div>
                <div style={{ fontWeight: 700, color: "#e2e8f0", fontSize: 14, marginBottom: 6 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>{s.desc}</div>
              </div>
              {i < 2 && <ChevronRight size={20} color="#334155" style={{ marginTop: 40, flexShrink: 0, marginLeft: 4 }} />}
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: "0 32px 80px", maxWidth: 640, margin: "0 auto" }}>
        <div className="card" style={{ padding: 44, textAlign: "center", border: "1px solid #6366F128", background: "linear-gradient(135deg, #0f172a 0%, #0a0f1e 100%)" }}>
          <Trophy size={38} color="#6366F1" style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: 28, fontWeight: 800, color: "#f1f5f9", marginBottom: 10, letterSpacing: -0.5 }}>Ready to Crack FAANG?</h2>
          <p style={{ color: "#64748b", marginBottom: 28, fontSize: 15, lineHeight: 1.6 }}>Join thousands of engineers who aced their interviews with AI coaching.</p>
          <button className="btn-p" onClick={onStart} style={{ padding: "13px 32px", borderRadius: 11, fontSize: 14, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 8 }}>
            Start Free Practice <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function DashboardPage({ user, history, onNewInterview, onAnalytics }) {
  const done = history.filter(h => h.score);
  const scores = done.map(h => h.score);
  const avgAll = scores.length ? Math.round(scores.reduce((a, b) => a + b) / scores.length) : 0;
  const best = scores.length ? Math.max(...scores) : 0;
  const trendData = done.slice(-7).map((h, i) => ({ n: `#${i + 1}`, overall: h.score, tech: h.tech, comm: h.comm }));

  return (
    <div className="fade-up" style={{ padding: "28px 32px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#f1f5f9", letterSpacing: -0.5 }}>
            Hey, {(user.name || "Developer").split(" ")[0]} 👋
          </h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Your interview performance at a glance</p>
        </div>
        <button className="btn-p" onClick={onNewInterview} style={{ padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 7 }}>
          <Plus size={15} /> New Interview
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        <StatCard icon={Trophy} label="Total Sessions" value={done.length} sub={done.length > 0 ? "Keep going!" : "Start now"} color="#6366F1" />
        <StatCard icon={Target} label="Average Score" value={`${avgAll}%`} sub={avgAll >= 75 ? "Above target ✓" : "Practice more"} color="#10B981" />
        <StatCard icon={Award} label="Personal Best" value={`${best}%`} sub="All-time high" color="#F59E0B" />
        <StatCard icon={Flame} label="Topics Done" value={[...new Set(done.flatMap(h => h.topics))].length || 0} sub="Unique topics" color="#EF4444" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Chart */}
        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>Score Trend</h3>
            <button onClick={onAnalytics} style={{ background: "none", border: "none", color: "#6366F1", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>Full analytics <ArrowRight size={11} /></button>
          </div>
          {trendData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="n" tick={{ fill: "#475569", fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#475569", fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12, color: "#f1f5f9" }} />
                  <Line type="monotone" dataKey="overall" stroke="#6366F1" strokeWidth={2.5} dot={{ fill: "#6366F1", r: 4 }} name="Overall" />
                  <Line type="monotone" dataKey="tech" stroke="#06B6D4" strokeWidth={2} dot={{ fill: "#06B6D4", r: 3 }} name="Technical" />
                  <Line type="monotone" dataKey="comm" stroke="#10B981" strokeWidth={2} dot={{ fill: "#10B981", r: 3 }} name="Comm." />
                </LineChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", gap: 14, marginTop: 10 }}>
                {[["#6366F1", "Overall"], ["#06B6D4", "Technical"], ["#10B981", "Comm."]].map(([c, l]) => (
                  <div key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#64748b" }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />{l}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: "#334155", fontSize: 13 }}>
              Complete an interview to see your trend
            </div>
          )}
        </div>

        {/* Quick Start */}
        <div className="card" style={{ padding: 22 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 14 }}>Quick Start</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ROLES.slice(0, 5).map(r => (
              <button key={r.id} onClick={onNewInterview} style={{ padding: "9px 12px", borderRadius: 9, border: "1px solid #1e293b", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, textAlign: "left", transition: "all 0.2s", width: "100%" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#6366F140"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#1e293b"}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: r.color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <r.icon size={13} color={r.color} />
                </div>
                <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>{r.label}</span>
                <ChevronRight size={12} color="#334155" style={{ marginLeft: "auto" }} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent interviews */}
      <div className="card">
        <div style={{ padding: "18px 22px", borderBottom: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>Recent Interviews</h3>
          <span style={{ fontSize: 11, color: "#475569" }}>{done.length} total</span>
        </div>
        {done.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#475569", fontSize: 13 }}>
            <BookOpen size={28} style={{ display: "block", margin: "0 auto 10px", color: "#334155" }} />
            No interviews yet. Start your first one!
          </div>
        ) : (
          [...done].reverse().slice(0, 5).map((h, i, arr) => (
            <div key={h.id} style={{ display: "flex", alignItems: "center", padding: "13px 22px", borderBottom: i < arr.length - 1 ? "1px solid #0f172a" : "none", gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: ROLES.find(r => h.role.toLowerCase().includes(r.id.split("").slice(0,3).join("").toLowerCase()))?.color + "18" || "#6366F118", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Code2 size={15} color="#6366F1" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{h.role}</div>
                <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{fmtDate(h.date)} · {h.difficulty} · {h.topics.slice(0, 2).join(", ")}</div>
              </div>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                {[["T", h.tech, "#06B6D4"], ["C", h.comm, "#10B981"]].map(([l, v, c]) => (
                  <div key={l} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: c }}>{v}</div>
                    <div style={{ fontSize: 10, color: "#334155" }}>{l}</div>
                  </div>
                ))}
                <div style={{ textAlign: "center", minWidth: 42 }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: scoreColor(h.score) }}>{h.score}</div>
                  <div style={{ fontSize: 10, color: "#334155" }}>Score</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── SETUP PAGE ───────────────────────────────────────────────────────────────
function SetupPage({ onStart, onBack }) {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState(null);
  const [difficulty, setDifficulty] = useState(null);
  const [topics, setTopics] = useState([]);
  const [qCount, setQCount] = useState(5);
  const toggleTopic = (t) => setTopics(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  const canStart = role && difficulty && topics.length > 0;

  return (
    <div className="fade-up" style={{ padding: "28px 32px", maxWidth: 900, margin: "0 auto" }}>
      <button onClick={onBack} className="btn-g" style={{ padding: "7px 14px", borderRadius: 8, fontSize: 12, marginBottom: 24, display: "flex", alignItems: "center", gap: 5 }}>
        ← Back
      </button>

      {/* Steps */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 32 }}>
        {["Select Role", "Configure", "Launch"].map((lbl, i) => {
          const s = i + 1;
          const done = step > s;
          const active = step === s;
          return (
            <div key={lbl} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, background: done || active ? "#6366F1" : "#1e293b", color: done || active ? "white" : "#475569", border: active ? "2px solid #818cf8" : "none" }}>
                  {done ? <Check size={11} /> : s}
                </div>
                <span style={{ fontSize: 12, fontWeight: active ? 600 : 400, color: active ? "#e2e8f0" : done ? "#818cf8" : "#475569" }}>{lbl}</span>
              </div>
              {i < 2 && <div style={{ width: 32, height: 1, background: step > s ? "#6366F1" : "#1e293b", marginLeft: 4 }} />}
            </div>
          );
        })}
      </div>

      {step === 1 && (
        <div className="slide-in">
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#f1f5f9", marginBottom: 6, letterSpacing: -0.5 }}>Choose Your Role</h2>
          <p style={{ color: "#64748b", marginBottom: 24, fontSize: 14 }}>Which position are you preparing to interview for?</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 13 }}>
            {ROLES.map(r => (
              <button key={r.id} onClick={() => { setRole(r); setTopics(TOPICS_MAP[r.id].slice(0, 3)); setStep(2); }} style={{ padding: "20px 14px", borderRadius: 14, border: `1px solid ${role?.id === r.id ? r.color : "#1e293b"}`, background: role?.id === r.id ? r.color + "18" : "#0f172a", cursor: "pointer", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = r.color + "60"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { if (role?.id !== r.id) { e.currentTarget.style.borderColor = "#1e293b"; e.currentTarget.style.transform = "none"; } }}>
                <div style={{ width: 42, height: 42, borderRadius: 11, background: r.color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <r.icon size={20} color={r.color} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", lineHeight: 1.3 }}>{r.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && role && (
        <div className="slide-in">
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: role.color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <role.icon size={20} color={role.color} />
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", letterSpacing: -0.5 }}>{role.label} Interview</h2>
              <p style={{ color: "#64748b", fontSize: 13 }}>Configure your session</p>
            </div>
          </div>

          {/* Difficulty */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Difficulty Level</h3>
            <div style={{ display: "flex", gap: 12 }}>
              {DIFFICULTIES.map(d => (
                <button key={d.id} onClick={() => setDifficulty(d.id)} style={{ flex: 1, padding: "14px", borderRadius: 12, cursor: "pointer", textAlign: "center", background: difficulty === d.id ? d.color + "18" : "#0f172a", border: `2px solid ${difficulty === d.id ? d.color : "#1e293b"}`, transition: "all 0.2s" }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: difficulty === d.id ? d.color : "#64748b" }}>{d.id}</div>
                  <div style={{ fontSize: 11, color: "#475569", marginTop: 3 }}>{d.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Topics */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
              Topics <span style={{ color: "#475569", textTransform: "none", letterSpacing: 0 }}>({topics.length} selected)</span>
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
              {(TOPICS_MAP[role.id] || []).map(t => (
                <button key={t} onClick={() => toggleTopic(t)} style={{ padding: "7px 15px", borderRadius: 100, cursor: "pointer", fontSize: 12, fontWeight: 600, background: topics.includes(t) ? "#6366F1" : "#0f172a", border: `1px solid ${topics.includes(t) ? "#6366F1" : "#334155"}`, color: topics.includes(t) ? "white" : "#64748b", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 5 }}>
                  {topics.includes(t) && <Check size={10} />}{t}
                </button>
              ))}
            </div>
          </div>

          {/* Count */}
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
              Questions: <span style={{ color: "#6366F1", textTransform: "none", letterSpacing: 0 }}>{qCount}</span>
            </h3>
            <input type="range" min={3} max={8} step={1} value={qCount} onChange={e => setQCount(Number(e.target.value))}
              style={{ width: 220, accentColor: "#6366F1" }} />
            <div style={{ display: "flex", justifyContent: "space-between", width: 220, fontSize: 11, color: "#334155", marginTop: 4 }}>
              <span>3 (Quick)</span><span>8 (Full)</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => setStep(1)} className="btn-g" style={{ padding: "11px 20px", borderRadius: 10, fontSize: 13 }}>← Change Role</button>
            <button onClick={() => canStart && onStart({ role, difficulty, topics, qCount })} disabled={!canStart} className="btn-p" style={{ padding: "11px 28px", borderRadius: 10, fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
              <Play size={15} fill="white" /> Generate & Start
            </button>
          </div>
          {!canStart && <p style={{ fontSize: 11, color: "#475569", marginTop: 10 }}>Select difficulty and at least one topic to continue.</p>}
        </div>
      )}
    </div>
  );
}

// ─── INTERVIEW PAGE ───────────────────────────────────────────────────────────
function InterviewPage({ config, onComplete, onExit }) {
  const [status, setStatus] = useState("generating");
  const [questions, setQuestions] = useState([]);
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [text, setText] = useState("");
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [typingDone, setTypingDone] = useState(false);
  const [err, setErr] = useState("");
  const timerRef = useRef(null);

  useEffect(() => { generate(); }, []);
  useEffect(() => {
    if (status === "active") {
      timerRef.current = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [status]);

  const generate = async () => {
    setStatus("generating"); setErr("");
    try {
      const sys = "You are a senior technical interviewer at Google/Meta/Amazon. Return ONLY valid JSON array, no markdown, no extra text.";
      const prompt = `Generate ${config.qCount} interview questions for a ${config.role.label} position at ${config.difficulty} difficulty.
Topics to cover: ${config.topics.join(", ")}.
Format: [{"id":1,"topic":"TopicName","question":"Full question here","keyPoints":["point1","point2","point3","point4"],"followUp":"A relevant follow-up question"}]
Make questions realistic, FAANG-style. Mix conceptual and applied.`;
      const res = await callAI([{ role: "user", content: prompt }], sys);
      const qs = safeParseJSON(res);
      setQuestions(qs);
      setStatus("active");
      setTypingDone(false);
    } catch (e) {
      setErr("Failed to generate questions. Check your connection and try again.");
      setStatus("error");
    }
  };

  const submitAnswer = async () => {
    if (!text.trim() || status === "evaluating") return;
    setStatus("evaluating");
    const q = questions[qIdx];
    try {
      const sys = "You are a senior tech interviewer. Return ONLY valid JSON, no markdown.";
      const prompt = `Evaluate this interview answer precisely.
Role: ${config.role.label}, Level: ${config.difficulty}
Question: ${q.question}
Expected key points: ${q.keyPoints.join("; ")}
Candidate answer: ${text}

Return JSON: {"totalScore":0-100,"technicalScore":0-100,"communicationScore":0-100,"confidenceScore":0-100,"strengths":["specific strength"],"weaknesses":["specific weakness"],"missedConcepts":["missed concept"],"feedback":"2-3 sentence personalized feedback mentioning specific things they said or missed"}`;
      const res = await callAI([{ role: "user", content: prompt }], sys);
      const ev = safeParseJSON(res);
      const newAnswers = [...answers, { question: q, answer: text, evaluation: ev }];
      setAnswers(newAnswers);
      setText("");
      setTypingDone(false);
      if (qIdx + 1 >= questions.length) {
        clearInterval(timerRef.current);
        onComplete(newAnswers, config);
      } else {
        setQIdx(i => i + 1);
        setStatus("active");
      }
    } catch (e) {
      setErr("Evaluation failed. Please try again.");
      setStatus("active");
    }
  };

  const skip = () => {
    const q = questions[qIdx];
    const newAnswers = [...answers, { question: q, answer: "(Skipped)", evaluation: { totalScore: 0, technicalScore: 0, communicationScore: 0, confidenceScore: 0, strengths: [], weaknesses: ["Question skipped"], missedConcepts: q.keyPoints, feedback: "This question was skipped." } }];
    setAnswers(newAnswers);
    setText("");
    setTypingDone(false);
    if (qIdx + 1 >= questions.length) { clearInterval(timerRef.current); onComplete(newAnswers, config); }
    else { setQIdx(i => i + 1); }
  };

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const timerC = timeLeft < 300 ? "#EF4444" : timeLeft < 600 ? "#F59E0B" : "#10B981";
  const curQ = questions[qIdx];
  const prevAns = answers[qIdx - 1];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#020817" }}>
      {/* Top bar */}
      <div style={{ height: 52, borderBottom: "1px solid #1e293b", display: "flex", alignItems: "center", padding: "0 24px", gap: 16, background: "#0a0f1e", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: status === "active" ? "#10B981" : "#F59E0B", animation: status === "active" ? "none" : "blink 1s step-end infinite" }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{config.role.label}</span>
          <span style={{ background: "#1e293b", padding: "1px 8px", borderRadius: 100, fontSize: 11, color: "#64748b" }}>{config.difficulty}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 700, color: timerC }}>
          <Timer size={14} /> {fmt(timeLeft)}
        </div>
        <button onClick={onExit} className="btn-g" style={{ padding: "5px 12px", borderRadius: 8, fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}>
          <X size={12} /> Exit
        </button>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <div style={{ width: 200, borderRight: "1px solid #1e293b", padding: "20px 14px", flexShrink: 0, overflowY: "auto", background: "#0a0f1e" }}>
          <div style={{ fontSize: 10, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12 }}>Questions</div>
          {questions.map((q, i) => {
            const ans = answers[i];
            const active = i === qIdx && status !== "generating";
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 9, marginBottom: 5, background: active ? "#6366F112" : "transparent", border: active ? "1px solid #6366F128" : "1px solid transparent" }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, flexShrink: 0, background: ans ? scoreColor(ans.evaluation.totalScore) + "20" : active ? "#6366F120" : "#1e293b", color: ans ? scoreColor(ans.evaluation.totalScore) : active ? "#818cf8" : "#475569" }}>
                  {ans ? Math.round(ans.evaluation.totalScore / 10) * 10 === ans.evaluation.totalScore ? <Check size={10} /> : ans.evaluation.totalScore : i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: active ? "#e2e8f0" : "#64748b", fontWeight: active ? 600 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    Q{i + 1}: {q.topic}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main */}
        <div style={{ flex: 1, padding: "28px 32px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>
          {status === "generating" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 20, padding: 60 }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", border: "3px solid #6366F130", borderTop: "3px solid #6366F1", animation: "spin 1s linear infinite" }} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#e2e8f0", marginBottom: 6 }}>Generating your questions</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>AI is crafting {config.qCount} personalized {config.difficulty} questions...</div>
              </div>
            </div>
          )}

          {err && (
            <div style={{ background: "#EF444415", border: "1px solid #EF444440", borderRadius: 12, padding: "16px 20px", display: "flex", gap: 12, alignItems: "center" }}>
              <AlertCircle size={18} color="#EF4444" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ color: "#fca5a5", fontWeight: 600, fontSize: 13 }}>{err}</div>
                <button onClick={generate} style={{ color: "#6366F1", background: "none", border: "none", cursor: "pointer", fontSize: 12, marginTop: 4 }}>Retry →</button>
              </div>
            </div>
          )}

          {(status === "active" || status === "evaluating") && curQ && (
            <>
              {/* Progress bar */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, height: 3, background: "#1e293b", borderRadius: 2 }}>
                  <div style={{ width: `${((qIdx) / questions.length) * 100}%`, height: "100%", background: "linear-gradient(90deg, #6366F1, #06B6D4)", borderRadius: 2, transition: "width 0.4s" }} />
                </div>
                <span style={{ fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>{qIdx + 1} / {questions.length}</span>
              </div>

              {/* Terminal question card */}
              <div style={{ background: "#060d1f", border: "1px solid #1e3a5f", borderRadius: 14, overflow: "hidden" }}>
                <div style={{ background: "#0a1628", padding: "10px 18px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #1e293b" }}>
                  <div style={{ display: "flex", gap: 5 }}>
                    {["#FF5F57","#FFBD2E","#28CA41"].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />)}
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#475569", marginLeft: 8 }}>
                    interview.ai — Q{qIdx + 1}/{questions.length} [{curQ.topic}]
                  </span>
                </div>
                <div style={{ padding: 24 }}>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#6366F1", marginBottom: 14 }}>
                    $ interviewer --question {qIdx + 1} --topic {curQ.topic}
                  </div>
                  <TypingText text={curQ.question} onDone={() => setTypingDone(true)} />
                  {typingDone && curQ.followUp && (
                    <div style={{ marginTop: 14, padding: "10px 14px", background: "#6366F108", borderRadius: 8, border: "1px solid #6366F118" }}>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#475569" }}>// Follow-up to consider: </span>
                      <span style={{ fontSize: 12, color: "#64748b", fontStyle: "italic" }}>{curQ.followUp}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Prev feedback */}
              {prevAns && qIdx > 0 && (
                <div style={{ background: scoreColor(prevAns.evaluation.totalScore) + "10", border: `1px solid ${scoreColor(prevAns.evaluation.totalScore)}30`, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                  <CheckCircle size={15} color={scoreColor(prevAns.evaluation.totalScore)} style={{ flexShrink: 0 }} />
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor(prevAns.evaluation.totalScore) }}>Q{qIdx} scored {prevAns.evaluation.totalScore}/100 — </span>
                    <span style={{ fontSize: 12, color: "#64748b" }}>{prevAns.evaluation.feedback.substring(0, 100)}...</span>
                  </div>
                </div>
              )}

              {/* Answer box */}
              <div className="card" style={{ padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8 }}>Your Answer</label>
                  <span style={{ fontSize: 11, color: "#334155" }}>{text.length} chars · ~{Math.max(0, Math.round(text.split(" ").filter(Boolean).length / 130))} min read</span>
                </div>
                <textarea value={text} onChange={e => setText(e.target.value)} disabled={status === "evaluating"}
                  placeholder="Be thorough and structured. Explain your reasoning, use examples, cover edge cases. Think out loud..."
                  style={{ width: "100%", height: 170, padding: "14px", borderRadius: 10, fontSize: 13, lineHeight: 1.75, resize: "vertical", minHeight: 120 }} />
                {status === "evaluating" && (
                  <div style={{ marginTop: 12 }}>
                    <Dots text="AI is evaluating your answer" />
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setText("")} className="btn-g" style={{ padding: "8px 14px", borderRadius: 8, fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}>
                      <RotateCcw size={12} /> Clear
                    </button>
                    <button onClick={skip} className="btn-g" style={{ padding: "8px 14px", borderRadius: 8, fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}>
                      <SkipForward size={12} /> Skip
                    </button>
                  </div>
                  <button onClick={submitAnswer} disabled={!text.trim() || status === "evaluating"} className="btn-p" style={{ padding: "9px 22px", borderRadius: 9, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 7 }}>
                    {status === "evaluating"
                      ? <><div className="spin" style={{ width: 13, height: 13, border: "2px solid white3", borderTop: "2px solid white", borderRadius: "50%" }} />Evaluating</>
                      : <><Send size={13} />{qIdx + 1 === questions.length ? "Submit & Finish" : "Submit & Next"}</>}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── FEEDBACK PAGE ────────────────────────────────────────────────────────────
function FeedbackPage({ answers, config, onRestart, onDashboard }) {
  const [aiReport, setAiReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(true);
  const [expanded, setExpanded] = useState(null);

  const overall = avg(answers, "evaluation.totalScore") || Math.round(answers.reduce((a, b) => a + (b.evaluation?.totalScore || 0), 0) / answers.length);
  const technical = Math.round(answers.reduce((a, b) => a + (b.evaluation?.technicalScore || 0), 0) / answers.length);
  const communication = Math.round(answers.reduce((a, b) => a + (b.evaluation?.communicationScore || 0), 0) / answers.length);
  const confidence = Math.round(answers.reduce((a, b) => a + (b.evaluation?.confidenceScore || 0), 0) / answers.length);

  useEffect(() => { generateReport(); }, []);

  const generateReport = async () => {
    try {
      const qa = answers.map((a, i) =>
        `Q${i + 1} [${a.question.topic}]: "${a.question.question.substring(0, 100)}" | Score: ${a.evaluation?.totalScore}/100`
      ).join("\n");
      const sys = "You are an expert career coach and hiring manager. Return ONLY valid JSON, no markdown.";
      const prompt = `Provide post-interview coaching feedback.
Role: ${config.role.label} | Difficulty: ${config.difficulty}
Scores — Overall: ${overall}/100, Technical: ${technical}/100, Communication: ${communication}/100
Questions Summary:
${qa}
Return JSON: {"summary":"2-3 paragraph honest assessment of performance","strengths":["specific strength 1","specific strength 2","specific strength 3"],"improvements":["concrete improvement 1","concrete improvement 2","concrete improvement 3"],"resources":[{"title":"Resource","type":"book/course/article","why":"why helpful"}],"readiness":"Junior/Mid/Senior/Not yet ready","nextSteps":"Specific 30-day action plan in 2 sentences"}`;
      const res = await callAI([{ role: "user", content: prompt }], sys);
      setAiReport(safeParseJSON(res));
    } catch {
      setAiReport({ summary: "You completed the interview! Review the per-question breakdown below to identify key improvement areas.", strengths: ["Completed all questions", "Showed effort and engagement"], improvements: ["Deepen technical knowledge", "Practice structured communication", "Work on weak topics"], resources: [], readiness: "Keep practicing", nextSteps: "Focus on missed concepts from today's session. Practice daily for 30 minutes." });
    }
    setLoadingReport(false);
  };

  const emoji = overall >= 85 ? "🏆" : overall >= 70 ? "👍" : overall >= 55 ? "📈" : "💪";

  return (
    <div className="fade-up" style={{ padding: "28px 32px", maxWidth: 980, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ fontSize: 52, marginBottom: 10 }}>{emoji}</div>
        <h1 style={{ fontSize: 30, fontWeight: 900, color: "#f1f5f9", letterSpacing: -0.8, marginBottom: 6 }}>Interview Complete!</h1>
        <p style={{ color: "#64748b", fontSize: 15 }}>{config.role.label} · {config.difficulty} · {answers.length} Questions</p>
        <div style={{ display: "inline-block", marginTop: 10, padding: "4px 16px", borderRadius: 100, background: scoreColor(overall) + "18", border: `1px solid ${scoreColor(overall)}40`, color: scoreColor(overall), fontSize: 13, fontWeight: 700 }}>
          {scoreLabel(overall)}
        </div>
      </div>

      {/* Score Gauges */}
      <div className="card" style={{ padding: "28px 36px", marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, textAlign: "center", marginBottom: 24 }}>Performance Breakdown</h3>
        <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 20 }}>
          <ScoreGauge score={overall} label="Overall Score" size={128} />
          <ScoreGauge score={technical} label="Technical" size={128} />
          <ScoreGauge score={communication} label="Communication" size={128} />
          <ScoreGauge score={confidence} label="Confidence" size={128} />
        </div>
      </div>

      {/* AI Report */}
      {loadingReport ? (
        <div className="card" style={{ padding: 28, textAlign: "center", marginBottom: 20 }}>
          <Dots text="AI is generating your personalized coaching report" />
        </div>
      ) : aiReport && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <div className="card" style={{ padding: 22 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "#10B981", marginBottom: 14, display: "flex", alignItems: "center", gap: 7, textTransform: "uppercase", letterSpacing: 0.8 }}>
              <Trophy size={13} /> Key Strengths
            </h3>
            {(aiReport.strengths || []).map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: 13, color: "#94a3b8", marginBottom: 9 }}>
                <CheckCircle size={13} color="#10B981" style={{ marginTop: 2, flexShrink: 0 }} />{s}
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: 22 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "#F59E0B", marginBottom: 14, display: "flex", alignItems: "center", gap: 7, textTransform: "uppercase", letterSpacing: 0.8 }}>
              <Target size={13} /> Improvements
            </h3>
            {(aiReport.improvements || []).map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: 13, color: "#94a3b8", marginBottom: 9 }}>
                <ArrowRight size={13} color="#F59E0B" style={{ marginTop: 2, flexShrink: 0 }} />{s}
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: 22, gridColumn: "1/-1" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", display: "flex", alignItems: "center", gap: 7, textTransform: "uppercase", letterSpacing: 0.8 }}>
                <Brain size={13} color="#6366F1" /> AI Coach Assessment
              </h3>
              <span style={{ fontSize: 12, background: scoreColor(overall) + "18", color: scoreColor(overall), padding: "2px 10px", borderRadius: 100, fontWeight: 700 }}>
                {aiReport.readiness}
              </span>
            </div>
            <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7, marginBottom: 12 }}>{aiReport.summary}</p>
            <div style={{ background: "#6366F110", border: "1px solid #6366F125", borderRadius: 10, padding: "11px 15px" }}>
              <span style={{ fontSize: 11, color: "#818cf8", fontWeight: 700 }}>🎯 30-Day Plan: </span>
              <span style={{ fontSize: 12, color: "#64748b" }}>{aiReport.nextSteps}</span>
            </div>
          </div>
        </div>
      )}

      {/* Per-question breakdown */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid #1e293b" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>Question-by-Question Breakdown</h3>
        </div>
        {answers.map((a, i) => (
          <div key={i}>
            <button onClick={() => setExpanded(expanded === i ? null : i)} style={{ width: "100%", padding: "14px 22px", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid #0f172a", textAlign: "left" }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0, background: scoreColor(a.evaluation?.totalScore || 0) + "18", color: scoreColor(a.evaluation?.totalScore || 0) }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.question.question.substring(0, 85)}...</div>
                <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>Topic: {a.question.topic}</div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: scoreColor(a.evaluation?.totalScore || 0), minWidth: 36, textAlign: "right" }}>{a.evaluation?.totalScore || 0}</div>
              {expanded === i ? <ChevronUp size={14} color="#475569" /> : <ChevronDown size={14} color="#475569" />}
            </button>
            {expanded === i && (
              <div style={{ padding: "14px 22px 18px", borderBottom: "1px solid #1e293b", background: "#0a0f1e" }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: "#64748b", background: "#020817", borderRadius: 9, padding: "12px 14px", marginBottom: 12, lineHeight: 1.7, fontStyle: "italic" }}>
                  "{a.answer.substring(0, 200)}{a.answer.length > 200 ? "..." : ""}"
                </div>
                <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6, marginBottom: 12 }}>
                  <span style={{ color: "#818cf8", fontWeight: 700 }}>Feedback: </span>{a.evaluation?.feedback}
                </p>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                  {(a.evaluation?.strengths || []).map(s => <span key={s} style={{ background: "#10B98118", color: "#10B981", padding: "3px 10px", borderRadius: 100, fontSize: 11 }}>✓ {s}</span>)}
                  {(a.evaluation?.weaknesses || []).map(w => <span key={w} style={{ background: "#EF444418", color: "#EF4444", padding: "3px 10px", borderRadius: 100, fontSize: 11 }}>✗ {w}</span>)}
                  {(a.evaluation?.missedConcepts || []).map(m => <span key={m} style={{ background: "#F59E0B18", color: "#F59E0B", padding: "3px 10px", borderRadius: 100, fontSize: 11 }}>? {m}</span>)}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <button onClick={onDashboard} className="btn-g" style={{ padding: "11px 22px", borderRadius: 10, fontSize: 13, display: "flex", alignItems: "center", gap: 7 }}>
          <Home size={14} /> Dashboard
        </button>
        <button onClick={onRestart} className="btn-p" style={{ padding: "11px 26px", borderRadius: 10, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 7 }}>
          <RefreshCw size={14} /> Practice Again
        </button>
      </div>
    </div>
  );
}

// ─── ANALYTICS PAGE ───────────────────────────────────────────────────────────
function AnalyticsPage({ history, onBack }) {
  const done = history.filter(h => h.score);
  const trendData = done.map((h, i) => ({ n: `#${i + 1}`, overall: h.score, tech: h.tech, comm: h.comm, conf: h.conf }));
  const topicScores = [
    { t: "DSA", s: 76 }, { t: "System Design", s: 83 }, { t: "OOP", s: 78 },
    { t: "DBMS", s: 87 }, { t: "OS", s: 71 }, { t: "Networks", s: 68 },
  ];
  const roleData = Object.entries(done.reduce((acc, h) => {
    const k = h.role.replace(" Developer", "").replace(" Engineer", "");
    acc[k] = acc[k] || [];
    acc[k].push(h.score);
    return acc;
  }, {})).map(([r, ss]) => ({ r, avg: Math.round(ss.reduce((a, b) => a + b) / ss.length) }));

  const avgAll = done.length ? Math.round(done.reduce((a, b) => a + b.score, 0) / done.length) : 0;
  const best = done.length ? Math.max(...done.map(h => h.score)) : 0;

  return (
    <div className="fade-up" style={{ padding: "28px 32px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
        <button onClick={onBack} className="btn-g" style={{ padding: "7px 14px", borderRadius: 8, fontSize: 12 }}>← Back</button>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9", letterSpacing: -0.5 }}>Analytics Dashboard</h1>
          <p style={{ color: "#64748b", fontSize: 13, marginTop: 2 }}>{done.length} interviews analyzed</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 22 }}>
        <StatCard icon={Calendar} label="Total Sessions" value={done.length} color="#6366F1" />
        <StatCard icon={Target} label="Avg Score" value={`${avgAll}%`} sub={avgAll >= 75 ? "On track ✓" : "Keep going!"} color="#10B981" />
        <StatCard icon={Trophy} label="Best Score" value={`${best}%`} color="#F59E0B" />
        <StatCard icon={TrendingUp} label="Improvement" value="+15%" sub="vs first session" color="#06B6D4" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 20, marginBottom: 20 }}>
        <div className="card" style={{ padding: 22 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 18 }}>Score Progression</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="n" tick={{ fill: "#475569", fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fill: "#475569", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12, color: "#f1f5f9" }} />
              <Line type="monotone" dataKey="overall" stroke="#6366F1" strokeWidth={2.5} dot={{ fill: "#6366F1", r: 5 }} name="Overall" />
              <Line type="monotone" dataKey="tech" stroke="#06B6D4" strokeWidth={2} dot={{ fill: "#06B6D4", r: 4 }} name="Tech" />
              <Line type="monotone" dataKey="comm" stroke="#10B981" strokeWidth={2} dot={{ fill: "#10B981", r: 4 }} name="Comm" />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 14, marginTop: 10 }}>
            {[["#6366F1", "Overall"], ["#06B6D4", "Technical"], ["#10B981", "Comm."]].map(([c, l]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#64748b" }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />{l}
              </div>
            ))}
          </div>
        </div>
        <div className="card" style={{ padding: 22 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 18 }}>Topic Radar</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={topicScores}>
              <PolarGrid stroke="#1e293b" />
              <PolarAngleAxis dataKey="t" tick={{ fill: "#64748b", fontSize: 10 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "#334155", fontSize: 9 }} />
              <Radar dataKey="s" stroke="#6366F1" fill="#6366F1" fillOpacity={0.22} name="Score" />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {roleData.length > 0 && (
        <div className="card" style={{ padding: 22, marginBottom: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 18 }}>Avg Score by Role</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={roleData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="r" tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12, color: "#f1f5f9" }} />
              <Bar dataKey="avg" fill="#6366F1" radius={[5, 5, 0, 0]} name="Avg Score" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card">
        <div style={{ padding: "16px 22px", borderBottom: "1px solid #1e293b" }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>Full History</h3>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#0a0f1e" }}>
                {["Date", "Role", "Level", "Topics", "Tech", "Comm", "Conf", "Score"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: "#475569", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...done].reverse().map((h, i) => (
                <tr key={h.id} style={{ borderTop: "1px solid #1e293b" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#6366F105"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "13px 16px", color: "#64748b" }}>{fmtDate(h.date)}</td>
                  <td style={{ padding: "13px 16px", color: "#e2e8f0", fontWeight: 600 }}>{h.role}</td>
                  <td style={{ padding: "13px 16px" }}>
                    <span style={{ padding: "2px 9px", borderRadius: 100, fontSize: 10, fontWeight: 700, background: h.difficulty === "Hard" ? "#EF444418" : h.difficulty === "Medium" ? "#F59E0B18" : "#10B98118", color: h.difficulty === "Hard" ? "#EF4444" : h.difficulty === "Medium" ? "#F59E0B" : "#10B981" }}>
                      {h.difficulty}
                    </span>
                  </td>
                  <td style={{ padding: "13px 16px", color: "#64748b" }}>{h.topics.slice(0, 2).join(", ")}</td>
                  {[h.tech, h.comm, h.conf].map((v, j) => (
                    <td key={j} style={{ padding: "13px 16px", fontWeight: 700, color: scoreColor(v), fontSize: 13 }}>{v}</td>
                  ))}
                  <td style={{ padding: "13px 16px", fontWeight: 900, color: scoreColor(h.score), fontSize: 16 }}>{h.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("landing");
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [showAuth, setShowAuth] = useState(false);
  const [config, setConfig] = useState(null);
  const [completedAnswers, setCompletedAnswers] = useState([]);
  const [history, setHistory] = useState(MOCK_HISTORY);

  const handleLogin = (u) => { setUser(u); setShowAuth(false); setPage("dashboard"); };
  const handleLogout = () => { setUser(null); setPage("landing"); };
  const handleGetStarted = () => { if (user) setPage("setup"); else { setAuthMode("register"); setShowAuth(true); } };
  const handleStartInterview = (cfg) => { setConfig(cfg); setCompletedAnswers([]); setPage("interview"); };

  const handleComplete = (answers, cfg) => {
    setCompletedAnswers(answers);
    const score = Math.round(answers.reduce((a, b) => a + (b.evaluation?.totalScore || 0), 0) / answers.length);
    const newEntry = {
      id: Date.now(), date: new Date().toISOString().split("T")[0],
      role: cfg.role.label, difficulty: cfg.difficulty, score,
      tech: Math.round(answers.reduce((a, b) => a + (b.evaluation?.technicalScore || 0), 0) / answers.length),
      comm: Math.round(answers.reduce((a, b) => a + (b.evaluation?.communicationScore || 0), 0) / answers.length),
      conf: Math.round(answers.reduce((a, b) => a + (b.evaluation?.confidenceScore || 0), 0) / answers.length),
      topics: cfg.topics, qCount: answers.length,
    };
    setHistory(prev => [...prev, newEntry]);
    setPage("feedback");
  };

  const showNav = page !== "interview";

  return (
    <div style={{ minHeight: "100vh", background: "#020817", color: "#f1f5f9" }}>
      <style>{CSS}</style>
      {showNav && <Navbar user={user} page={page} onNav={setPage} onShowAuth={(m) => { setAuthMode(m); setShowAuth(true); }} onLogout={handleLogout} />}
      {page === "landing" && <LandingPage onStart={handleGetStarted} />}
      {page === "dashboard" && user && <DashboardPage user={user} history={history} onNewInterview={() => setPage("setup")} onAnalytics={() => setPage("analytics")} />}
      {page === "setup" && <SetupPage onStart={handleStartInterview} onBack={() => setPage(user ? "dashboard" : "landing")} />}
      {page === "interview" && config && <InterviewPage config={config} onComplete={handleComplete} onExit={() => setPage(user ? "dashboard" : "landing")} />}
      {page === "feedback" && config && <FeedbackPage answers={completedAnswers} config={config} onRestart={() => setPage("setup")} onDashboard={() => setPage(user ? "dashboard" : "landing")} />}
      {page === "analytics" && <AnalyticsPage history={history} onBack={() => setPage("dashboard")} />}
      {showAuth && <AuthModal mode={authMode} onClose={() => setShowAuth(false)} onLogin={handleLogin} />}
    </div>
  );
}
