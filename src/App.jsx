import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { ROLES, CRITERIA } from "./data/roles.js";
import { INITIAL_PHASES } from "./data/initial.js";
import { WEEKLY_PHASES } from "./data/weekly.js";
import { MONTHLY_PHASES } from "./data/monthly.js";

/* ──────────────────────────────────────────────
   MODE DEFINITIONS
   ────────────────────────────────────────────── */
const MODES = {
  initial: {
    key: "initial",
    label: "初月PoC",
    subtitle: "最初の1か月で検証体制を立ち上げる 7ステップ",
    phases: INITIAL_PHASES,
    hasWeek: false,
  },
  weekly: {
    key: "weekly",
    label: "週次運用",
    subtitle: "毎週まわす検証サイクル — 月〜金 5ステップ",
    phases: WEEKLY_PHASES,
    hasWeek: true,
  },
  monthly: {
    key: "monthly",
    label: "月次レビュー",
    subtitle: "1か月分の結果を整理し、勝ちパターンを蓄積する 4ステップ",
    phases: MONTHLY_PHASES,
    hasWeek: false,
  },
};
const MODE_ORDER = ["initial", "weekly", "monthly"];

/* ──────────────────────────────────────────────
   WEEK HELPERS
   ────────────────────────────────────────────── */
// ローカル時刻ベースで YYYY-MM-DD を返す。
// 旧実装の toISOString().split("T")[0] は JST 月曜00:00 が UTC で日曜になる問題があったため修正。
function formatLocalDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getWeekKey(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return formatLocalDate(monday);
}

function formatWeekLabel(weekKey) {
  const mon = new Date(weekKey + "T00:00:00");
  const fri = new Date(mon);
  fri.setDate(fri.getDate() + 4);
  const fmt = (d) => `${d.getMonth() + 1}/${d.getDate()}`;
  return `${fmt(mon)}〜${fmt(fri)}`;
}

function shortWeekLabel(weekKey) {
  const mon = new Date(weekKey + "T00:00:00");
  return `${mon.getMonth() + 1}/${mon.getDate()}週`;
}

/* ──────────────────────────────────────────────
   STORAGE KEYS
   ────────────────────────────────────────────── */
const LEGACY_KEY = "topview_weekly_state";
const MIGRATED_FLAG = "topviewMigrated_v2";

// Mode-scoped key. For weekly mode, weekKey is appended.
function modeKey(prefix, mode, weekKey) {
  if (mode === "weekly" && weekKey) return `${prefix}_${mode}_${weekKey}`;
  return `${prefix}_${mode}`;
}

const KEY = {
  status: (mode, weekKey) => modeKey("topviewTodoStatus", mode, weekKey),
  links: (mode, weekKey) => modeKey("topviewDeliverableLinks", mode, weekKey),
  expanded: (mode, weekKey) => modeKey("topviewExpanded", mode, weekKey),
  notes: (mode, weekKey) => modeKey("topviewNotes", mode, weekKey),
};
const META = {
  mode: "topviewCurrentMode",
  week: "topviewCurrentWeek",
  showRoles: "topviewShowRoles",
};

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}
function saveJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}
function loadString(key, fallback) {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}
function saveString(key, value) {
  try { localStorage.setItem(key, value); } catch {}
}

/* ──────────────────────────────────────────────
   LEGACY MIGRATION
   旧 topview_weekly_state を週次モードの各週キーに展開する
   ────────────────────────────────────────────── */
function migrateLegacyIfNeeded() {
  try {
    if (localStorage.getItem(MIGRATED_FLAG)) return;
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) {
      localStorage.setItem(MIGRATED_FLAG, "1");
      return;
    }
    const legacy = JSON.parse(raw);
    if (legacy && typeof legacy === "object") {
      const currentWeek = legacy.currentWeek || getWeekKey(new Date());

      // パターンA：weeks 入れ子構造（旧App.jsxの構造）
      const weeks = legacy.weeks || {};
      Object.entries(weeks).forEach(([wk, data]) => {
        if (!wk || !data) return;
        if (data.statuses && Object.keys(data.statuses).length > 0) {
          saveJSON(KEY.status("weekly", wk), data.statuses);
        }
        if (data.links && Object.keys(data.links).length > 0) {
          saveJSON(KEY.links("weekly", wk), data.links);
        }
        if (data.notes) {
          saveString(KEY.notes("weekly", wk), data.notes);
        }
      });

      // パターンB：root直下に statuses / links / notes があるさらに古い構造へのフォールバック
      // （手動編集や前々世代の互換のための保険）
      if (legacy.statuses && typeof legacy.statuses === "object" && Object.keys(legacy.statuses).length > 0) {
        const target = KEY.status("weekly", currentWeek);
        if (!localStorage.getItem(target)) saveJSON(target, legacy.statuses);
      }
      if (legacy.links && typeof legacy.links === "object" && Object.keys(legacy.links).length > 0) {
        const target = KEY.links("weekly", currentWeek);
        if (!localStorage.getItem(target)) saveJSON(target, legacy.links);
      }
      if (legacy.notes && typeof legacy.notes === "string") {
        const target = KEY.notes("weekly", currentWeek);
        if (!localStorage.getItem(target)) saveString(target, legacy.notes);
      }

      // expandedPhases / expandedTasks は現在週分として引き継ぐ
      const expanded = { ...(legacy.expandedPhases || {}), ...(legacy.expandedTasks || {}) };
      if (Object.keys(expanded).length > 0) {
        saveJSON(KEY.expanded("weekly", currentWeek), expanded);
      }
      if (legacy.currentWeek) saveString(META.week, legacy.currentWeek);
      if (typeof legacy.showRoles === "boolean") saveJSON(META.showRoles, legacy.showRoles);
    }
    localStorage.setItem(MIGRATED_FLAG, "1");
  } catch {
    try { localStorage.setItem(MIGRATED_FLAG, "1"); } catch {}
  }
}

// モジュールロード時に1回だけ実行（フラグでガード済み）。
// useStateのlazy initializerが「移行済みの新キー」を読めるようにする。
if (typeof window !== "undefined") {
  migrateLegacyIfNeeded();
}

/* ──────────────────────────────────────────────
   ICONS
   ────────────────────────────────────────────── */
function ChevronDown({ open }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CheckIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function LinkIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <path d="M6.5 9.5L9.5 6.5M7 4L8.5 2.5a2.83 2.83 0 014 4L11 8M5 8L3.5 9.5a2.83 2.83 0 004 4L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ArrowIcon({ dir }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d={dir === "left" ? "M11 4L6 9L11 14" : "M7 4L12 9L7 14"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ──────────────────────────────────────────────
   SMALL COMPONENTS
   ────────────────────────────────────────────── */
function RoleBadge({ roleKey }) {
  const role = ROLES[roleKey];
  if (!role) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", fontSize: 10, fontWeight: 600,
      color: role.color, background: role.color + "14", padding: "2px 7px", borderRadius: 4, whiteSpace: "nowrap",
    }}>
      {role.label}
    </span>
  );
}

const STATUS_OPTIONS = [
  { value: "todo", label: "未着手", color: "#94a3b8", bg: "#f1f5f9" },
  { value: "doing", label: "進行中", color: "#f59e0b", bg: "#fffbeb" },
  { value: "done", label: "完了", color: "#16a34a", bg: "#f0fdf4" },
];

function StatusSelect({ value, onChange }) {
  const current = STATUS_OPTIONS.find((s) => s.value === value) || STATUS_OPTIONS[0];
  return (
    <select value={value || "todo"} onChange={(e) => onChange(e.target.value)} style={{
      fontSize: 11, fontWeight: 600, color: current.color, background: current.bg,
      border: "1px solid " + current.color + "33", borderRadius: 5, padding: "2px 6px",
      cursor: "pointer", outline: "none", appearance: "auto", fontFamily: "inherit",
    }}>
      {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
    </select>
  );
}

function CriteriaCard({ criteria }) {
  return (
    <div style={{ margin: "8px 0 4px", padding: "10px 12px", background: "#faf5ff", borderRadius: 8, borderLeft: "3px solid #8b5cf6" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", marginBottom: 6 }}>📐 {criteria.title}</div>
      {criteria.items.map((item, i) => (
        <div key={i} style={{ fontSize: 12, color: "#5b21b6", lineHeight: 1.7, paddingLeft: 8 }}>• {item}</div>
      ))}
    </div>
  );
}

const DAY_COLORS = {
  MON: { bg: "#6366f1", light: "#eef2ff" },
  TUE: { bg: "#0ea5e9", light: "#ecfeff" },
  WED: { bg: "#f59e0b", light: "#fffbeb" },
  THU: { bg: "#10b981", light: "#ecfdf5" },
  FRI: { bg: "#8b5cf6", light: "#faf5ff" },
};

// Mode-specific theme color (used when day color is absent)
const MODE_THEME = {
  initial: { bg: "#6366f1", light: "#eef2ff" },
  weekly: { bg: "#0ea5e9", light: "#ecfeff" },
  monthly: { bg: "#8b5cf6", light: "#faf5ff" },
};

/* ──────────────────────────────────────────────
   MAIN APP
   ────────────────────────────────────────────── */
export default function App() {
  // 現在モード（lazy init）
  const [mode, setMode] = useState(() => {
    const m = loadString(META.mode, "initial");
    return MODES[m] ? m : "initial";
  });
  useEffect(() => { saveString(META.mode, mode); }, [mode]);

  // 現在の週（週次モードのみ使用、lazy init）
  const [weekKey, setWeekKey] = useState(() => {
    const w = loadString(META.week, "");
    return w || getWeekKey(new Date());
  });
  useEffect(() => { saveString(META.week, weekKey); }, [weekKey]);

  // 担当ロール表示トグル
  const [showRoles, setShowRoles] = useState(() => loadJSON(META.showRoles, false));
  useEffect(() => { saveJSON(META.showRoles, showRoles); }, [showRoles]);

  // 現在モードのlocalStorageキーを構築するためのコンテキスト
  const ctxWeek = mode === "weekly" ? weekKey : null;

  // モード別ステート（statuses, links, expanded, notes）
  // lazy init で localStorage から直接読む。初回マウント時の「空オブジェクト上書き」問題を回避。
  const [statuses, setStatuses] = useState(() => loadJSON(KEY.status(mode, ctxWeek), {}));
  const [links, setLinks] = useState(() => loadJSON(KEY.links(mode, ctxWeek), {}));
  const [expanded, setExpanded] = useState(() => {
    const exp = loadJSON(KEY.expanded(mode, ctxWeek), null);
    if (exp) return exp;
    const firstPhaseId = MODES[mode].phases[0]?.id;
    return firstPhaseId ? { [firstPhaseId]: true } : {};
  });
  const [notes, setNotes] = useState(() => loadString(KEY.notes(mode, ctxWeek), ""));

  // 「現在ロード済みのキー」を ref で追跡。
  // モード/週切替時のロード処理が完了するまで、保存を行わないようにする。
  const dataKey = mode === "weekly" ? `weekly|${weekKey}` : mode;
  const dataKeyRef = useRef(dataKey);

  // モード or 週が変わったときに新キーからロードする
  // （changeMode/changeWeek 経由なら loadDataFor で先回りされているが、外部から setMode/setWeekKey が呼ばれた場合の保険として残す）
  useEffect(() => {
    if (dataKeyRef.current === dataKey) return; // 同じキー、何もしない
    setStatuses(loadJSON(KEY.status(mode, ctxWeek), {}));
    setLinks(loadJSON(KEY.links(mode, ctxWeek), {}));
    const exp = loadJSON(KEY.expanded(mode, ctxWeek), null);
    if (exp) {
      setExpanded(exp);
    } else {
      const firstPhaseId = MODES[mode].phases[0]?.id;
      setExpanded(firstPhaseId ? { [firstPhaseId]: true } : {});
    }
    setNotes(loadString(KEY.notes(mode, ctxWeek), ""));
    dataKeyRef.current = dataKey;
  }, [mode, ctxWeek, dataKey]);

  /* ── 同期ロード関数（モード/週切替時に setMode/setWeekKey と同じバッチで state を更新する） ── */
  const loadDataFor = useCallback((nextMode, nextWeekKey) => {
    const nextCtxWeek = nextMode === "weekly" ? nextWeekKey : null;
    setStatuses(loadJSON(KEY.status(nextMode, nextCtxWeek), {}));
    setLinks(loadJSON(KEY.links(nextMode, nextCtxWeek), {}));
    const exp = loadJSON(KEY.expanded(nextMode, nextCtxWeek), null);
    if (exp) {
      setExpanded(exp);
    } else {
      const firstPhaseId = MODES[nextMode].phases[0]?.id;
      setExpanded(firstPhaseId ? { [firstPhaseId]: true } : {});
    }
    setNotes(loadString(KEY.notes(nextMode, nextCtxWeek), ""));
    dataKeyRef.current = nextMode === "weekly" ? `weekly|${nextWeekKey}` : nextMode;
  }, []);

  /* ── Actions（state更新と localStorage 保存を不可分に行う） ── */
  // setter は useCallback の依存配列に [mode, ctxWeek] を持つため、モード/週切替後は新しい mode/ctxWeek を持つ関数が再生成される。
  // changeMode/changeWeek 経由なら state も同期的に更新されるので、次回 setter 呼び出しは正しいキーへ書き込む。
  const setStatus = useCallback((taskId, val) => {
    setStatuses((s) => {
      const next = { ...s, [taskId]: val };
      saveJSON(KEY.status(mode, ctxWeek), next);
      return next;
    });
  }, [mode, ctxWeek]);

  const setLink = useCallback((deliverableKey, url) => {
    setLinks((s) => {
      const next = { ...s, [deliverableKey]: url };
      saveJSON(KEY.links(mode, ctxWeek), next);
      return next;
    });
  }, [mode, ctxWeek]);

  const toggle = useCallback((id) => {
    setExpanded((s) => {
      const next = { ...s, [id]: !s[id] };
      saveJSON(KEY.expanded(mode, ctxWeek), next);
      return next;
    });
  }, [mode, ctxWeek]);

  const updateNotes = useCallback((val) => {
    setNotes(val);
    saveString(KEY.notes(mode, ctxWeek), val);
  }, [mode, ctxWeek]);

  /* ── モード/週切替（state を同期ロードしてから set する） ── */
  const changeMode = useCallback((nextMode) => {
    if (nextMode === mode) return;
    loadDataFor(nextMode, weekKey);
    setMode(nextMode);
  }, [mode, weekKey, loadDataFor]);

  const changeWeek = useCallback((offset) => {
    const d = new Date(weekKey + "T00:00:00");
    d.setDate(d.getDate() + offset * 7);
    const nextWeek = getWeekKey(d);
    if (nextWeek === weekKey) return;
    if (mode === "weekly") {
      loadDataFor("weekly", nextWeek);
    }
    setWeekKey(nextWeek);
  }, [mode, weekKey, loadDataFor]);

  const goToThisWeek = useCallback(() => {
    const nextWeek = getWeekKey(new Date());
    if (nextWeek === weekKey) return;
    if (mode === "weekly") {
      loadDataFor("weekly", nextWeek);
    }
    setWeekKey(nextWeek);
  }, [mode, weekKey, loadDataFor]);

  const currentModeDef = MODES[mode];
  const isCurrentWeek = weekKey === getWeekKey(new Date());

  /* ── 各モードの進捗を計算（タブ用） ── */
  const progressByMode = useMemo(() => {
    const out = {};
    for (const m of MODE_ORDER) {
      const phases = MODES[m].phases;
      const total = phases.reduce((sum, p) => sum + p.tasks.length, 0);
      let st = {};
      if (m === mode) {
        // 現在モードはステートから（即時反映のため）
        st = statuses;
      } else if (m === "weekly") {
        st = loadJSON(KEY.status("weekly", weekKey), {});
      } else {
        st = loadJSON(KEY.status(m, null), {});
      }
      const done = phases.reduce(
        (sum, p) => sum + p.tasks.filter((t) => st[t.id] === "done").length, 0
      );
      out[m] = { done, total };
    }
    return out;
  }, [statuses, weekKey, mode]);

  /* ── 現在モードの進捗 ── */
  const totalTasks = currentModeDef.phases.reduce((sum, p) => sum + p.tasks.length, 0);
  const completedTasks = currentModeDef.phases.reduce(
    (sum, p) => sum + p.tasks.filter((t) => statuses[t.id] === "done").length, 0
  );
  const inProgressTasks = currentModeDef.phases.reduce(
    (sum, p) => sum + p.tasks.filter((t) => statuses[t.id] === "doing").length, 0
  );
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const allComplete = totalTasks > 0 && completedTasks === totalTasks;

  /* ── リセット ── */
  const resetCurrent = () => {
    const label =
      mode === "weekly" ? `${shortWeekLabel(weekKey)}（週次運用）` :
      mode === "initial" ? "初月PoC" : "月次レビュー";
    if (!confirm(`${label} の進捗・リンク・メモをリセットしますか？`)) return;
    setStatuses({});
    setLinks({});
    setNotes("");
    saveJSON(KEY.status(mode, ctxWeek), {});
    saveJSON(KEY.links(mode, ctxWeek), {});
    saveString(KEY.notes(mode, ctxWeek), "");
    // expanded は意図的に維持（UIの好みは残す）
  };

  const themeColor = MODE_THEME[mode];

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "28px 16px 60px" }}>
      {/* ── HEADER ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 30 }}>🎬</span>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>
              Topview ショート動画制作
            </h1>
            <p style={{ fontSize: 12, color: "#888", margin: "2px 0 0" }}>
              {currentModeDef.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* ── MODE TABS ── */}
      <div style={{
        background: "#fff", borderRadius: 14, padding: 6, marginBottom: 14,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4,
      }}>
        {MODE_ORDER.map((m) => {
          const def = MODES[m];
          const prog = progressByMode[m];
          const isActive = mode === m;
          const isComplete = prog.total > 0 && prog.done === prog.total;
          const activeColor = MODE_THEME[m].bg;
          return (
            <button
              key={m}
              onClick={() => changeMode(m)}
              style={{
                border: "none", borderRadius: 10, padding: "10px 8px", cursor: "pointer",
                background: isActive ? activeColor : "transparent",
                color: isActive ? "#fff" : "#666",
                transition: "all 0.2s",
                fontFamily: "inherit",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{def.label}</span>
                {isComplete && m === "initial" && (
                  <span style={{
                    fontSize: 9, fontWeight: 800,
                    color: isActive ? activeColor : "#16a34a",
                    background: isActive ? "#fff" : "#f0fdf4",
                    padding: "1px 5px", borderRadius: 8, whiteSpace: "nowrap",
                  }}>
                    ✓ 完了
                  </span>
                )}
              </div>
              <span style={{
                fontSize: 10, fontWeight: 600,
                color: isActive ? "rgba(255,255,255,0.85)" : "#999",
              }}>
                {prog.done}/{prog.total}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── COMPLETED BADGE (initial mode only) ── */}
      {mode === "initial" && allComplete && (
        <div style={{
          background: "linear-gradient(135deg, #16a34a, #15803d)",
          color: "#fff", borderRadius: 12, padding: "12px 16px", marginBottom: 14,
          display: "flex", alignItems: "center", gap: 10,
          boxShadow: "0 2px 8px rgba(22, 163, 74, 0.25)",
        }}>
          <span style={{ fontSize: 22 }}>🎉</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800 }}>初月PoC 完了済み</div>
            <div style={{ fontSize: 11, opacity: 0.9, marginTop: 1 }}>
              立ち上げお疲れさまでした。以降は「週次運用」モードで毎週の検証を回しましょう。
            </div>
          </div>
        </div>
      )}

      {/* ── WEEK SELECTOR (weekly mode only) ── */}
      {mode === "weekly" && (
        <>
          <div style={{
            background: "#fff", borderRadius: 14, padding: "14px 16px", marginBottom: 12,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <button onClick={() => changeWeek(-1)} style={{ background: "none", border: "none", cursor: "pointer", color: "#999", padding: 4, display: "flex" }}>
              <ArrowIcon dir="left" />
            </button>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#1a1a2e" }}>
                {formatWeekLabel(weekKey)}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginTop: 2 }}>
                <span style={{ fontSize: 11, color: "#999" }}>{weekKey}</span>
                {isCurrentWeek && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#16a34a", background: "#f0fdf4", padding: "1px 8px", borderRadius: 10 }}>今週</span>
                )}
              </div>
            </div>
            <button onClick={() => changeWeek(1)} style={{ background: "none", border: "none", cursor: "pointer", color: "#999", padding: 4, display: "flex" }}>
              <ArrowIcon dir="right" />
            </button>
          </div>
          {!isCurrentWeek && (
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <button onClick={goToThisWeek} style={{
                fontSize: 12, fontWeight: 600, color: "#6366f1", background: "#eef2ff",
                border: "none", borderRadius: 6, padding: "5px 14px", cursor: "pointer",
                fontFamily: "inherit",
              }}>
                📅 今週に戻る
              </button>
            </div>
          )}
        </>
      )}

      {/* ── PROGRESS ── */}
      <div style={{ background: "#fff", borderRadius: 14, padding: "16px 20px", marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#444" }}>
            {mode === "weekly" ? "今週の進捗" : mode === "initial" ? "初月の進捗" : "今月の進捗"}
          </span>
          <div style={{ display: "flex", gap: 14, alignItems: "baseline" }}>
            {inProgressTasks > 0 && (
              <span style={{ fontSize: 12, color: "#f59e0b", fontWeight: 600 }}>🔄 {inProgressTasks}</span>
            )}
            <span style={{ fontSize: 24, fontWeight: 800, color: progress === 100 ? "#16a34a" : themeColor.bg }}>
              {completedTasks}<span style={{ fontSize: 13, fontWeight: 500, color: "#999" }}>/{totalTasks}</span>
            </span>
          </div>
        </div>
        <div style={{ height: 7, background: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 4, transition: "width 0.3s", width: `${progress}%`,
            background: progress === 100 ? "#16a34a" : `linear-gradient(90deg, ${themeColor.bg}, #8b5cf6)`,
          }} />
        </div>
        {/* Day dots (weekly mode only) */}
        {mode === "weekly" && (
          <div style={{ display: "flex", gap: 6, marginTop: 12, justifyContent: "center" }}>
            {WEEKLY_PHASES.map((phase) => {
              const phaseDone = phase.tasks.every((t) => statuses[t.id] === "done");
              const phaseStarted = phase.tasks.some((t) => statuses[t.id] === "doing" || statuses[t.id] === "done");
              const dc = DAY_COLORS[phase.dayShort];
              return (
                <div key={phase.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, minWidth: 48 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 15,
                    background: phaseDone ? dc.bg : phaseStarted ? dc.light : "#f3f4f6",
                    color: phaseDone ? "#fff" : phaseStarted ? dc.bg : "#ccc",
                    border: phaseDone ? "none" : `2px solid ${phaseStarted ? dc.bg : "#e5e7eb"}`,
                    transition: "all 0.2s",
                  }}>
                    {phaseDone ? <CheckIcon size={14} /> : phase.icon}
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, color: phaseDone ? dc.bg : "#bbb" }}>{phase.day}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── CONTROLS ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <button onClick={() => setShowRoles((v) => !v)} style={{
          fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 8, cursor: "pointer",
          border: "1px solid #e5e7eb", background: showRoles ? themeColor.bg : "#fff",
          color: showRoles ? "#fff" : "#666",
          fontFamily: "inherit",
        }}>
          👥 担当ロール表
        </button>
        <button onClick={resetCurrent} style={{
          fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 8, cursor: "pointer",
          border: "1px solid #e5e7eb", background: "#fff", color: "#999",
          fontFamily: "inherit",
        }}>
          ↺ {mode === "weekly" ? `${shortWeekLabel(weekKey)}をリセット` : "このモードをリセット"}
        </button>
      </div>

      {/* ── ROLE TABLE ── */}
      {showRoles && (
        <div style={{ background: "#fff", borderRadius: 14, padding: "16px 20px", marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>👥 チーム体制</div>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 16px" }}>
            {Object.entries(ROLES).map(([key, role]) => (
              <div key={key} style={{ display: "contents" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 800, color: "#fff", background: role.color,
                  }}>{role.short}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#333" }}>{role.label}</span>
                </div>
                <div style={{ fontSize: 12, color: "#666", lineHeight: 1.6, padding: "2px 0" }}>
                  {role.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PHASES ── */}
      {currentModeDef.phases.map((phase) => {
        const phaseCompleted = phase.tasks.filter((t) => statuses[t.id] === "done").length;
        const phaseTotal = phase.tasks.length;
        const allDone = phaseCompleted === phaseTotal;
        const isOpen = !!expanded[phase.id];
        const linkVal = links[phase.deliverableKey] || "";
        const dc = phase.dayShort ? DAY_COLORS[phase.dayShort] : themeColor;
        const headerLabel = phase.day || phase.stepLabel || "";

        return (
          <div key={phase.id} style={{
            marginBottom: 12, borderRadius: 14, overflow: "hidden", background: "#fff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            borderLeft: `4px solid ${allDone ? "#16a34a" : dc.bg}`,
          }}>
            <button onClick={() => toggle(phase.id)} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 12,
              padding: "14px 16px", border: "none", cursor: "pointer", textAlign: "left",
              background: allDone ? "#f0fdf4" : "#fafafe",
              fontFamily: "inherit",
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", flexShrink: 0,
                background: allDone ? "#16a34a" : dc.bg, color: "#fff",
              }}>
                {allDone ? <CheckIcon size={16} /> : (
                  <>
                    <span style={{ fontSize: 14 }}>{phase.icon}</span>
                    {phase.dayShort && (
                      <span style={{ fontSize: 8, fontWeight: 800, lineHeight: 1, marginTop: 1 }}>{phase.dayShort}</span>
                    )}
                  </>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: allDone ? "#16a34a" : dc.bg, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {headerLabel}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a2e", lineHeight: 1.3 }}>{phase.title}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: 12, color: "#999", fontWeight: 600 }}>{phaseCompleted}/{phaseTotal}</span>
                <span style={{ color: "#bbb" }}><ChevronDown open={isOpen} /></span>
              </div>
            </button>

            {isOpen && (
              <div style={{ padding: "4px 14px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", background: dc.light, borderRadius: 8, marginBottom: 4, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12 }}>📦</span>
                  <span style={{ fontSize: 12, color: dc.bg, fontWeight: 700 }}>成果物：{phase.deliverable}</span>
                  <div style={{ flex: 1 }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ color: dc.bg }}><LinkIcon /></span>
                    <input type="text" placeholder="リンクを貼る" value={linkVal}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => { e.stopPropagation(); setLink(phase.deliverableKey, e.target.value); }}
                      style={{
                        fontSize: 11, border: `1px solid ${dc.bg}33`, borderRadius: 5, padding: "3px 8px",
                        width: 160, outline: "none", fontFamily: "inherit", color: "#555",
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: 6, padding: "8px 12px", background: "#ecfdf5", borderRadius: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 11 }}>✅</span>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#047857" }}>完了条件：</span>
                    <span style={{ fontSize: 11, color: "#065f46" }}>{phase.completionCriteria}</span>
                  </div>
                </div>

                {phase.criteriaRef && CRITERIA[phase.criteriaRef] && (
                  <CriteriaCard criteria={CRITERIA[phase.criteriaRef]} />
                )}

                {phase.tasks.map((task) => {
                  const status = statuses[task.id] || "todo";
                  const isDone = status === "done";
                  const isTaskOpen = !!expanded[task.id];

                  return (
                    <div key={task.id} style={{
                      marginTop: 6, borderRadius: 10,
                      border: "1px solid " + (isDone ? "#d1fae5" : "#f0f0f0"),
                      overflow: "hidden", background: isDone ? "#fafff9" : "#fff",
                    }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px" }}>
                        <StatusSelect value={status} onChange={(v) => setStatus(task.id, v)} />
                        <button onClick={() => toggle(task.id)} style={{
                          flex: 1, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0,
                          fontFamily: "inherit",
                        }}>
                          <span style={{
                            fontSize: 14, fontWeight: 600, lineHeight: 1.5,
                            color: isDone ? "#aaa" : "#1a1a2e",
                            textDecoration: isDone ? "line-through" : "none",
                          }}>
                            {task.title}
                          </span>
                          <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                            {task.owners.map((o) => <RoleBadge key={o} roleKey={o} />)}
                          </div>
                        </button>
                        <span style={{ color: "#ccc", flexShrink: 0, marginTop: 2, cursor: "pointer" }} onClick={() => toggle(task.id)}>
                          <ChevronDown open={isTaskOpen} />
                        </span>
                      </div>
                      {isTaskOpen && (
                        <div style={{ padding: "0 12px 12px 12px" }}>
                          <p style={{ fontSize: 13, color: "#555", lineHeight: 1.7, margin: "0 0 10px" }}>
                            {task.detail}
                          </p>
                          {task.tips && task.tips.length > 0 && (
                            <div style={{ background: "#fffbeb", borderRadius: 8, padding: "10px 12px" }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: "#b45309", marginBottom: 6 }}>💡 ポイント</div>
                              {task.tips.map((tip, i) => (
                                <div key={i} style={{ fontSize: 12, color: "#78350f", lineHeight: 1.7, marginBottom: 2 }}>{tip}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* ── MEMO (モード共通) ── */}
      <div style={{ background: "#fff", borderRadius: 14, padding: "16px 20px", marginTop: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#555", marginBottom: 8 }}>
          📝 {mode === "weekly" ? "週次メモ" : mode === "initial" ? "初月メモ" : "月次メモ"}
        </div>
        <textarea
          value={notes}
          onChange={(e) => updateNotes(e.target.value)}
          placeholder={
            mode === "weekly"
              ? "今週の気づき、来週試したいこと、改善点などを自由にメモ..."
              : mode === "initial"
                ? "初月の気づき、立ち上げ時の課題、引き継ぎたいことなどを自由にメモ..."
                : "今月の全体傾向、来月の方針、長期的な課題などを自由にメモ..."
          }
          style={{
            width: "100%", minHeight: 80, fontSize: 13, fontFamily: "inherit", lineHeight: 1.7,
            border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px", outline: "none",
            resize: "vertical", color: "#333", boxSizing: "border-box",
          }}
        />
      </div>

      {/* ── MODE REMINDER ── */}
      <div style={{ marginTop: 20, padding: "16px 20px", background: "#fff", borderRadius: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#555", marginBottom: 6 }}>
          {mode === "weekly" ? "🔄 毎週このサイクルを回す" :
            mode === "initial" ? "🚀 初月で立ち上げる" : "📈 月次で勝ちパターンを蓄積"}
        </div>
        <p style={{ fontSize: 12, color: "#888", lineHeight: 1.7, margin: 0 }}>
          {mode === "weekly" &&
            "月→テーマ決め＋収集 → 火→分析・翻案 → 水→生成・レビュー → 木→投稿・KPI記録 → 金→48時間データ＋振り返り。4週分溜まったら月次レビューで全体傾向を分析する。"}
          {mode === "initial" &&
            "最初の1か月で「収集→分析→型選定→企画→生成→投稿検証→蓄積」の7ステップを通し、検証体制を立ち上げる。完了後は週次運用モードに移行する。"}
          {mode === "monthly" &&
            "1か月分の結果を集計し、効いた構造をライブラリ化して来月の検証テーマを決める。月末〜翌月初に実施する。"}
        </p>
      </div>

      <p style={{ textAlign: "center", fontSize: 11, color: "#ccc", marginTop: 20 }}>
        進捗はモードごと（週次は週ごと）にブラウザに自動保存されます
      </p>
    </div>
  );
}
