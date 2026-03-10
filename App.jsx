import { useState, useEffect, useCallback } from "react";

// ─── Helpers ───
const today = () => new Date().toISOString().slice(0, 10);
const PHASES = ["menstrual", "follicular", "ovulation", "luteal"];
const PHASE_INFO = {
  menstrual: { emoji: "🌙", color: "#8B5CF6", label: "Menstrual", days: "Days 1–5", tip: "Rest & replenish. Focus on iron-rich foods and warmth." },
  follicular: { emoji: "🌱", color: "#10B981", label: "Follicular", days: "Days 6–12", tip: "Energy is rising. Great time for fresh, lighter meals." },
  ovulation: { emoji: "☀️", color: "#F59E0B", label: "Ovulation", days: "Days 13–16", tip: "Peak energy. Your body handles carbs well right now." },
  luteal: { emoji: "🍂", color: "#E88D67", label: "Luteal", days: "Days 17–28", tip: "Cravings are normal. Prioritize magnesium and complex carbs." },
};
const MOODS = ["😊", "😐", "😔", "😤", "😴", "🥰", "😰"];
const ENERGY_LEVELS = ["🔋", "🪫", "⚡"];
const SYMPTOMS = ["Cramps", "Bloating", "Headache", "Fatigue", "Cravings", "Breast tenderness", "Back pain", "Mood swings", "Clear skin", "Good sleep"];

function getPhase(periodStart, dayOfCycle) {
  if (!periodStart || !dayOfCycle) return null;
  if (dayOfCycle <= 5) return "menstrual";
  if (dayOfCycle <= 12) return "follicular";
  if (dayOfCycle <= 16) return "ovulation";
  return "luteal";
}

function getDayOfCycle(periodStart) {
  if (!periodStart) return null;
  const start = new Date(periodStart);
  const now = new Date(today());
  const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
  return diff > 0 ? diff : null;
}

function loadData(key, fallback) {
  try {
    const d = localStorage.getItem(`noura_${key}`);
    return d ? JSON.parse(d) : fallback;
  } catch { return fallback; }
}
function saveData(key, value) {
  localStorage.setItem(`noura_${key}`, JSON.stringify(value));
}

// ─── Components ───

function TabBar({ active, onChange }) {
  const tabs = [
    { id: "journal", icon: "📝", label: "Journal" },
    { id: "meals", icon: "🍽️", label: "Meals" },
    { id: "cycle", icon: "🌙", label: "Cycle" },
    { id: "weight", icon: "⚖️", label: "Weight" },
  ];
  return (
    <div style={styles.tabBar}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          style={{ ...styles.tab, ...(active === t.id ? styles.tabActive : {}) }}>
          <span style={{ fontSize: 20 }}>{t.icon}</span>
          <span style={{ fontSize: 11, marginTop: 2, color: active === t.id ? "#7C5CB5" : "#999" }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

function PhaseCard({ periodStart }) {
  const day = getDayOfCycle(periodStart);
  const phase = getPhase(periodStart, day);
  if (!phase) return (
    <div style={styles.phaseCard}>
      <p style={{ color: "#999", textAlign: "center" }}>Mark your last period start date in the Cycle tab to see your phase</p>
    </div>
  );
  const info = PHASE_INFO[phase];
  return (
    <div style={{ ...styles.phaseCard, borderLeft: `4px solid ${info.color}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span style={{ fontSize: 24 }}>{info.emoji}</span>
          <span style={{ fontSize: 18, fontWeight: 600, marginLeft: 8, color: "#2D2D2D" }}>{info.label} Phase</span>
        </div>
        <span style={{ fontSize: 14, color: "#888" }}>Day {day}</span>
      </div>
      <p style={{ fontSize: 14, color: "#666", marginTop: 8, lineHeight: 1.5 }}>{info.tip}</p>
    </div>
  );
}

// ─── Journal Tab ───
function JournalTab({ periodStart }) {
  const [entries, setEntries] = useState(() => loadData("journal", {}));
  const [date, setDate] = useState(today());
  const entry = entries[date] || {};

  const update = (field, value) => {
    const updated = { ...entries, [date]: { ...entry, [field]: value, date } };
    setEntries(updated);
    saveData("journal", updated);
  };

  const toggleSymptom = (s) => {
    const current = entry.symptoms || [];
    const updated = current.includes(s) ? current.filter(x => x !== s) : [...current, s];
    update("symptoms", updated);
  };

  return (
    <div style={styles.content}>
      <PhaseCard periodStart={periodStart} />

      <div style={styles.dateNav}>
        <button style={styles.dateBtn} onClick={() => {
          const d = new Date(date); d.setDate(d.getDate() - 1); setDate(d.toISOString().slice(0, 10));
        }}>←</button>
        <span style={{ fontWeight: 600, color: "#2D2D2D" }}>
          {new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
        </span>
        <button style={styles.dateBtn} onClick={() => {
          const d = new Date(date); d.setDate(d.getDate() + 1); setDate(d.toISOString().slice(0, 10));
        }}>→</button>
      </div>

      <div style={styles.card}>
        <label style={styles.label}>How are you feeling?</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {MOODS.map(m => (
            <button key={m} onClick={() => update("mood", m)}
              style={{ ...styles.emojiBtn, ...(entry.mood === m ? styles.emojiBtnActive : {}) }}>{m}</button>
          ))}
        </div>
      </div>

      <div style={styles.card}>
        <label style={styles.label}>Energy level</label>
        <div style={{ display: "flex", gap: 8 }}>
          {ENERGY_LEVELS.map((e, i) => (
            <button key={e} onClick={() => update("energy", i)}
              style={{ ...styles.emojiBtn, ...styles.energyBtn, ...(entry.energy === i ? styles.emojiBtnActive : {}) }}>
              {e} <span style={{ fontSize: 12 }}>{["Low", "Medium", "High"][i]}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={styles.card}>
        <label style={styles.label}>Symptoms</label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {SYMPTOMS.map(s => (
            <button key={s} onClick={() => toggleSymptom(s)}
              style={{ ...styles.symptomBtn, ...((entry.symptoms || []).includes(s) ? styles.symptomBtnActive : {}) }}>{s}</button>
          ))}
        </div>
      </div>

      <div style={styles.card}>
        <label style={styles.label}>Notes</label>
        <textarea
          value={entry.notes || ""}
          onChange={e => update("notes", e.target.value)}
          placeholder="Anything else you want to remember..."
          style={styles.textarea}
          rows={3}
        />
      </div>
    </div>
  );
}

// ─── Meals Tab ───
function MealsTab({ calorieTarget }) {
  const [meals, setMeals] = useState(() => loadData("meals", {}));
  const [date, setDate] = useState(today());
  const [adding, setAdding] = useState(false);
  const [mealName, setMealName] = useState("");
  const [mealCals, setMealCals] = useState("");
  const [mealType, setMealType] = useState("breakfast");

  const dayMeals = meals[date] || [];
  const totalCals = dayMeals.reduce((sum, m) => sum + (m.calories || 0), 0);
  const target = calorieTarget || 1800;
  const pct = Math.min((totalCals / target) * 100, 100);
  const over = totalCals > target;

  const addMeal = () => {
    if (!mealName.trim()) return;
    const updated = { ...meals, [date]: [...dayMeals, { name: mealName, calories: parseInt(mealCals) || 0, type: mealType, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }] };
    setMeals(updated);
    saveData("meals", updated);
    setMealName(""); setMealCals(""); setAdding(false);
  };

  const removeMeal = (idx) => {
    const updated = { ...meals, [date]: dayMeals.filter((_, i) => i !== idx) };
    setMeals(updated);
    saveData("meals", updated);
  };

  // Circular progress
  const r = 54, stroke = 10, circ = 2 * Math.PI * r;

  return (
    <div style={styles.content}>
      <div style={styles.dateNav}>
        <button style={styles.dateBtn} onClick={() => {
          const d = new Date(date); d.setDate(d.getDate() - 1); setDate(d.toISOString().slice(0, 10));
        }}>←</button>
        <span style={{ fontWeight: 600, color: "#2D2D2D" }}>
          {new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
        </span>
        <button style={styles.dateBtn} onClick={() => {
          const d = new Date(date); d.setDate(d.getDate() + 1); setDate(d.toISOString().slice(0, 10));
        }}>→</button>
      </div>

      <div style={{ ...styles.card, display: "flex", alignItems: "center", gap: 20 }}>
        <svg width="130" height="130" viewBox="0 0 130 130">
          <circle cx="65" cy="65" r={r} fill="none" stroke="#F0EDF5" strokeWidth={stroke} />
          <circle cx="65" cy="65" r={r} fill="none"
            stroke={over ? "#E85D5D" : "#7C5CB5"}
            strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={circ - (pct / 100) * circ}
            transform="rotate(-90 65 65)" style={{ transition: "stroke-dashoffset 0.5s ease" }} />
          <text x="65" y="60" textAnchor="middle" style={{ fontSize: 22, fontWeight: 700, fill: over ? "#E85D5D" : "#2D2D2D" }}>{totalCals}</text>
          <text x="65" y="78" textAnchor="middle" style={{ fontSize: 12, fill: "#999" }}>/ {target} kcal</text>
        </svg>
        <div>
          {over && <p style={{ color: "#E85D5D", fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>Over target by {totalCals - target} kcal</p>}
          <p style={{ color: "#888", fontSize: 13, margin: 0 }}>{dayMeals.length} meal{dayMeals.length !== 1 ? "s" : ""} logged today</p>
        </div>
      </div>

      {dayMeals.map((m, i) => (
        <div key={i} style={{ ...styles.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: 12, color: "#7C5CB5", textTransform: "uppercase", fontWeight: 600 }}>{m.type}</span>
            <p style={{ margin: "4px 0 0", fontWeight: 500, color: "#2D2D2D" }}>{m.name}</p>
            {m.time && <span style={{ fontSize: 12, color: "#BBB" }}>{m.time}</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontWeight: 600, color: "#555" }}>{m.calories} kcal</span>
            <button onClick={() => removeMeal(i)} style={styles.removeBtn}>×</button>
          </div>
        </div>
      ))}

      {adding ? (
        <div style={styles.card}>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            {["breakfast", "lunch", "dinner", "snack"].map(t => (
              <button key={t} onClick={() => setMealType(t)}
                style={{ ...styles.symptomBtn, ...(mealType === t ? styles.symptomBtnActive : {}), textTransform: "capitalize" }}>{t}</button>
            ))}
          </div>
          <input value={mealName} onChange={e => setMealName(e.target.value)} placeholder="What did you eat?" style={styles.input} />
          <input value={mealCals} onChange={e => setMealCals(e.target.value)} placeholder="Calories (estimate)" type="number" style={{ ...styles.input, marginTop: 8 }} />
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button onClick={addMeal} style={styles.primaryBtn}>Add meal</button>
            <button onClick={() => setAdding(false)} style={styles.secondaryBtn}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={styles.addBtn}>+ Log a meal</button>
      )}
    </div>
  );
}

// ─── Cycle Tab ───
function CycleTab({ periodStart, setPeriodStart, cycleLength, setCycleLength }) {
  const [periods, setPeriods] = useState(() => loadData("periods", []));
  const [newDate, setNewDate] = useState(today());
  const day = getDayOfCycle(periodStart);
  const phase = getPhase(periodStart, day);

  const logPeriod = () => {
    const updated = [...periods, newDate].sort().reverse();
    setPeriods(updated);
    saveData("periods", updated);
    setPeriodStart(newDate);
    saveData("periodStart", newDate);
  };

  return (
    <div style={styles.content}>
      <div style={styles.card}>
        <label style={styles.label}>Last period start date</label>
        <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} style={styles.input} />
        <button onClick={logPeriod} style={{ ...styles.primaryBtn, marginTop: 10 }}>Mark period start</button>
      </div>

      <div style={styles.card}>
        <label style={styles.label}>Average cycle length</label>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input type="number" value={cycleLength} onChange={e => { setCycleLength(parseInt(e.target.value) || 28); saveData("cycleLength", parseInt(e.target.value) || 28); }}
            style={{ ...styles.input, width: 80 }} />
          <span style={{ color: "#888", fontSize: 14 }}>days</span>
        </div>
      </div>

      {phase && (
        <div style={styles.card}>
          <div style={{ textAlign: "center", padding: 10 }}>
            <span style={{ fontSize: 48 }}>{PHASE_INFO[phase].emoji}</span>
            <h3 style={{ margin: "8px 0 4px", color: PHASE_INFO[phase].color }}>{PHASE_INFO[phase].label} Phase</h3>
            <p style={{ color: "#888", margin: "0 0 4px" }}>Day {day} of your cycle</p>
            <p style={{ color: "#666", fontSize: 14, lineHeight: 1.5 }}>{PHASE_INFO[phase].tip}</p>
          </div>

          {/* Phase visualization */}
          <div style={{ display: "flex", gap: 4, marginTop: 16 }}>
            {PHASES.map(p => (
              <div key={p} style={{
                flex: 1, height: 8, borderRadius: 4,
                background: p === phase ? PHASE_INFO[p].color : "#F0EDF5",
                transition: "background 0.3s"
              }} />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            {PHASES.map(p => (
              <span key={p} style={{ fontSize: 10, color: p === phase ? PHASE_INFO[p].color : "#CCC" }}>{PHASE_INFO[p].label}</span>
            ))}
          </div>
        </div>
      )}

      {periods.length > 0 && (
        <div style={styles.card}>
          <label style={styles.label}>Period history</label>
          {periods.slice(0, 6).map((d, i) => (
            <div key={i} style={{ padding: "6px 0", borderBottom: i < periods.length - 1 ? "1px solid #F0EDF5" : "none", color: "#555", fontSize: 14 }}>
              🩸 {new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Weight Tab ───
function WeightTab() {
  const [entries, setEntries] = useState(() => loadData("weight", []));
  const [value, setValue] = useState("");
  const [date, setDate] = useState(today());

  const addWeight = () => {
    if (!value) return;
    const updated = [...entries.filter(e => e.date !== date), { date, value: parseFloat(value) }]
      .sort((a, b) => a.date.localeCompare(b.date));
    setEntries(updated);
    saveData("weight", updated);
    setValue("");
  };

  const removeEntry = (d) => {
    const updated = entries.filter(e => e.date !== d);
    setEntries(updated);
    saveData("weight", updated);
  };

  const last7 = entries.slice(-7);
  const minW = last7.length ? Math.min(...last7.map(e => e.value)) - 1 : 0;
  const maxW = last7.length ? Math.max(...last7.map(e => e.value)) + 1 : 100;
  const range = maxW - minW || 1;

  return (
    <div style={styles.content}>
      <div style={styles.card}>
        <label style={styles.label}>Log your weight</label>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...styles.input, flex: 1 }} />
          <input type="number" step="0.1" value={value} onChange={e => setValue(e.target.value)}
            placeholder="kg" style={{ ...styles.input, width: 80 }} />
          <button onClick={addWeight} style={styles.primaryBtn}>Log</button>
        </div>
      </div>

      {last7.length > 1 && (
        <div style={styles.card}>
          <label style={styles.label}>Last 7 entries</label>
          <svg width="100%" height="140" viewBox="0 0 300 140" style={{ marginTop: 8 }}>
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
              <g key={i}>
                <line x1="40" y1={10 + pct * 110} x2="290" y2={10 + pct * 110} stroke="#F0EDF5" strokeWidth="1" />
                <text x="35" y={14 + pct * 110} textAnchor="end" style={{ fontSize: 10, fill: "#BBB" }}>
                  {(maxW - pct * range).toFixed(1)}
                </text>
              </g>
            ))}
            {/* Line */}
            <polyline
              points={last7.map((e, i) => {
                const x = 40 + (i / (last7.length - 1)) * 250;
                const y = 10 + ((maxW - e.value) / range) * 110;
                return `${x},${y}`;
              }).join(" ")}
              fill="none" stroke="#7C5CB5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            />
            {/* Dots & labels */}
            {last7.map((e, i) => {
              const x = 40 + (i / (last7.length - 1)) * 250;
              const y = 10 + ((maxW - e.value) / range) * 110;
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r="4" fill="#7C5CB5" />
                  <text x={x} y={135} textAnchor="middle" style={{ fontSize: 9, fill: "#BBB" }}>
                    {new Date(e.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {entries.length > 0 && (
        <div style={styles.card}>
          <label style={styles.label}>All entries</label>
          {[...entries].reverse().map((e, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #F0EDF5" }}>
              <span style={{ color: "#555", fontSize: 14 }}>
                {new Date(e.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontWeight: 600, color: "#2D2D2D" }}>{e.value} kg</span>
                <button onClick={() => removeEntry(e.date)} style={styles.removeBtn}>×</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Onboarding ───
function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [calTarget, setCalTarget] = useState("1800");
  const [periodDate, setPeriodDate] = useState("");
  const [cycleLen, setCycleLen] = useState("28");

  const finish = () => {
    const profile = { name, calorieTarget: parseInt(calTarget) || 1800, periodStart: periodDate, cycleLength: parseInt(cycleLen) || 28 };
    saveData("profile", profile);
    onComplete(profile);
  };

  const slides = [
    // Welcome
    <div key={0} style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🌙</div>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: "#2D2D2D", marginBottom: 8, fontFamily: "'DM Serif Display', serif" }}>Welcome to Noura</h1>
      <p style={{ color: "#888", fontSize: 16, lineHeight: 1.6, maxWidth: 280, margin: "0 auto" }}>
        Your cycle-aware companion for nutrition and wellbeing. Let's set a few things up.
      </p>
      <button onClick={() => setStep(1)} style={{ ...styles.primaryBtn, marginTop: 32, padding: "14px 40px", fontSize: 16 }}>Get started</button>
    </div>,
    // Name & calories
    <div key={1} style={{ padding: 20 }}>
      <h2 style={{ fontSize: 22, fontWeight: 600, color: "#2D2D2D", marginBottom: 20 }}>About you</h2>
      <label style={styles.label}>Your name</label>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="First name" style={styles.input} />
      <label style={{ ...styles.label, marginTop: 16 }}>Daily calorie target</label>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input type="number" value={calTarget} onChange={e => setCalTarget(e.target.value)} style={{ ...styles.input, width: 100 }} />
        <span style={{ color: "#888" }}>kcal / day</span>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
        <button onClick={() => setStep(0)} style={styles.secondaryBtn}>Back</button>
        <button onClick={() => setStep(2)} style={styles.primaryBtn}>Next</button>
      </div>
    </div>,
    // Cycle info
    <div key={2} style={{ padding: 20 }}>
      <h2 style={{ fontSize: 22, fontWeight: 600, color: "#2D2D2D", marginBottom: 20 }}>Your cycle</h2>
      <label style={styles.label}>When did your last period start?</label>
      <input type="date" value={periodDate} onChange={e => setPeriodDate(e.target.value)} style={styles.input} />
      <label style={{ ...styles.label, marginTop: 16 }}>Average cycle length</label>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input type="number" value={cycleLen} onChange={e => setCycleLen(e.target.value)} style={{ ...styles.input, width: 80 }} />
        <span style={{ color: "#888" }}>days</span>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
        <button onClick={() => setStep(1)} style={styles.secondaryBtn}>Back</button>
        <button onClick={finish} style={styles.primaryBtn}>Start my journey</button>
      </div>
    </div>,
  ];

  return <div style={styles.onboarding}>{slides[step]}</div>;
}

// ─── Main App ───
export default function App() {
  const [profile, setProfile] = useState(() => loadData("profile", null));
  const [tab, setTab] = useState("journal");
  const [periodStart, setPeriodStart] = useState(() => profile?.periodStart || loadData("periodStart", ""));
  const [cycleLength, setCycleLength] = useState(() => profile?.cycleLength || loadData("cycleLength", 28));

  const handleReset = () => {
    if (confirm("Reset all Noura data? This cannot be undone.")) {
      Object.keys(localStorage).filter(k => k.startsWith("noura_")).forEach(k => localStorage.removeItem(k));
      setProfile(null);
      setPeriodStart("");
      setCycleLength(28);
      setTab("journal");
    }
  };

  if (!profile) return <Onboarding onComplete={(p) => { setProfile(p); setPeriodStart(p.periodStart); setCycleLength(p.cycleLength); }} />;

  return (
    <div style={styles.app}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.logo}>Noura</h1>
          <p style={{ fontSize: 13, color: "#A89BC2", margin: 0 }}>Hi {profile.name} 🌙</p>
        </div>
        <button onClick={handleReset} style={styles.resetBtn} title="Reset all data">↺</button>
      </div>

      {/* Content */}
      {tab === "journal" && <JournalTab periodStart={periodStart} />}
      {tab === "meals" && <MealsTab calorieTarget={profile.calorieTarget} />}
      {tab === "cycle" && <CycleTab periodStart={periodStart} setPeriodStart={setPeriodStart} cycleLength={cycleLength} setCycleLength={setCycleLength} />}
      {tab === "weight" && <WeightTab />}

      <TabBar active={tab} onChange={setTab} />
    </div>
  );
}

// ─── Styles ───
const styles = {
  app: {
    maxWidth: 430, margin: "0 auto", minHeight: "100dvh", background: "#FAFAF8",
    fontFamily: "'DM Sans', -apple-system, sans-serif", position: "relative", paddingBottom: 80,
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "16px 20px 12px", background: "#2D2D2D", color: "#fff",
  },
  logo: {
    fontSize: 24, fontWeight: 700, margin: 0, fontFamily: "'DM Serif Display', serif", color: "#E8DFF5",
  },
  resetBtn: {
    background: "none", border: "none", color: "#A89BC2", fontSize: 22, cursor: "pointer", padding: 4,
  },
  content: { padding: "12px 16px" },
  tabBar: {
    position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
    width: "100%", maxWidth: 430, display: "flex", justifyContent: "space-around",
    background: "#fff", borderTop: "1px solid #F0EDF5", padding: "8px 0 env(safe-area-inset-bottom, 8px)",
    zIndex: 100,
  },
  tab: {
    display: "flex", flexDirection: "column", alignItems: "center", background: "none",
    border: "none", cursor: "pointer", padding: "4px 12px", gap: 0,
  },
  tabActive: { },
  phaseCard: {
    background: "#fff", borderRadius: 14, padding: 16, marginBottom: 12,
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
  },
  card: {
    background: "#fff", borderRadius: 14, padding: 16, marginBottom: 12,
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
  },
  label: { display: "block", fontSize: 14, fontWeight: 600, color: "#555", marginBottom: 8 },
  input: {
    width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E8E2F0",
    fontSize: 15, outline: "none", boxSizing: "border-box", fontFamily: "inherit",
    background: "#FAFAF8",
  },
  textarea: {
    width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E8E2F0",
    fontSize: 15, outline: "none", boxSizing: "border-box", fontFamily: "inherit",
    resize: "vertical", background: "#FAFAF8",
  },
  emojiBtn: {
    fontSize: 28, background: "#F8F5FC", border: "2px solid transparent", borderRadius: 12,
    padding: "8px 12px", cursor: "pointer", transition: "all 0.15s",
  },
  emojiBtnActive: { borderColor: "#7C5CB5", background: "#F0EAFC" },
  energyBtn: { display: "flex", flexDirection: "column", alignItems: "center", gap: 2, fontSize: 24, flex: 1 },
  symptomBtn: {
    padding: "6px 14px", borderRadius: 20, border: "1.5px solid #E8E2F0", background: "#FAFAF8",
    fontSize: 13, cursor: "pointer", color: "#666", transition: "all 0.15s",
  },
  symptomBtnActive: { background: "#7C5CB5", color: "#fff", borderColor: "#7C5CB5" },
  primaryBtn: {
    padding: "10px 20px", borderRadius: 10, border: "none", background: "#7C5CB5",
    color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  },
  secondaryBtn: {
    padding: "10px 20px", borderRadius: 10, border: "1.5px solid #E8E2F0", background: "#fff",
    color: "#666", fontSize: 15, cursor: "pointer", fontFamily: "inherit",
  },
  addBtn: {
    width: "100%", padding: "14px", borderRadius: 12, border: "2px dashed #E8E2F0",
    background: "transparent", color: "#7C5CB5", fontSize: 15, fontWeight: 600,
    cursor: "pointer", fontFamily: "inherit",
  },
  removeBtn: {
    background: "none", border: "none", color: "#CCC", fontSize: 20, cursor: "pointer", padding: "0 4px",
  },
  dateNav: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "8px 0 12px",
  },
  dateBtn: {
    background: "#F8F5FC", border: "none", borderRadius: 8, padding: "6px 14px",
    fontSize: 18, cursor: "pointer", color: "#7C5CB5",
  },
  onboarding: {
    maxWidth: 430, margin: "0 auto", minHeight: "100dvh", background: "#FAFAF8",
    fontFamily: "'DM Sans', -apple-system, sans-serif", display: "flex",
    alignItems: "center", justifyContent: "center",
  },
};
