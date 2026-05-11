import { useState, useEffect, useCallback } from "react";

/* ──────────────────────────────────────────────
   ROLE DEFINITIONS
   ────────────────────────────────────────────── */
const ROLES = {
  director:  { label: "ディレクター",      color: "#6366f1", short: "D" },
  research:  { label: "リサーチ担当",      color: "#0ea5e9", short: "R" },
  analyst:   { label: "AI分析担当",        color: "#8b5cf6", short: "A" },
  creator:   { label: "制作担当",          color: "#f59e0b", short: "C" },
  marketer:  { label: "マーケ担当",        color: "#10b981", short: "M" },
  approver:  { label: "責任者/クライアント", color: "#ef4444", short: "承" },
};

/* ──────────────────────────────────────────────
   JUDGMENT CRITERIA
   ────────────────────────────────────────────── */
const CRITERIA = {
  type_selection: {
    title: "採用する型の判断基準",
    items: [
      "自社商品に自然に接続できる",
      "ブランド毀損リスクが低い",
      "冒頭1秒の強さがある",
      "量産・横展開しやすい",
      "検証したいKPIが明確",
    ],
  },
  win_criteria: {
    title: "勝ち動画の判断基準",
    items: [
      "視聴維持率が平均より高い",
      "保存率または共有率が高い",
      "コメントで狙った反応が出ている",
      "商品クリックやCVに近い行動が出ている",
      "次の企画に展開できる学びがある",
    ],
  },
};

/* ──────────────────────────────────────────────
   WEEKLY PHASE & TASK DATA
   ────────────────────────────────────────────── */
const PHASES = [
  {
    id: "phase1",
    day: "月曜",
    dayShort: "MON",
    icon: "🔍",
    title: "バズ動画を収集＋AI構造分析",
    deliverable: "参考動画リスト＋構造分析シート（5本〜）",
    deliverableKey: "link_phase1",
    completionCriteria: "収集した動画すべてに5観点の構造分析が記録され、パターン分類が完了していること",
    tasks: [
      {
        id: "1-1",
        title: "バズ動画を収集する（5本〜）",
        owners: ["research"],
        detail: "TikTok・Instagram Reels・YouTube Shortsから、伸びている動画をピックアップする。自社業界に限定せず、構造が面白い動画を幅広く集める。数が多いほど分析の精度が上がるので、余裕があれば10〜20本でもOK。",
        tips: [
          "収集基準：① 冒頭で手が止まる ② 保存・コメントが多い ③ 商品紹介が自然 ④ 違和感・笑い・驚きがある ⑤ 自社商品に置き換えられそう",
          "最低5本、余裕があれば10〜20本を目指す",
          "スプレッドシートにURL・再生数・保存数・選定理由を記録",
        ],
      },
      {
        id: "1-2",
        title: "各動画のスクリプトを書き起こす",
        owners: ["analyst", "research"],
        detail: "動画の音声をテキスト化する。Whisper等の音声認識ツールを活用すると効率的。画面の流れも簡単にメモする。",
        tips: [
          "完璧な書き起こしは不要、要点が分かればOK",
          "画面キャプチャ3〜5枚を添えるとAI分析の精度が上がる",
          "書き起こしツール例：Whisper、YouTube字幕、手動メモ",
        ],
      },
      {
        id: "1-3",
        title: "AIで構造分析を実行する",
        owners: ["analyst"],
        detail: "プロンプトテンプレートに書き起こし＋キャプチャを入力し、5つの観点で分析する。① 冒頭1秒で止まる理由 ② 続きを見たくなる理由 ③ 感情が動くポイント ④ 転用できる構造 ⑤ 真似ると危険な表面要素。",
        tips: [
          "1本あたり5〜10分が目安",
          "分析結果はスプレッドシートの別シートに記録",
          "パターン分類（違和感型・Before/After型・検証型・あるある型・擬人化型・失敗回避型・逆張り型）を付与する",
        ],
      },
    ],
  },
  {
    id: "phase2",
    day: "火曜",
    dayShort: "TUE",
    icon: "✏️",
    title: "型を選定＋企画案を作成",
    deliverable: "採用する型＋企画案リスト（3本〜）",
    deliverableKey: "link_phase2",
    completionCriteria: "各企画案にタイトル・冒頭の引き・展開概要・商品の出し方・検証仮説が記載されていること",
    criteriaRef: "type_selection",
    tasks: [
      {
        id: "2-1",
        title: "今週使う型を選定する（1〜3個）",
        owners: ["director", "analyst"],
        detail: "月曜の分析結果から、今週の動画に使う型を選ぶ。前週に効果があった型の横展開、または新しく試したい型を選定する。勝ちパターンライブラリも参照する。",
        tips: [
          "まだライブラリが薄い初期は、毎週新しい型を試すのが効率的",
          "前週の数値が良かった型は積極的に再利用する",
          "余裕があれば3個以上選んでもOK",
        ],
      },
      {
        id: "2-2",
        title: "企画案を作成する（3本〜）",
        owners: ["analyst", "creator"],
        detail: "選んだ各型について企画案を作成する。各企画案にはタイトル、冒頭の引き、展開概要、商品の出し方、想定する視聴者の反応、検証仮説を記載する。",
        tips: [
          "AIに「この構造で自社商品Xの動画案を3つ出して」と依頼するのも有効",
          "完璧な脚本は不要、A4半ページ程度でOK",
          "型が多ければ企画案も増やしてOK（目安：型の数×2〜3本）",
        ],
      },
      {
        id: "2-3",
        title: "生成前チェックを実施する",
        owners: ["director"],
        detail: "各企画案を5つの観点で確認する：① 元動画に寄せすぎていないか ② ブランド文脈に自然に接続できているか ③ 視聴者にとって見る理由があるか ④ 商品訴求が唐突でないか ⑤ 検証仮説が明確か。",
        tips: [
          "特に①は重要。構造は活かしつつ、見た目は完全に別物にする",
          "「この動画で検証したいこと」が1行で言えない企画は練り直す",
        ],
      },
    ],
  },
  {
    id: "phase3",
    day: "水曜",
    dayShort: "WED",
    icon: "🎬",
    title: "TopViewで動画制作＋レビュー",
    deliverable: "完成動画（2本〜）",
    deliverableKey: "link_phase3",
    completionCriteria: "2本以上の動画が完成し、ブランドチェック済み、各動画に検証仮説がタグ付けされていること",
    tasks: [
      {
        id: "3-1",
        title: "TopViewで動画を生成する（2本〜）",
        owners: ["creator"],
        detail: "火曜の企画案から優先度の高いものを選び、TopView Video Agentで生成する。参考動画のリズム・構図・カメラワーク・編集テンポを入力し、自社商品向けに生成する。",
        tips: [
          "1本あたり2〜3回生成して最も良いものを選ぶ",
          "余裕があれば5本以上生成してもOK",
          "テスト投稿用なので完璧を目指さない",
        ],
      },
      {
        id: "3-2",
        title: "レビュー＋最終編集する",
        owners: ["director", "creator", "approver"],
        detail: "生成動画をチームでレビュー：① ブランドイメージに合っているか ② 元動画に寄せすぎていないか ③ 不快感や誤解を与えないか ④ 商品訴求が自然か。テロップ修正・BGM差し替え・不要シーンカットを実施する。",
        tips: [
          "法務チェックが必要な場合はこの段階で依頼",
          "15〜30分のレビュー会で一括確認するのが効率的",
        ],
      },
      {
        id: "3-3",
        title: "検証仮説をタグ付けする",
        owners: ["marketer", "analyst"],
        detail: "各完成動画に検証仮説を明記する。例：「違和感型の冒頭は離脱率を下げるか」「擬人化型は保存率が高いか」。スプレッドシートに仮説列で記録する。",
        tips: [
          "仮説がない動画は学びにつながらない",
          "先週の結果を踏まえた仮説にすると精度が上がる",
        ],
      },
    ],
  },
  {
    id: "phase4",
    day: "木曜",
    dayShort: "THU",
    icon: "📤",
    title: "投稿＋先週の数値を確認",
    deliverable: "投稿済み動画＋先週分のKPIデータ",
    deliverableKey: "link_phase4",
    completionCriteria: "今週の動画が投稿され、先週の投稿分のKPIがスプレッドシートに記録されていること",
    tasks: [
      {
        id: "4-1",
        title: "今週の動画を投稿する",
        owners: ["creator", "marketer"],
        detail: "完成動画を各プラットフォームに投稿する。複数本ある場合は時間を分散させる。投稿時間はターゲット層がアクティブな時間帯に合わせる。",
        tips: [
          "各プラットフォームに最適化した形式（縦横比・長さ等）で投稿",
          "同じ型の動画は連続投稿を避ける",
          "投稿時刻・プラットフォーム・ハッシュタグも記録しておく",
        ],
      },
      {
        id: "4-2",
        title: "先週の投稿分のKPIを記録する",
        owners: ["marketer"],
        detail: "先週投稿した動画のKPIをスプレッドシートに記録する：冒頭離脱率、平均視聴時間、視聴維持率、完了率、保存数・共有数、コメント内容、クリック率、CV数。",
        tips: [
          "コメント内容は感情の種類（笑い/驚き/共感/批判等）を分類して記録",
          "投稿から1週間経過した数値が比較しやすい",
          "数値が低くても「学び」として記録する（何が刺さらなかったか）",
        ],
      },
      {
        id: "4-3",
        title: "構造×反応の対応を記録する",
        owners: ["marketer", "analyst"],
        detail: "先週の結果について「どの型がどのKPIを生んだか」を記録する。型ごとの傾向を蓄積していく。",
        tips: [
          "再生数だけでなく「保存率」「完了率」を重視する",
          "週単位のサンプルは少ないので、4週分溜まったら傾向を分析する",
        ],
      },
    ],
  },
  {
    id: "phase5",
    day: "金曜",
    dayShort: "FRI",
    icon: "📊",
    title: "振り返り＋ライブラリ更新",
    deliverable: "週次メモ＋ライブラリ更新",
    deliverableKey: "link_phase5",
    completionCriteria: "今週の学びが記録され、翌週の方針が決まっていること",
    criteriaRef: "win_criteria",
    tasks: [
      {
        id: "5-1",
        title: "今週の振り返りをする（5〜15分）",
        owners: ["director", "marketer"],
        detail: "今週の活動を簡単に振り返る。うまくいったこと、改善点、来週試したいことを3行メモで記録する。チーム全員でやる必要はなく、ディレクター＋マーケ担当で十分。",
        tips: [
          "重くしない。3行メモで十分",
          "「来週もこの型を使うか、新しい型を試すか」を決めるのが最重要",
          "月末には週次メモをまとめて月次レビューにする",
        ],
      },
      {
        id: "5-2",
        title: "勝ちパターンライブラリを更新する",
        owners: ["analyst"],
        detail: "先週の数値結果をもとに、勝ちパターンライブラリを更新する。効果があった型はテンプレート化し、効果がなかった型は理由を記録する。",
        tips: [
          "更新は5分で終わるレベルでOK。大きな更新は月末にまとめて行う",
          "プロンプトテンプレートも効果があったものはバージョンアップする",
          "蓄積が4週分溜まったら、月次レビューで全体傾向を分析する",
        ],
      },
      {
        id: "5-3",
        title: "来週の方針を決める",
        owners: ["director"],
        detail: "来週の月曜に向けて方針をメモする：① 収集する動画の方向性（新しいジャンル？同じジャンルを深掘り？） ② 試したい型 ③ 検証したい仮説。",
        tips: [
          "金曜に1行メモするだけで月曜の立ち上がりが早くなる",
          "トレンド変化があれば、来週の収集対象に反映する",
        ],
      },
    ],
  },
];

/* ──────────────────────────────────────────────
   WEEK HELPERS
   ────────────────────────────────────────────── */
function getWeekKey(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split("T")[0];
}

function formatWeekLabel(weekKey) {
  const mon = new Date(weekKey + "T00:00:00");
  const fri = new Date(mon);
  fri.setDate(fri.getDate() + 4);
  const fmt = (d) => `${d.getMonth() + 1}/${d.getDate()}`;
  return `${fmt(mon)}〜${fmt(fri)}`;
}

/* ──────────────────────────────────────────────
   STORAGE
   ────────────────────────────────────────────── */
const STORAGE_KEY = "topview_weekly_state";

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
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

/* ──────────────────────────────────────────────
   MAIN APP
   ────────────────────────────────────────────── */
export default function App() {
  const [state, setState] = useState(() => {
    const saved = loadState();
    const currentWeek = getWeekKey(new Date());
    return saved || {
      currentWeek,
      weeks: {},
      expandedPhases: { phase1: true },
      expandedTasks: {},
      showRoles: false,
    };
  });

  useEffect(() => { saveState(state); }, [state]);

  const update = useCallback((fn) => setState((prev) => {
    const next = JSON.parse(JSON.stringify(prev));
    fn(next);
    return next;
  }), []);

  const weekKey = state.currentWeek || getWeekKey(new Date());
  const weekData = state.weeks?.[weekKey] || { statuses: {}, links: {}, notes: "" };

  const setWeekField = (field, id, val) => update((s) => {
    if (!s.weeks[weekKey]) s.weeks[weekKey] = { statuses: {}, links: {}, notes: "" };
    s.weeks[weekKey][field] = { ...s.weeks[weekKey][field], [id]: val };
  });

  const setStatus = (id, val) => setWeekField("statuses", id, val);
  const setLink = (key, url) => setWeekField("links", key, url);
  const togglePhase = (id) => update((s) => { s.expandedPhases[id] = !s.expandedPhases[id]; });
  const toggleTask = (id) => update((s) => { s.expandedTasks[id] = !s.expandedTasks[id]; });
  const toggleRoles = () => update((s) => { s.showRoles = !s.showRoles; });

  const changeWeek = (offset) => update((s) => {
    const d = new Date(s.currentWeek + "T00:00:00");
    d.setDate(d.getDate() + offset * 7);
    s.currentWeek = getWeekKey(d);
  });

  const goToThisWeek = () => update((s) => { s.currentWeek = getWeekKey(new Date()); });

  const totalTasks = PHASES.reduce((sum, p) => sum + p.tasks.length, 0);
  const completedTasks = PHASES.reduce((sum, p) =>
    sum + p.tasks.filter((t) => weekData.statuses?.[t.id] === "done").length, 0);
  const inProgressTasks = PHASES.reduce((sum, p) =>
    sum + p.tasks.filter((t) => weekData.statuses?.[t.id] === "doing").length, 0);
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const isCurrentWeek = weekKey === getWeekKey(new Date());
  const weekLabel = formatWeekLabel(weekKey);

  const weekKeys = Object.keys(state.weeks || {}).filter(k => {
    const w = state.weeks[k];
    return w && (Object.keys(w.statuses || {}).length > 0 || w.notes);
  }).sort();
  const weekIdx = weekKeys.indexOf(weekKey);
  const weekNumber = weekIdx >= 0 ? weekIdx + 1 : weekKeys.length + 1;

  const resetWeek = () => {
    if (confirm(`${weekLabel} の進捗をリセットしますか？`)) {
      update((s) => { delete s.weeks[weekKey]; });
    }
  };

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "28px 16px 60px" }}>
      {/* ── HEADER ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 30 }}>🎬</span>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>
              TopView ショート動画制作
            </h1>
            <p style={{ fontSize: 12, color: "#888", margin: "2px 0 0" }}>週次サイクル — 月〜金 5ステップ Todo & 手順書</p>
          </div>
        </div>
      </div>

      {/* ── WEEK SELECTOR ── */}
      <div style={{
        background: "#fff", borderRadius: 14, padding: "14px 16px", marginBottom: 12,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <button onClick={() => changeWeek(-1)} style={{ background: "none", border: "none", cursor: "pointer", color: "#999", padding: 4, display: "flex" }}>
          <ArrowIcon dir="left" />
        </button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#1a1a2e" }}>{weekLabel}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginTop: 2 }}>
            <span style={{ fontSize: 11, color: "#999" }}>Week {weekNumber}</span>
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
          }}>
            📅 今週に戻る
          </button>
        </div>
      )}

      {/* ── PROGRESS ── */}
      <div style={{ background: "#fff", borderRadius: 14, padding: "16px 20px", marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#444" }}>今週の進捗</span>
          <div style={{ display: "flex", gap: 14, alignItems: "baseline" }}>
            {inProgressTasks > 0 && (
              <span style={{ fontSize: 12, color: "#f59e0b", fontWeight: 600 }}>🔄 {inProgressTasks}</span>
            )}
            <span style={{ fontSize: 24, fontWeight: 800, color: progress === 100 ? "#16a34a" : "#6366f1" }}>
              {completedTasks}<span style={{ fontSize: 13, fontWeight: 500, color: "#999" }}>/{totalTasks}</span>
            </span>
          </div>
        </div>
        <div style={{ height: 7, background: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 4, transition: "width 0.3s", width: `${progress}%`,
            background: progress === 100 ? "#16a34a" : "linear-gradient(90deg, #6366f1, #8b5cf6)",
          }} />
        </div>
        {/* Day dots */}
        <div style={{ display: "flex", gap: 6, marginTop: 12, justifyContent: "center" }}>
          {PHASES.map((phase) => {
            const phaseDone = phase.tasks.every((t) => weekData.statuses?.[t.id] === "done");
            const phaseStarted = phase.tasks.some((t) => weekData.statuses?.[t.id] === "doing" || weekData.statuses?.[t.id] === "done");
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
      </div>

      {/* ── CONTROLS ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <button onClick={toggleRoles} style={{
          fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 8, cursor: "pointer",
          border: "1px solid #e5e7eb", background: state.showRoles ? "#6366f1" : "#fff",
          color: state.showRoles ? "#fff" : "#666",
        }}>
          👥 担当ロール表
        </button>
        <button onClick={resetWeek} style={{
          fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 8, cursor: "pointer",
          border: "1px solid #e5e7eb", background: "#fff", color: "#999",
        }}>
          ↺ 今週をリセット
        </button>
      </div>

      {/* ── ROLE TABLE ── */}
      {state.showRoles && (
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
                  {key === "director" && "全体設計、型の選定、レビュー"}
                  {key === "research" && "バズ動画収集、数値記録"}
                  {key === "analyst" && "書き起こし、構造分析、プロンプト作成"}
                  {key === "creator" && "TopView生成、編集、投稿準備"}
                  {key === "marketer" && "KPI設計、投稿結果分析"}
                  {key === "approver" && "ブランド・法務・最終承認"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PHASES ── */}
      {PHASES.map((phase) => {
        const phaseCompleted = phase.tasks.filter((t) => weekData.statuses?.[t.id] === "done").length;
        const phaseTotal = phase.tasks.length;
        const allDone = phaseCompleted === phaseTotal;
        const isOpen = state.expandedPhases[phase.id];
        const linkVal = weekData.links?.[phase.deliverableKey] || "";
        const dc = DAY_COLORS[phase.dayShort];

        return (
          <div key={phase.id} style={{
            marginBottom: 12, borderRadius: 14, overflow: "hidden", background: "#fff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            borderLeft: `4px solid ${allDone ? "#16a34a" : dc.bg}`,
          }}>
            <button onClick={() => togglePhase(phase.id)} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 12,
              padding: "14px 16px", border: "none", cursor: "pointer", textAlign: "left",
              background: allDone ? "#f0fdf4" : "#fafafe",
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", flexShrink: 0,
                background: allDone ? "#16a34a" : dc.bg, color: "#fff",
              }}>
                {allDone ? <CheckIcon size={16} /> : (
                  <>
                    <span style={{ fontSize: 14 }}>{phase.icon}</span>
                    <span style={{ fontSize: 8, fontWeight: 800, lineHeight: 1, marginTop: 1 }}>{phase.dayShort}</span>
                  </>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: allDone ? "#16a34a" : dc.bg, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {phase.day}
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
                  const status = weekData.statuses?.[task.id] || "todo";
                  const isDone = status === "done";
                  const isTaskOpen = state.expandedTasks[task.id];

                  return (
                    <div key={task.id} style={{
                      marginTop: 6, borderRadius: 10,
                      border: "1px solid " + (isDone ? "#d1fae5" : "#f0f0f0"),
                      overflow: "hidden", background: isDone ? "#fafff9" : "#fff",
                    }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px" }}>
                        <StatusSelect value={status} onChange={(v) => setStatus(task.id, v)} />
                        <button onClick={() => toggleTask(task.id)} style={{
                          flex: 1, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0,
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
                        <span style={{ color: "#ccc", flexShrink: 0, marginTop: 2, cursor: "pointer" }} onClick={() => toggleTask(task.id)}>
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

      {/* ── WEEKLY MEMO ── */}
      <div style={{ background: "#fff", borderRadius: 14, padding: "16px 20px", marginTop: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#555", marginBottom: 8 }}>📝 週次メモ</div>
        <textarea
          value={weekData.notes || ""}
          onChange={(e) => update((s) => {
            if (!s.weeks[weekKey]) s.weeks[weekKey] = { statuses: {}, links: {}, notes: "" };
            s.weeks[weekKey].notes = e.target.value;
          })}
          placeholder="今週の気づき、来週試したいこと、改善点などを自由にメモ..."
          style={{
            width: "100%", minHeight: 80, fontSize: 13, fontFamily: "inherit", lineHeight: 1.7,
            border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px", outline: "none",
            resize: "vertical", color: "#333", boxSizing: "border-box",
          }}
        />
      </div>

      {/* ── CYCLE REMINDER ── */}
      <div style={{ marginTop: 20, padding: "16px 20px", background: "#fff", borderRadius: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#555", marginBottom: 6 }}>🔄 毎週このサイクルを回す</div>
        <p style={{ fontSize: 12, color: "#888", lineHeight: 1.7, margin: 0 }}>
          月→収集・分析 → 火→企画 → 水→制作 → 木→投稿・検証 → 金→振り返り・蓄積。
          数が多いほど学習データが増えるので、チームのキャパが許す限り多く回す。
          4週分溜まったら月次レビューで全体傾向を分析する。
        </p>
      </div>

      <p style={{ textAlign: "center", fontSize: 11, color: "#ccc", marginTop: 20 }}>
        進捗は週ごとにブラウザに自動保存されます
      </p>
    </div>
  );
}
