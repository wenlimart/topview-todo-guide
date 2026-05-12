/* ──────────────────────────────────────────────
   ROLE DEFINITIONS
   ────────────────────────────────────────────── */
export const ROLES = {
  director: { label: "ディレクター",       color: "#6366f1", short: "D", description: "全体設計、型の選定、レビュー" },
  research: { label: "リサーチ担当",       color: "#0ea5e9", short: "R", description: "バズ動画収集、数値記録" },
  analyst:  { label: "AI分析担当",         color: "#8b5cf6", short: "A", description: "書き起こし、構造分析、プロンプト作成" },
  creator:  { label: "制作担当",           color: "#f59e0b", short: "C", description: "Topview生成、編集、投稿準備" },
  marketer: { label: "マーケ担当",         color: "#10b981", short: "M", description: "KPI設計、投稿結果分析" },
  approver: { label: "責任者/クライアント", color: "#ef4444", short: "承", description: "ブランド・法務・最終承認" },
};

/* ──────────────────────────────────────────────
   JUDGMENT CRITERIA
   ────────────────────────────────────────────── */
export const CRITERIA = {
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
