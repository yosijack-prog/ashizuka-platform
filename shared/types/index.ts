// ============================================================
// 芦塚酒店 統合プラットフォーム - 共通型定義
// 全アプリ（SmartUnit / CustomerOrder / AlcoholSearch / SalesManager）で使用
// ============================================================

// --- 社員 ---
export interface Employee {
  id: string;
  name: string;
  color: string;
  avatar: string;
  role: 'driver' | 'sales' | 'warehouse' | 'manager';
}

// --- 顧客（得意先） ---
export interface Customer {
  id: string;          // 得意先コード
  name: string;
  furigana: string;
  address: string;
  tel: string;
  area: string;
  category: string;    // 業態（居酒屋・焼肉など）
  assignedEmployeeId: string;
  creditLimit: number; // 与信限度額
}

// --- 商品マスタ ---
export interface Product {
  id: string;          // PLUコード
  name: string;
  genre: string;       // ビール・日本酒・焼酎・ワイン・ガス
  unit: string;
  costPrice: number;   // 仕入原価（税抜）
  stock: number;
  caseSize?: number;
}

// --- 顧客別販売価格 ---
export interface CustomerPrice {
  customerId: string;
  productId: string;
  sellingPrice: number; // 顧客ごとの販売価格（税抜）
}

// --- 発注ライン（1商品1行） ---
export interface OrderLine {
  productId: string;
  productName: string;
  qty: number;
  unit: string;
  unitType: 'single' | 'case';
  sellingPrice: number; // 販売価格（税抜）
  costPrice: number;    // 仕入原価（税抜）
  grossProfit: number;  // 粗利額 = sellingPrice - costPrice
  grossMargin: number;  // 粗利率 = grossProfit / sellingPrice
}

// --- 発注ヘッダー ---
export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  employeeId: string;    // 担当社員ID
  orderDate: string;     // YYYY-MM-DD
  deliveryDate?: string;
  lines: OrderLine[];
  totalAmount: number;
  totalGrossProfit: number;
  totalGrossMargin: number;
  isNewProduct: boolean; // 顧客への初回商品を含む場合true
  source: 'smart_unit' | 'customer_order' | 'manual';
}

// --- 新商品導入記録（評価用） ---
export interface NewProductIntroduction {
  id: string;
  employeeId: string;
  customerId: string;
  customerName: string;
  productId: string;
  productName: string;
  firstOrderDate: string;    // 初回発注日
  firstOrderGrossMargin: number; // 初回粗利率
  continuedMonths: number;   // 継続発注月数（0=初月のみ）
  isSettled: boolean;        // 定着済み（3ヶ月連続 = true）
  quarterKey: string;        // 評価四半期 例: '2026-Q1'
}

// --- 四半期評価 ---
export interface QuarterlyEvaluation {
  id: string;
  employeeId: string;
  employeeName: string;
  quarterKey: string;        // 例: '2026-Q2'

  // 新商品開拓（33%）
  newProductCount: number;   // 四半期内の新商品導入件数
  newProductTarget: number;  // 目標件数 MAX(基準値B, 前期×1.07)
  newProductScore: number;   // 0-100

  // 販売利益率（33%）
  avgGrossMargin: number;    // 四半期平均粗利率(%)
  marginTarget: number;      // 目標粗利率
  marginScore: number;       // 0-100

  // 定着率（34%）
  settlementRate: number;    // 定着率(%) 3ヶ月継続/初回導入数
  settlementTarget: number;  // 目標定着率
  settlementScore: number;   // 0-100

  // 総合スコア
  totalScore: number;        // 加重平均 (33+33+34)/100

  // 目標設定用
  baseCoefficient: number;   // 全社係数（自動計算）
  prevQuarterScore: number;  // 前四半期スコア
}

// --- 配送ステータス ---
export type DeliveryStatus =
  | 'pending'
  | 'assigned'
  | 'picking'
  | 'picked'
  | 'in_transit'
  | 'delivered';

// --- API レスポンス共通形式 ---
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}
