/**
 * 評価データ API
 * GET /api/eval-data          → キャッシュ済みスコアを返す
 * POST /api/eval-data/refresh → SQL Server から再取得してキャッシュ更新
 *
 * データ取得元: スーパーリカー SQL Server (Posmst)
 * 更新頻度: 月1回（手動またはスケジューラから POST /refresh を呼ぶ）
 */
import { Router, Request, Response } from 'express';
import { query } from '../lib/sqlserver';

const router = Router();

// ─── 型定義 ───────────────────────────────────────
interface RepSalesRow {
  担当者コード: number;
  担当者名: string;
  売上合計: number;
  粗利合計: number;
  粗利率: number;
}

interface RetentionRow {
  担当者コード: number;
  担当者名: string;
  Q4顧客数: number;
  Q1継続数: number;
  維持率: number;
}

interface NewCustRow {
  担当者コード: number;
  担当者名: string;
  新規顧客数: number;
}

interface EvalScoreEntry {
  code: number;
  name: string;
  // 売上
  salesQ1: number;
  salesQ1Prev: number;
  salesYoY: number;       // % 前年同期比
  salesScore: number;     // 0-130
  // 粗利
  grossProfitQ1: number;
  grossMarginRate: number; // %
  marginScore: number;
  // 顧客維持
  retentionQ4: number;    // Q4顧客数
  retentionQ1: number;    // Q1継続数
  retentionRate: number;  // %
  retentionScore: number;
  // 新規顧客
  newCustomers: number;
  newCustTarget: number;
  newCustScore: number;
  // メタ
  isNewHire: boolean;     // 2025年8月以降着任
  dataNote: string;
}

interface Cache {
  fetchedAt: string;   // ISO date
  period: string;      // '2026-Q1'
  scores: EvalScoreEntry[];
}

// ─── インメモリキャッシュ ──────────────────────────
let cache: Cache | null = null;
const TARGET_CODES = [10, 11, 19, 21, 23, 24];

// 2025年8月以降着任の担当者（前年比ゼロになる新任）
const NEW_HIRE_CODES = new Set([23, 24]); // 谷口・奥田
// 新任の新規顧客目標は8社、既存担当は5社
const NEW_CUST_TARGET: Record<number, number> = {
  10: 5, 11: 5, 19: 5, 21: 5, 23: 8, 24: 8,
};
// 粗利率目標（Q1実績の最高値近辺 = 22%）
const MARGIN_TARGET = 22.0;

// ─── スコア計算 ────────────────────────────────────
function calcSalesScore(yoy: number, isNewHire: boolean): number {
  if (isNewHire) return 108; // 新任：引継ぎ直後のため固定補正
  return Math.min(130, Math.round(yoy));
}
function calcMarginScore(rate: number): number {
  if (rate <= 0) return 85;
  return Math.min(130, Math.round(rate / MARGIN_TARGET * 100));
}
function calcRetentionScore(rate: number): number {
  // 80%=100点, 90%=115点, 70%=85点
  return Math.min(130, Math.round(rate / 80 * 100));
}
function calcNewCustScore(count: number, target: number): number {
  return Math.min(130, Math.round(count / target * 100));
}

// ─── SQL Server からデータ取得 ──────────────────────
async function fetchFromSqlServer(): Promise<EvalScoreEntry[]> {
  const codesStr = TARGET_CODES.join(',');

  // 1. 売上 + 粗利率 (Q1-2026)
  const salesQ1 = await query<RepSalesRow>(`
    SELECT
      s.担当者コード,
      m.担当者名,
      SUM(d.金額)  AS 売上合計,
      SUM(d.粗利)  AS 粗利合計,
      CASE WHEN SUM(d.金額)>0
        THEN CAST(SUM(d.粗利)*100.0/SUM(d.金額) AS DECIMAL(5,1))
        ELSE 0 END AS 粗利率
    FROM T_売上伝票 s
    JOIN T_売上伝票明細 d ON s.登録番号 = d.売上伝票登録番号
    LEFT JOIN T_担当者マスタ m ON s.担当者コード = m.担当者コード
    WHERE s.日付１ >= '2026-01-01' AND s.日付１ < '2026-04-01'
      AND s.担当者コード IN (${codesStr})
    GROUP BY s.担当者コード, m.担当者名
  `);

  // 2. 売上 (Q1-2025, 前年比用)
  const salesQ1Prev = await query<RepSalesRow>(`
    SELECT
      s.担当者コード,
      m.担当者名,
      SUM(d.金額) AS 売上合計,
      SUM(d.粗利) AS 粗利合計,
      CASE WHEN SUM(d.金額)>0
        THEN CAST(SUM(d.粗利)*100.0/SUM(d.金額) AS DECIMAL(5,1))
        ELSE 0 END AS 粗利率
    FROM T_売上伝票 s
    JOIN T_売上伝票明細 d ON s.登録番号 = d.売上伝票登録番号
    LEFT JOIN T_担当者マスタ m ON s.担当者コード = m.担当者コード
    WHERE s.日付１ >= '2025-01-01' AND s.日付１ < '2025-04-01'
      AND s.担当者コード IN (${codesStr})
    GROUP BY s.担当者コード, m.担当者名
  `);

  // 3. 顧客維持率 Q4-2025 → Q1-2026
  const retention = await query<RetentionRow>(`
    WITH q4 AS (
      SELECT DISTINCT s.担当者コード, m.担当者名, s.得意先コード
      FROM T_売上伝票 s
      LEFT JOIN T_担当者マスタ m ON s.担当者コード = m.担当者コード
      WHERE s.日付１ >= '2025-10-01' AND s.日付１ < '2026-01-01'
        AND s.担当者コード IN (${codesStr}) AND s.金額計 > 0
    ),
    q1 AS (
      SELECT DISTINCT s.担当者コード, s.得意先コード
      FROM T_売上伝票 s
      WHERE s.日付１ >= '2026-01-01' AND s.日付１ < '2026-04-01'
        AND s.金額計 > 0
    )
    SELECT
      q4.担当者コード, q4.担当者名,
      COUNT(*) AS Q4顧客数,
      SUM(CASE WHEN q1.得意先コード IS NOT NULL THEN 1 ELSE 0 END) AS Q1継続数,
      CAST(SUM(CASE WHEN q1.得意先コード IS NOT NULL THEN 1 ELSE 0 END)*100.0/COUNT(*) AS DECIMAL(5,1)) AS 維持率
    FROM q4
    LEFT JOIN q1 ON q4.担当者コード = q1.担当者コード AND q4.得意先コード = q1.得意先コード
    GROUP BY q4.担当者コード, q4.担当者名
  `);

  // 4. 新規顧客 Q1-2026
  const newCust = await query<NewCustRow>(`
    WITH prev AS (
      SELECT DISTINCT s.担当者コード, s.得意先コード
      FROM T_売上伝票 s
      WHERE s.日付１ < '2026-01-01' AND s.金額計 > 0
        AND s.担当者コード IN (${codesStr})
    ),
    q1 AS (
      SELECT DISTINCT s.担当者コード, m.担当者名, s.得意先コード
      FROM T_売上伝票 s
      LEFT JOIN T_担当者マスタ m ON s.担当者コード = m.担当者コード
      WHERE s.日付１ >= '2026-01-01' AND s.日付１ < '2026-04-01'
        AND s.金額計 > 0 AND s.担当者コード IN (${codesStr})
    )
    SELECT q1.担当者コード, q1.担当者名, COUNT(*) AS 新規顧客数
    FROM q1
    LEFT JOIN prev ON q1.担当者コード = prev.担当者コード AND q1.得意先コード = prev.得意先コード
    WHERE prev.得意先コード IS NULL
    GROUP BY q1.担当者コード, q1.担当者名
  `);

  // ─── マージ ─────────────────────────────────────
  const map = new Map<number, Partial<EvalScoreEntry>>();
  for (const code of TARGET_CODES) map.set(code, { code, name: '' });

  for (const r of salesQ1) {
    const e = map.get(r.担当者コード) ?? {};
    e.code = r.担当者コード;
    e.name = r.担当者名 ?? '';
    e.salesQ1 = r.売上合計 ?? 0;
    e.grossProfitQ1 = r.粗利合計 ?? 0;
    e.grossMarginRate = r.粗利率 ?? 0;
    map.set(r.担当者コード, e);
  }
  for (const r of salesQ1Prev) {
    const e = map.get(r.担当者コード) ?? {};
    e.salesQ1Prev = r.売上合計 ?? 0;
    map.set(r.担当者コード, e);
  }
  for (const r of retention) {
    const e = map.get(r.担当者コード) ?? {};
    e.retentionQ4 = r.Q4顧客数 ?? 0;
    e.retentionQ1 = r.Q1継続数 ?? 0;
    e.retentionRate = r.維持率 ?? 0;
    map.set(r.担当者コード, e);
  }
  for (const r of newCust) {
    const e = map.get(r.担当者コード) ?? {};
    e.newCustomers = r.新規顧客数 ?? 0;
    map.set(r.担当者コード, e);
  }

  // ─── スコア計算 ─────────────────────────────────
  const results: EvalScoreEntry[] = [];
  for (const [code, e] of map.entries()) {
    const isNew = NEW_HIRE_CODES.has(code);
    const sq1 = e.salesQ1 ?? 0;
    const sq1p = e.salesQ1Prev ?? 0;
    const yoy = sq1p > 10000 ? sq1 / sq1p * 100 : 0;
    const mg = e.grossMarginRate ?? 0;
    const ret = e.retentionRate ?? 0;
    const nc = e.newCustomers ?? 0;
    const nct = NEW_CUST_TARGET[code] ?? 5;

    results.push({
      code,
      name: e.name ?? String(code),
      salesQ1: sq1,
      salesQ1Prev: sq1p,
      salesYoY: Math.round(yoy * 10) / 10,
      salesScore: calcSalesScore(yoy, isNew),
      grossProfitQ1: e.grossProfitQ1 ?? 0,
      grossMarginRate: mg,
      marginScore: calcMarginScore(mg),
      retentionQ4: e.retentionQ4 ?? 0,
      retentionQ1: e.retentionQ1 ?? 0,
      retentionRate: ret,
      retentionScore: calcRetentionScore(ret),
      newCustomers: nc,
      newCustTarget: nct,
      newCustScore: calcNewCustScore(nc, nct),
      isNewHire: isNew,
      dataNote: isNew ? '2025年8月着任・引継ぎ補正済み' : '',
    });
  }

  return results.filter(r => r.name);
}

// ─── エンドポイント ────────────────────────────────

// GET /api/eval-data  → キャッシュを返す（未取得なら自動取得）
router.get('/', async (_req: Request, res: Response) => {
  try {
    if (!cache) {
      const scores = await fetchFromSqlServer();
      cache = { fetchedAt: new Date().toISOString(), period: '2026-Q1', scores };
    }
    res.json({ data: cache, error: null, success: true });
  } catch (e) {
    console.error('[evalData] GET error:', e);
    res.status(500).json({ data: null, error: String(e), success: false });
  }
});

// POST /api/eval-data/refresh  → SQL Server再取得・キャッシュ更新
router.post('/refresh', async (_req: Request, res: Response) => {
  try {
    const scores = await fetchFromSqlServer();
    cache = { fetchedAt: new Date().toISOString(), period: '2026-Q1', scores };
    console.log(`[evalData] refreshed: ${scores.length}名 @ ${cache.fetchedAt}`);
    res.json({ data: cache, error: null, success: true });
  } catch (e) {
    console.error('[evalData] refresh error:', e);
    res.status(500).json({ data: null, error: String(e), success: false });
  }
});

// GET /api/eval-data/status  → キャッシュの状態確認
router.get('/status', (_req: Request, res: Response) => {
  res.json({
    cached: !!cache,
    fetchedAt: cache?.fetchedAt ?? null,
    period: cache?.period ?? null,
    count: cache?.scores.length ?? 0,
  });
});

export default router;
