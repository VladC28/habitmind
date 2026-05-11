import { useState, useEffect, useRef } from "react";

// ─── PUNE CHEIA TA AICI ───────────────────────────────────────────────────────
const GEMINI_API_KEY = "AIzaSyA-WzXbvJjD8RD0JTTGWCfKnRkc52oHZns";

// ─── Date helpers ─────────────────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().split("T")[0];

const DEFAULT_HABITS = [
  { id: 1, name: "Meditație", emoji: "🧘", color: "#A8D8B9" },
  { id: 2, name: "Citit 30 min", emoji: "📚", color: "#F9C784" },
  { id: 3, name: "Sport", emoji: "🏋️", color: "#F4A7B9" },
  { id: 4, name: "Fără telefon dimineața", emoji: "📵", color: "#A0C4FF" },
];

const days = ["L", "M", "M", "J", "V", "S", "D"];
const quotes = [
  "Fiecare zi mică construiește un viitor mare.",
  "Nu rata niciodată de două ori.",
  "Consistența bate motivația oricând.",
  "Progresul, nu perfecțiunea.",
];

// ─── localStorage ─────────────────────────────────────────────────────────────
function loadState() {
  try {
    const saved = localStorage.getItem("habitmind");
    return saved ? JSON.parse(saved) : null;
  } catch { return null; }
}

function saveState(state) {
  localStorage.setItem("habitmind", JSON.stringify(state));
}

function buildInitialState() {
  const saved = loadState();
  const today = todayStr();
  if (saved) {
    if (saved.lastDate !== today) {
      return { ...saved, lastDate: today, checkedToday: {} };
    }
    return saved;
  }
  return {
    lastDate: today,
    habits: DEFAULT_HABITS,
    checkedToday: {},
    streaks: { 1: 5, 2: 12, 3: 3, 4: 7 },
    weekHistory: {
      1: [true, true, false, true, true, false, false],
      2: [true, true, true, true, true, true, false],
      3: [false, true, false, true, false, false, false],
      4: [true, true, true, false, true, false, false],
    },
  };
}

const GROQ_API_KEY = "CHEIA_mea";

async function askGemini(prompt) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
    }),
  });
  const data = await res.json();
  console.log("Groq response:", data);
  return data.choices?.[0]?.message?.content || "Nu am putut genera un răspuns.";
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function HabitMind() {
  const [state, setState] = useState(buildInitialState);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showCoach, setShowCoach] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  const { habits, checkedToday, streaks, weekHistory } = state;

  useEffect(() => {
    saveState(state);
    setSavedMsg(true);
    const t = setTimeout(() => setSavedMsg(false), 1500);
    return () => clearTimeout(t);
  }, [state]);

  const completedCount = Object.values(checkedToday).filter(Boolean).length;
  const percent = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;
  const quote = quotes[new Date().getDate() % quotes.length];

  const toggleHabit = (id) => {
    const wasChecked = checkedToday[id];
    const newChecked = { ...checkedToday, [id]: !wasChecked };
    const newStreaks = { ...streaks };
    newStreaks[id] = wasChecked ? Math.max((streaks[id] || 1) - 1, 0) : (streaks[id] || 0) + 1;
    setState((prev) => ({ ...prev, checkedToday: newChecked, streaks: newStreaks }));
  };

  const addHabit = () => {
    if (!newHabitName.trim()) return;
    const colors = ["#A8D8B9", "#F9C784", "#F4A7B9", "#A0C4FF", "#D4B8E0", "#FFB347"];
    const emojis = ["⭐", "💡", "🎯", "🌱", "💪", "🔥"];
    const id = Date.now();
    const newHabit = {
      id, name: newHabitName.trim(),
      emoji: emojis[habits.length % emojis.length],
      color: colors[habits.length % colors.length],
    };
    setState((prev) => ({
      ...prev,
      habits: [...prev.habits, newHabit],
      streaks: { ...prev.streaks, [id]: 0 },
      weekHistory: { ...prev.weekHistory, [id]: [false, false, false, false, false, false, false] },
    }));
    setNewHabitName("");
    setShowAddForm(false);
  };

  const deleteHabit = (id) => {
    setState((prev) => ({ ...prev, habits: prev.habits.filter((h) => h.id !== id) }));
  };

  return (
    <div style={styles.root}>
      <div style={styles.bgOrb1} />
      <div style={styles.bgOrb2} />
      {savedMsg && <div style={styles.savedBadge}>✓ Salvat</div>}

      <div style={styles.app}>
        <header style={styles.header}>
          <div>
            <p style={styles.greeting}>Bună ziua 👋</p>
            <h1 style={styles.appName}>HabitMind</h1>
          </div>
          <button style={styles.coachBtn} onClick={() => setShowCoach(!showCoach)}>
            🧠 Coach AI
          </button>
        </header>

        {showCoach && (
          <CoachPanel
            habits={habits}
            checkedToday={checkedToday}
            streaks={streaks}
            completedCount={completedCount}
            total={habits.length}
          />
        )}

        <div style={styles.quoteCard}>
          <span style={styles.quoteIcon}>✦</span>
          <p style={styles.quoteText}>{quote}</p>
        </div>

        <nav style={styles.nav}>
          {["dashboard", "obiceiuri", "progres"].map((tab) => (
            <button
              key={tab}
              style={{ ...styles.navBtn, ...(activeTab === tab ? styles.navBtnActive : {}) }}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>

        {activeTab === "dashboard" && (
          <Dashboard habits={habits} checkedToday={checkedToday} toggleHabit={toggleHabit} streaks={streaks} percent={percent} completedCount={completedCount} />
        )}
        {activeTab === "obiceiuri" && (
          <HabitsManager habits={habits} streaks={streaks} deleteHabit={deleteHabit} showAddForm={showAddForm} setShowAddForm={setShowAddForm} newHabitName={newHabitName} setNewHabitName={setNewHabitName} addHabit={addHabit} />
        )}
        {activeTab === "progres" && (
          <Progress habits={habits} weekHistory={weekHistory} streaks={streaks} days={days} />
        )}
      </div>
    </div>
  );
}

// ─── Coach Panel cu Gemini ────────────────────────────────────────────────────
function CoachPanel({ habits, checkedToday, streaks, completedCount, total }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const bottomRef = useRef(null);

  // Mesaj de bun venit automat
  useEffect(() => {
    if (initialized) return;
    setInitialized(true);

    const completedNames = habits
      .filter((h) => checkedToday[h.id])
      .map((h) => h.name)
      .join(", ") || "niciunul încă";

    const topStreak = [...habits].sort((a, b) => (streaks[b.id] || 0) - (streaks[a.id] || 0))[0];

    const prompt = `Ești un coach de dezvoltare personală prietenos și motivant. 
Utilizatorul folosește o aplicație de tracking obiceiuri.
Situația lui azi: a completat ${completedCount} din ${total} obiceiuri (${completedNames}).
Cel mai bun streak al lui este "${topStreak?.name}" cu ${streaks[topStreak?.id] || 0} zile.
Salută-l scurt și motivant în română, în maxim 2 propoziții, și pune-i o întrebare deschisă despre ziua lui.`;

    setLoading(true);
    askGemini(prompt).then((text) => {
      setMessages([{ role: "coach", text }]);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    const completedNames = habits.filter((h) => checkedToday[h.id]).map((h) => h.name).join(", ") || "niciunul";
    const context = `Ești un coach de dezvoltare personală în română. 
Utilizatorul a completat azi: ${completedNames} (${completedCount}/${total} obiceiuri).
Răspunde scurt, empatic și motivant în română. Max 3 propoziții.
Mesajul utilizatorului: "${userMsg}"`;

    const reply = await askGemini(context);
    setMessages((prev) => [...prev, { role: "coach", text: reply }]);
    setLoading(false);
  };

  return (
    <div style={styles.coachPanel}>
      <p style={styles.coachTitle}>🧠 Coach AI</p>

      <div style={styles.chatBox}>
        {messages.map((m, i) => (
          <div key={i} style={{ ...styles.bubble, ...(m.role === "user" ? styles.bubbleUser : styles.bubbleCoach) }}>
            {m.text}
          </div>
        ))}
        {loading && (
          <div style={{ ...styles.bubble, ...styles.bubbleCoach, color: "#888" }}>
            ✦ Scrie...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={styles.chatInputRow}>
        <input
          style={styles.chatInput}
          placeholder="Scrie un mesaj..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button style={styles.sendBtn} onClick={sendMessage}>➤</button>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ habits, checkedToday, toggleHabit, streaks, percent, completedCount }) {
  return (
    <div style={styles.section}>
      <div style={styles.progressSummary}>
        <div style={styles.ringWrap}>
          <svg width="90" height="90" viewBox="0 0 90 90">
            <circle cx="45" cy="45" r="38" fill="none" stroke="#2a2a2a" strokeWidth="8" />
            <circle cx="45" cy="45" r="38" fill="none" stroke="#A8D8B9" strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 38}`}
              strokeDashoffset={`${2 * Math.PI * 38 * (1 - percent / 100)}`}
              strokeLinecap="round" transform="rotate(-90 45 45)"
              style={{ transition: "stroke-dashoffset 0.6s ease" }}
            />
            <text x="45" y="50" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="700">{percent}%</text>
          </svg>
        </div>
        <div>
          <h2 style={styles.summaryTitle}>Astăzi</h2>
          <p style={styles.summarySubtitle}>{completedCount} din {habits.length} obiceiuri</p>
          <p style={styles.summaryMood}>
            {percent === 100 ? "🔥 Zi perfectă!" : percent >= 50 ? "⚡ Bun progres" : "💪 Continuă!"}
          </p>
        </div>
      </div>

      <h3 style={styles.sectionTitle}>Check-in zilnic</h3>
      <div style={styles.habitList}>
        {habits.map((h) => (
          <div key={h.id}
            style={{ ...styles.habitCard, borderLeft: `4px solid ${h.color}`, opacity: checkedToday[h.id] ? 1 : 0.75 }}
            onClick={() => toggleHabit(h.id)}
          >
            <span style={styles.habitEmoji}>{h.emoji}</span>
            <div style={styles.habitInfo}>
              <p style={styles.habitName}>{h.name}</p>
              <p style={styles.habitStreak}>🔥 {streaks[h.id] || 0} zile streak</p>
            </div>
            <div style={{ ...styles.checkbox, background: checkedToday[h.id] ? h.color : "transparent", borderColor: h.color }}>
              {checkedToday[h.id] && <span style={styles.checkmark}>✓</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Habits Manager ───────────────────────────────────────────────────────────
function HabitsManager({ habits, streaks, deleteHabit, showAddForm, setShowAddForm, newHabitName, setNewHabitName, addHabit }) {
  return (
    <div style={styles.section}>
      <h3 style={styles.sectionTitle}>Obiceiurile tale</h3>
      {habits.map((h) => (
        <div key={h.id} style={{ ...styles.habitCard, borderLeft: `4px solid ${h.color}` }}>
          <span style={styles.habitEmoji}>{h.emoji}</span>
          <div style={styles.habitInfo}>
            <p style={styles.habitName}>{h.name}</p>
            <p style={styles.habitStreak}>🔥 Streak: {streaks[h.id] || 0} zile</p>
          </div>
          <button style={{ ...styles.editBtn, borderColor: "#ff6b6b", color: "#ff6b6b" }} onClick={() => deleteHabit(h.id)}>Șterge</button>
        </div>
      ))}
      {showAddForm ? (
        <div style={styles.addForm}>
          <input style={styles.addInput} placeholder="Numele obiceiului..." value={newHabitName}
            onChange={(e) => setNewHabitName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addHabit()} autoFocus />
          <div style={styles.addFormBtns}>
            <button style={styles.confirmBtn} onClick={addHabit}>Adaugă</button>
            <button style={styles.cancelBtn} onClick={() => setShowAddForm(false)}>Anulează</button>
          </div>
        </div>
      ) : (
        <button style={styles.addBtn} onClick={() => setShowAddForm(true)}>+ Adaugă obicei</button>
      )}
    </div>
  );
}

// ─── Progress ─────────────────────────────────────────────────────────────────
function Progress({ habits, weekHistory, streaks, days }) {
  const totalDone = habits.reduce((acc, h) => acc + (weekHistory[h.id] || []).filter(Boolean).length, 0);
  const totalPossible = habits.length * 7;
  const weekPercent = totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0;

  return (
    <div style={styles.section}>
      <div style={styles.weekSummary}>
        <p style={styles.weekSummaryText}>Săptămâna aceasta</p>
        <p style={styles.weekSummaryNum}>{weekPercent}% completat</p>
      </div>
      {habits.map((h) => (
        <div key={h.id} style={styles.progressRow}>
          <span style={styles.progressEmoji}>{h.emoji}</span>
          <p style={styles.progressName}>{h.name}</p>
          <div style={styles.weekDots}>
            {days.map((d, i) => (
              <div key={i} style={styles.dayCol}>
                <div style={{ ...styles.dot, background: (weekHistory[h.id] || [])[i] ? h.color : "#2a2a2a", boxShadow: (weekHistory[h.id] || [])[i] ? `0 0 8px ${h.color}80` : "none" }} />
                <span style={styles.dayLabel}>{d}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div style={styles.streakBoard}>
        <h3 style={styles.sectionTitle}>Top streak-uri</h3>
        {[...habits].sort((a, b) => (streaks[b.id] || 0) - (streaks[a.id] || 0)).map((h, i) => (
          <div key={h.id} style={styles.streakRow}>
            <span style={styles.streakRank}>#{i + 1}</span>
            <span style={styles.habitEmoji}>{h.emoji}</span>
            <p style={styles.progressName}>{h.name}</p>
            <span style={{ ...styles.streakBadge, background: h.color }}>🔥 {streaks[h.id] || 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  root: { minHeight: "100vh", background: "#111111", display: "flex", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", position: "relative", overflow: "hidden", padding: "0 0 40px 0" },
  bgOrb1: { position: "fixed", top: "-120px", right: "-80px", width: "350px", height: "350px", borderRadius: "50%", background: "radial-gradient(circle, #A8D8B920 0%, transparent 70%)", pointerEvents: "none" },
  bgOrb2: { position: "fixed", bottom: "-100px", left: "-60px", width: "280px", height: "280px", borderRadius: "50%", background: "radial-gradient(circle, #F9C78415 0%, transparent 70%)", pointerEvents: "none" },
  savedBadge: { position: "fixed", top: "16px", right: "16px", background: "#A8D8B9", color: "#111", padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", zIndex: 100, fontFamily: "'DM Sans', sans-serif" },
  app: { width: "100%", maxWidth: "420px", padding: "28px 20px", position: "relative", zIndex: 1 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" },
  greeting: { color: "#888", fontSize: "13px", margin: "0 0 2px 0", letterSpacing: "0.5px" },
  appName: { color: "#fff", fontSize: "28px", fontWeight: "800", margin: 0, letterSpacing: "-0.5px" },
  coachBtn: { background: "#1e1e1e", border: "1px solid #333", color: "#fff", borderRadius: "20px", padding: "8px 16px", fontSize: "13px", cursor: "pointer", fontFamily: "inherit" },
  coachPanel: { background: "#1a1a1a", border: "1px solid #2e2e2e", borderRadius: "16px", padding: "16px", marginBottom: "16px" },
  coachTitle: { color: "#A8D8B9", fontSize: "13px", fontWeight: "700", margin: "0 0 12px 0", letterSpacing: "0.5px" },
  chatBox: { maxHeight: "220px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", marginBottom: "12px" },
  bubble: { padding: "10px 14px", borderRadius: "14px", fontSize: "14px", lineHeight: 1.5, maxWidth: "85%" },
  bubbleCoach: { background: "#222", color: "#ddd", alignSelf: "flex-start" },
  bubbleUser: { background: "#A8D8B9", color: "#111", alignSelf: "flex-end", fontWeight: "600" },
  chatInputRow: { display: "flex", gap: "8px" },
  chatInput: { flex: 1, background: "#111", border: "1px solid #333", borderRadius: "10px", padding: "10px 12px", color: "#fff", fontSize: "14px", fontFamily: "inherit", outline: "none" },
  sendBtn: { background: "#A8D8B9", border: "none", borderRadius: "10px", padding: "10px 14px", color: "#111", fontSize: "16px", cursor: "pointer", fontWeight: "700" },
  quoteCard: { background: "linear-gradient(135deg, #1c1c1c, #222)", border: "1px solid #2a2a2a", borderRadius: "16px", padding: "14px 18px", display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" },
  quoteIcon: { color: "#A8D8B9", fontSize: "16px" },
  quoteText: { color: "#aaa", fontSize: "13px", margin: 0, fontStyle: "italic", lineHeight: 1.5 },
  nav: { display: "flex", gap: "8px", marginBottom: "24px", background: "#1a1a1a", padding: "6px", borderRadius: "14px", border: "1px solid #2a2a2a" },
  navBtn: { flex: 1, padding: "9px 0", borderRadius: "10px", border: "none", background: "transparent", color: "#666", fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" },
  navBtnActive: { background: "#2a2a2a", color: "#fff" },
  section: { display: "flex", flexDirection: "column", gap: "12px" },
  sectionTitle: { color: "#888", fontSize: "11px", fontWeight: "700", letterSpacing: "1.5px", textTransform: "uppercase", margin: "4px 0 2px 0" },
  progressSummary: { display: "flex", alignItems: "center", gap: "20px", background: "#1a1a1a", borderRadius: "20px", padding: "20px", border: "1px solid #2a2a2a", marginBottom: "4px" },
  ringWrap: { flexShrink: 0 },
  summaryTitle: { color: "#fff", fontSize: "20px", fontWeight: "700", margin: "0 0 4px 0" },
  summarySubtitle: { color: "#888", fontSize: "13px", margin: "0 0 6px 0" },
  summaryMood: { color: "#A8D8B9", fontSize: "14px", fontWeight: "600", margin: 0 },
  habitList: { display: "flex", flexDirection: "column", gap: "10px" },
  habitCard: { display: "flex", alignItems: "center", gap: "14px", background: "#1a1a1a", borderRadius: "14px", padding: "14px 16px", cursor: "pointer", border: "1px solid #2a2a2a", transition: "background 0.2s" },
  habitEmoji: { fontSize: "22px", width: "28px", textAlign: "center" },
  habitInfo: { flex: 1 },
  habitName: { color: "#fff", fontSize: "15px", fontWeight: "600", margin: "0 0 3px 0" },
  habitStreak: { color: "#666", fontSize: "12px", margin: 0 },
  checkbox: { width: "26px", height: "26px", borderRadius: "8px", border: "2px solid", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" },
  checkmark: { color: "#111", fontWeight: "800", fontSize: "14px" },
  editBtn: { background: "transparent", borderRadius: "8px", border: "1px solid", padding: "5px 12px", fontSize: "12px", cursor: "pointer", fontFamily: "inherit", fontWeight: "600" },
  addForm: { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "14px", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" },
  addInput: { background: "#111", border: "1px solid #333", borderRadius: "10px", padding: "10px 14px", color: "#fff", fontSize: "14px", fontFamily: "inherit", outline: "none" },
  addFormBtns: { display: "flex", gap: "8px" },
  confirmBtn: { flex: 1, background: "#A8D8B9", border: "none", borderRadius: "10px", padding: "10px", color: "#111", fontSize: "14px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" },
  cancelBtn: { flex: 1, background: "transparent", border: "1px solid #333", borderRadius: "10px", padding: "10px", color: "#666", fontSize: "14px", cursor: "pointer", fontFamily: "inherit" },
  addBtn: { background: "transparent", border: "2px dashed #333", borderRadius: "14px", padding: "14px", color: "#555", fontSize: "14px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit", marginTop: "4px" },
  progressRow: { display: "flex", alignItems: "center", gap: "10px", background: "#1a1a1a", borderRadius: "14px", padding: "12px 16px", border: "1px solid #2a2a2a" },
  progressEmoji: { fontSize: "18px" },
  progressName: { color: "#ccc", fontSize: "13px", fontWeight: "600", margin: 0, flex: 1, minWidth: "80px" },
  weekDots: { display: "flex", gap: "6px" },
  dayCol: { display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" },
  dot: { width: "20px", height: "20px", borderRadius: "6px", transition: "all 0.2s" },
  dayLabel: { color: "#555", fontSize: "9px", fontWeight: "700" },
  weekSummary: { background: "linear-gradient(135deg, #1c1c1c, #222)", border: "1px solid #2a2a2a", borderRadius: "16px", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  weekSummaryText: { color: "#888", fontSize: "13px", margin: 0 },
  weekSummaryNum: { color: "#A8D8B9", fontSize: "20px", fontWeight: "800", margin: 0 },
  streakBoard: { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "16px", padding: "16px", display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" },
  streakRow: { display: "flex", alignItems: "center", gap: "10px" },
  streakRank: { color: "#555", fontSize: "12px", fontWeight: "700", width: "24px" },
  streakBadge: { borderRadius: "20px", padding: "4px 10px", fontSize: "12px", fontWeight: "700", color: "#111" },
};
