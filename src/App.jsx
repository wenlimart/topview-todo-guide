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
   PHASE & TASK DATA
   ────────────────────────────────────────────── */
const PHASES = [
  {
    id: "phase1",
    week: "1週目（前半）",
    title: "バズ動画を30本収集する",
    deliverable: "参考動画リスト30本",
    deliverableKey: "link_phase1",
    completionCriteria: "30本の動画がスプレッドシートに記録され、各動画に選定理由が記載されていること",
    tasks: [
      {
        id: "1-1",
        title: "収集プラットフォームを決める",
        owners: ["director", "research"],
        due: "1週目 月曜",
        detail: "TikTok、Instagram Reels、YouTube Shortsの3つを基本とし、自社ターゲットが最も多いプラットフォームを優先する。",
        tips: ["各プラットフォーム10本ずつを目安に収集", "自社業界に限定しなくてOK（異業種のほうが構造が見えやすい）"],
      },
      {
        id: "1-2",
        title: "収集基準を確認する",
        owners: ["director"],
        due: "1週目 月曜",
        detail: "以下5つの基準のうち、2つ以上に当てはまる動画を優先的にピックアップする。",
        tips: ["① 冒頭で思わず手が止まる", "② 保存・コメントが多い（いいねより重要）", "③ 商品紹介が自然に入っている", "④ 違和感・笑い・驚きがある", "⑤ 自社商品に置き換えられそう"],
      },
      {
        id: "1-3",
        title: "参考動画リストを作成する",
        owners: ["research"],
        due: "1週目 火〜水曜",
        detail: "スプレッドシートに以下の項目を記録：動画URL、プラットフォーム、再生数、保存数、コメント数、ジャンル、選んだ理由。",
        tips: ["Googleスプレッドシートのテンプレートを先に用意しておく", "1日10本ペースで3日間で収集完了を目指す"],
      },
      {
        id: "1-4",
        title: "チーム内でレビューし30本に絞る",
        owners: ["director", "research", "analyst"],
        due: "1週目 木曜",
        detail: "集めた候補から重複や質の低いものを除外し、最終的に30本のリストを確定する。",
        tips: ["1人で判断せず、2〜3人で「自社に使えそうか」を議論する", "迷ったら入れる（分析段階で落とせる）"],
      },
    ],
  },
  {
    id: "phase2",
    week: "1週目（後半）",
    title: "AIで構造分析する",
    deliverable: "構造分析シート30件",
    deliverableKey: "link_phase2",
    completionCriteria: "30本すべてについて5観点の分析が記録され、パターン分類が完了していること",
    tasks: [
      {
        id: "2-1",
        title: "分析プロンプトを準備する",
        owners: ["analyst"],
        due: "1週目 木曜",
        detail: "ChatGPTまたはClaudeに以下の観点で分析させるプロンプトを用意する。",
        tips: ["観点①：冒頭1秒で止まる理由は何か", "観点②：視聴者が続きを見たくなる理由は何か", "観点③：感情が動くポイントはどこか", "観点④：商品・サービスに転用できる構造は何か", "観点⑤：真似ると危険な表面要素はどこか"],
      },
      {
        id: "2-2",
        title: "各動画のスクリプトを書き起こす",
        owners: ["analyst", "research"],
        due: "1週目 木〜金曜",
        detail: "動画の音声をテキスト化する。手動またはWhisper等の音声認識ツールを使う。画面の流れも簡単にメモする。",
        tips: ["完璧な書き起こしは不要、要点が分かればOK", "画面キャプチャ3〜5枚を添えるとAI分析の精度が上がる"],
      },
      {
        id: "2-3",
        title: "AIに構造分析を実行させる",
        owners: ["analyst"],
        due: "1週目 金曜",
        detail: "準備したプロンプトに書き起こし＋キャプチャを入力し、30本すべてについて分析結果を得る。",
        tips: ["1本あたり5〜10分を目安に進める", "分析結果はスプレッドシートの別シートに記録する"],
      },
      {
        id: "2-4",
        title: "構造分析シートを整理する",
        owners: ["analyst", "director"],
        due: "1週目 金曜",
        detail: "AI出力をそのまま使わず、人間が読んで「なるほど」と思える粒度に編集する。パターン分類を項目化する。",
        tips: ["パターン例：違和感型、Before/After型、検証型、あるある型、擬人化型、失敗回避型、逆張り型", "同じパターンに分類される動画をグルーピングしておく"],
      },
    ],
  },
  {
    id: "phase3",
    week: "2週目（前半）",
    title: "自社向けの型を5〜10個に絞る",
    deliverable: "勝ちパターン候補5〜10個",
    deliverableKey: "link_phase3",
    completionCriteria: "選定理由と判断基準のスコアが記録され、チーム合意が取れていること",
    criteriaRef: "type_selection",
    tasks: [
      {
        id: "3-1",
        title: "パターン別に動画を分類する",
        owners: ["analyst"],
        due: "2週目 月曜",
        detail: "構造分析シートから抽出されたパターンごとに動画をグルーピングし、各パターンの特徴を1〜2行でまとめる。",
        tips: ["パターンが7つ以上見つかった場合でも、まず全体像を把握する"],
      },
      {
        id: "3-2",
        title: "自社商品との相性を評価する",
        owners: ["director", "marketer"],
        due: "2週目 月曜",
        detail: "各パターンについて「自社商品に置き換えたとき自然に成立するか」を3段階（◎○△）で評価する。",
        tips: ["◎：商品訴求が自然に入る", "○：工夫すれば成立する", "△：無理がある・ブランドイメージと合わない"],
      },
      {
        id: "3-3",
        title: "採用する型を5〜10個に決定する",
        owners: ["director", "approver"],
        due: "2週目 火曜",
        detail: "◎○評価のパターンから5〜10個を選定。チーム合議＋ブランドガイドラインと照合して最終決定する。",
        tips: ["最初は多めに残しておき、動画案を作る段階で自然に絞られる", "必ず「なぜこの型を選んだか」の理由を記録する"],
      },
    ],
  },
  {
    id: "phase4",
    week: "2週目（後半）",
    title: "動画案を15本作成する",
    deliverable: "企画案リスト15本",
    deliverableKey: "link_phase4",
    completionCriteria: "各企画案にタイトル・冒頭の引き・展開概要・商品の出し方・検証仮説が記載されていること",
    tasks: [
      {
        id: "4-1",
        title: "各型の翻案ルールを決める",
        owners: ["director", "analyst"],
        due: "2週目 水曜",
        detail: "選んだ各型について「自社商品にどう置き換えるか」の翻案ルールを明文化する。",
        tips: ["抽象化の例：猫ジム動画 → 本質は「ありえないキャラクターが真剣に何かをしている違和感」", "化粧品なら「乾燥肌キャラクターが保湿力を鍛える」等に翻案"],
      },
      {
        id: "4-2",
        title: "1型あたり3案ずつ企画を作成する",
        owners: ["analyst", "creator"],
        due: "2週目 木曜",
        detail: "各型について3パターンの企画案を作成する（5型×3案＝15本）。タイトル、冒頭の引き、展開概要、商品の出し方、想定する視聴者の反応を記載する。",
        tips: ["完璧な脚本は不要、A4半ページ程度の概要でOK", "AIに「この構造で自社商品Xの動画案を3つ出して」と依頼するのも有効"],
      },
      {
        id: "4-3",
        title: "生成前チェックリストで確認する",
        owners: ["director", "approver"],
        due: "2週目 金曜",
        detail: "各企画案について確認：① 元動画に寄せすぎていないか ② ブランド文脈に自然に接続できているか ③ 視聴者にとって見る理由があるか ④ 商品訴求が唐突でないか ⑤ 投稿後に検証できる仮説があるか",
        tips: ["特に①は重要。表面を真似ているだけになっていないか要注意", "「この動画で検証したいこと」を1行で書いておく"],
      },
    ],
  },
  {
    id: "phase5",
    week: "3週目",
    title: "TopViewで動画を制作する",
    deliverable: "テスト動画5〜10本",
    deliverableKey: "link_phase5",
    completionCriteria: "5本以上の動画が完成し、各動画に検証仮説がタグ付けされていること",
    tasks: [
      {
        id: "5-1",
        title: "TopView Video Agentの操作を確認する",
        owners: ["creator"],
        due: "3週目 月曜",
        detail: "TopViewにログインし、基本操作（参考動画のアップロード、プロンプト入力、生成設定）を確認する。操作できる人を最低2名確保する。",
        tips: ["初めて使う場合はチュートリアル動画を先に確認", "無料枠がある場合はまずテスト生成して品質を確認"],
      },
      {
        id: "5-2",
        title: "優先度の高い企画から順に生成する",
        owners: ["creator"],
        due: "3週目 火〜木曜",
        detail: "15本の企画案に優先順位をつけ、上位5〜10本をTopViewで生成する。参考動画のリズム・構図・カメラワーク・編集テンポを入力する。",
        tips: ["最初から高品質を目指さない、あくまで「テスト投稿」用", "1本あたり2〜3回の生成で最も良いものを選ぶ"],
      },
      {
        id: "5-3",
        title: "人間によるレビュー・最終編集をする",
        owners: ["director", "creator", "approver"],
        due: "3週目 木〜金曜",
        detail: "生成された動画をチームでレビュー：① ブランドイメージに合っているか ② 元動画に寄せすぎていないか ③ 不快感や誤解を与えないか ④ 商品訴求として自然か",
        tips: ["テロップの修正、BGMの差し替え、不要シーンのカットは人間が行う", "法務チェックが必要な場合はこの段階で依頼する"],
      },
      {
        id: "5-4",
        title: "完成動画に「検証仮説」をタグ付けする",
        owners: ["marketer", "analyst"],
        due: "3週目 金曜",
        detail: "各動画に「この動画で何を検証するか」を明記する。例：「違和感型の冒頭は離脱率を下げるか」「Before/After型は保存率が高いか」。",
        tips: ["仮説がないと投稿後の数字がただの結果になってしまう", "スプレッドシートの動画管理シートに仮説列を追加する"],
      },
    ],
  },
  {
    id: "phase6",
    week: "4週目",
    title: "投稿・数値検証する",
    deliverable: "投稿結果レポート",
    deliverableKey: "link_phase6",
    completionCriteria: "全テスト動画のKPIが記録され、構造×反応の対応表が完成していること",
    tasks: [
      {
        id: "6-1",
        title: "投稿スケジュールを決めて投稿する",
        owners: ["marketer", "creator"],
        due: "4週目 月〜水曜",
        detail: "テスト動画を1日1〜2本のペースで投稿する。同じ型の動画は連続投稿を避け、比較しやすいように分散させる。",
        tips: ["投稿時間はターゲット層がアクティブな時間帯に合わせる", "各プラットフォームに最適化した形式（縦横比・長さ等）で投稿"],
      },
      {
        id: "6-2",
        title: "投稿後48時間以内のデータを記録する",
        owners: ["marketer"],
        due: "4週目 随時",
        detail: "各動画のKPIをスプレッドシートに記録：冒頭離脱率、平均視聴時間、視聴維持率、完了率、保存数・共有数、コメント内容、クリック率、購入・問い合わせ数。",
        tips: ["コメント内容は感情の種類（笑い/驚き/共感/批判等）を分類して記録", "48時間と1週間の2時点でデータを取ると傾向が見えやすい"],
      },
      {
        id: "6-3",
        title: "構造×反応の対応表を作成する",
        owners: ["marketer", "analyst"],
        due: "4週目 金曜",
        detail: "「どの構造（型）がどの反応（KPI）を生んだか」を一覧表にまとめ、型ごとの平均パフォーマンスを比較する。",
        tips: ["再生数だけでなく「保存率」「完了率」を重視する", "サンプル数が少ないので断定は避け、傾向として記録する"],
      },
    ],
  },
  {
    id: "phase7",
    week: "月末",
    title: "勝ちパターンを整理・蓄積する",
    deliverable: "勝ちパターンライブラリ v1",
    deliverableKey: "link_phase7",
    completionCriteria: "検証済みの型がカテゴリ別に整理され、プロンプトテンプレートが作成されていること",
    criteriaRef: "win_criteria",
    tasks: [
      {
        id: "7-1",
        title: "勝った型を特定する",
        owners: ["director", "marketer"],
        due: "月末",
        detail: "KPIが良かった動画の型を特定し記録：どの型だったか、なぜ反応したか、どの冒頭が強かったか、商品の出し方は自然だったか、次に横展開できるか。",
        tips: ["「勝ち」の定義をチームで合意しておく（例：視聴維持率50%以上 等）"],
      },
      {
        id: "7-2",
        title: "プロンプトテンプレートを作成する",
        owners: ["analyst"],
        due: "月末",
        detail: "勝った型の構造をプロンプト化。次回以降ゼロから考えずに生成AIに入力できるテンプレートにする。バージョン番号で管理する。",
        tips: ["テンプレート例：「[型名]型 × [商品カテゴリ] v1.0」", "成功した具体例もテンプレートに添付しておく"],
      },
      {
        id: "7-3",
        title: "勝ちパターンライブラリを作成する",
        owners: ["director", "analyst"],
        due: "月末",
        detail: "商品カテゴリ別・ターゲット別に検証済みの型を整理したドキュメントを作成する。月を重ねるごとに蓄積される自社独自の資産になる。",
        tips: ["NotionやGoogle Docsなど、チーム全員がアクセスできる場所に置く", "月次レビューで更新する運用ルールを設定する"],
      },
      {
        id: "7-4",
        title: "月次レビューを実施する",
        owners: ["director", "marketer", "approver"],
        due: "月末",
        detail: "チームで30〜60分のレビュー会を実施。KPIの振り返り、有効パターンの確認、翌月の方針を決める。新しいトレンド動画の取り込み判断も行う。",
        tips: ["議事録を残し、翌月の収集・分析フェーズに反映する", "「やめること」も決める（効果がなかった型は潔く外す）"],
      },
    ],
  },
];

/* ──────────────────────────────────────────────
   STORAGE HELPERS
   ────────────────────────────────────────────── */
const STORAGE_KEY = "topview_todo_state";

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* quota exceeded etc */ }
}

/* ──────────────────────────────────────────────
   ICONS
   ────────────────────────────────────────────── */
function CheckIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronDown({ open }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

/* ──────────────────────────────────────────────
   ROLE BADGE
   ────────────────────────────────────────────── */
function RoleBadge({ roleKey }) {
  const role = ROLES[roleKey];
  if (!role) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      fontSize: 10, fontWeight: 600, color: role.color,
      background: role.color + "14", padding: "2px 7px", borderRadius: 4,
      whiteSpace: "nowrap",
    }}>
      {role.label}
    </span>
  );
}

/* ──────────────────────────────────────────────
   STATUS SELECT
   ────────────────────────────────────────────── */
const STATUS_OPTIONS = [
  { value: "todo", label: "未着手", color: "#94a3b8", bg: "#f1f5f9" },
  { value: "doing", label: "進行中", color: "#f59e0b", bg: "#fffbeb" },
  { value: "done", label: "完了", color: "#16a34a", bg: "#f0fdf4" },
];

function StatusSelect({ value, onChange }) {
  const current = STATUS_OPTIONS.find((s) => s.value === value) || STATUS_OPTIONS[0];
  return (
    <select
      value={value || "todo"}
      onChange={(e) => onChange(e.target.value)}
      style={{
        fontSize: 11, fontWeight: 600, color: current.color, background: current.bg,
        border: "1px solid " + current.color + "33", borderRadius: 5, padding: "2px 6px",
        cursor: "pointer", outline: "none", appearance: "auto",
        fontFamily: "inherit",
      }}
    >
      {STATUS_OPTIONS.map((s) => (
        <option key={s.value} value={s.value}>{s.label}</option>
      ))}
    </select>
  );
}

/* ──────────────────────────────────────────────
   CRITERIA CARD
   ────────────────────────────────────────────── */
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

/* ──────────────────────────────────────────────
   MAIN APP
   ────────────────────────────────────────────── */
export default function App() {
  const [state, setState] = useState(() => {
    const saved = loadState();
    return saved || {
      statuses: {},      // { taskId: "todo"|"doing"|"done" }
      expandedPhases: { phase1: true },
      expandedTasks: {},
      links: {},         // { link_phaseN: "url" }
      showRoles: false,
    };
  });

  useEffect(() => { saveState(state); }, [state]);

  const update = useCallback((fn) => setState((prev) => {
    const next = { ...prev };
    fn(next);
    return next;
  }), []);

  const setStatus = (id, val) => update((s) => { s.statuses = { ...s.statuses, [id]: val }; });
  const togglePhase = (id) => update((s) => { s.expandedPhases = { ...s.expandedPhases, [id]: !s.expandedPhases[id] }; });
  const toggleTask = (id) => update((s) => { s.expandedTasks = { ...s.expandedTasks, [id]: !s.expandedTasks[id] }; });
  const setLink = (key, url) => update((s) => { s.links = { ...s.links, [key]: url }; });
  const toggleRoles = () => update((s) => { s.showRoles = !s.showRoles; });

  const totalTasks = PHASES.reduce((sum, p) => sum + p.tasks.length, 0);
  const completedTasks = PHASES.reduce((sum, p) =>
    sum + p.tasks.filter((t) => state.statuses[t.id] === "done").length, 0);
  const inProgressTasks = PHASES.reduce((sum, p) =>
    sum + p.tasks.filter((t) => state.statuses[t.id] === "doing").length, 0);
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const resetAll = () => {
    if (confirm("すべての進捗をリセットしますか？")) {
      localStorage.removeItem(STORAGE_KEY);
      setState({
        statuses: {}, expandedPhases: { phase1: true }, expandedTasks: {}, links: {}, showRoles: false,
      });
    }
  };

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "28px 16px 60px" }}>
      {/* ── HEADER ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 30 }}>🎬</span>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>
              TopView ショート動画制作
            </h1>
            <p style={{ fontSize: 12, color: "#888", margin: "2px 0 0" }}>初月実行プラン — 7ステップ Todo & 手順書</p>
          </div>
        </div>
      </div>

      {/* ── PROGRESS ── */}
      <div style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#444" }}>全体進捗</span>
          <div style={{ display: "flex", gap: 14, alignItems: "baseline" }}>
            {inProgressTasks > 0 && (
              <span style={{ fontSize: 12, color: "#f59e0b", fontWeight: 600 }}>🔄 {inProgressTasks} 進行中</span>
            )}
            <span style={{ fontSize: 24, fontWeight: 800, color: progress === 100 ? "#16a34a" : "#6366f1" }}>
              {completedTasks}<span style={{ fontSize: 13, fontWeight: 500, color: "#999" }}>/{totalTasks}</span>
            </span>
          </div>
        </div>
        <div style={{ height: 7, background: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 4, transition: "width 0.3s",
            width: `${progress}%`,
            background: progress === 100 ? "#16a34a" : "linear-gradient(90deg, #6366f1, #8b5cf6)",
          }} />
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
        <button onClick={resetAll} style={{
          fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 8, cursor: "pointer",
          border: "1px solid #e5e7eb", background: "#fff", color: "#999",
        }}>
          ↺ リセット
        </button>
      </div>

      {/* ── ROLE TABLE ── */}
      {state.showRoles && (
        <div style={{ background: "#fff", borderRadius: 14, padding: "16px 20px", marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>👥 チーム体制（RACI）</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "6px 16px" }}>
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
      {PHASES.map((phase, pi) => {
        const phaseCompleted = phase.tasks.filter((t) => state.statuses[t.id] === "done").length;
        const phaseTotal = phase.tasks.length;
        const allDone = phaseCompleted === phaseTotal;
        const isOpen = state.expandedPhases[phase.id];
        const linkVal = state.links[phase.deliverableKey] || "";

        return (
          <div key={phase.id} style={{
            marginBottom: 12, borderRadius: 14, overflow: "hidden", background: "#fff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}>
            {/* Phase Header */}
            <button onClick={() => togglePhase(phase.id)} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 12,
              padding: "14px 16px", border: "none", cursor: "pointer", textAlign: "left",
              background: allDone ? "#f0fdf4" : "#fafafe",
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 15, fontWeight: 800, flexShrink: 0,
                background: allDone ? "#16a34a" : "#6366f1", color: "#fff",
              }}>
                {allDone ? <CheckIcon size={16} /> : pi + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: allDone ? "#16a34a" : "#6366f1", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {phase.week}
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
                {/* Deliverable + Link */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", background: "#f5f3ff", borderRadius: 8, marginBottom: 4, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12 }}>📦</span>
                  <span style={{ fontSize: 12, color: "#6366f1", fontWeight: 700 }}>成果物：{phase.deliverable}</span>
                  <div style={{ flex: 1 }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ color: "#6366f1" }}><LinkIcon /></span>
                    <input
                      type="text"
                      placeholder="成果物リンクを貼る"
                      value={linkVal}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => { e.stopPropagation(); setLink(phase.deliverableKey, e.target.value); }}
                      style={{
                        fontSize: 11, border: "1px solid #e0d9f7", borderRadius: 5, padding: "3px 8px",
                        width: 180, outline: "none", fontFamily: "inherit", color: "#555",
                      }}
                    />
                  </div>
                </div>

                {/* Completion Criteria */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 6, padding: "8px 12px", background: "#ecfdf5", borderRadius: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 11 }}>✅</span>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#047857" }}>完了条件：</span>
                    <span style={{ fontSize: 11, color: "#065f46" }}>{phase.completionCriteria}</span>
                  </div>
                </div>

                {/* Judgment Criteria */}
                {phase.criteriaRef && CRITERIA[phase.criteriaRef] && (
                  <CriteriaCard criteria={CRITERIA[phase.criteriaRef]} />
                )}

                {/* Tasks */}
                {phase.tasks.map((task) => {
                  const status = state.statuses[task.id] || "todo";
                  const isDone = status === "done";
                  const isTaskOpen = state.expandedTasks[task.id];

                  return (
                    <div key={task.id} style={{
                      marginTop: 6, borderRadius: 10, border: "1px solid " + (isDone ? "#d1fae5" : "#f0f0f0"),
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
                          {/* Owner badges inline */}
                          <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                            {task.owners.map((o) => <RoleBadge key={o} roleKey={o} />)}
                            {task.due && (
                              <span style={{ fontSize: 10, color: "#999", padding: "2px 6px", background: "#f5f5f5", borderRadius: 4 }}>
                                📅 {task.due}
                              </span>
                            )}
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

      {/* ── FOOTER ── */}
      <div style={{ marginTop: 28, padding: "16px 20px", background: "#fff", borderRadius: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#555", marginBottom: 6 }}>
          💡 このサイクルを回し続けることが差別化になる
        </div>
        <p style={{ fontSize: 12, color: "#888", lineHeight: 1.7, margin: 0 }}>
          2ヶ月目以降はSTEP 1〜7を繰り返し、勝ちパターンライブラリを月次で更新していく。蓄積が進むほど、他社が簡単に真似できない独自の動画制作資産になる。
        </p>
      </div>

      <p style={{ textAlign: "center", fontSize: 11, color: "#ccc", marginTop: 20 }}>
        進捗はブラウザに自動保存されます
      </p>
    </div>
  );
}
