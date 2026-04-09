import express from 'express';
import cors from 'cors';
import employeeRoutes from './routes/employees';
import customerRoutes from './routes/customers';
import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import newProductRoutes from './routes/newProducts';
import evaluationRoutes from './routes/evaluations';
import evalDataRoutes from './routes/evalData';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

// ヘルスチェック
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: '芦塚酒店 統合APIサーバー' });
});

// API ルート（全システム共通）
app.use('/api/employees', employeeRoutes);       // SmartUnit / SalesManager
app.use('/api/customers', customerRoutes);       // SmartUnit / CustomerOrder / SalesManager
app.use('/api/products', productRoutes);         // AlcoholSearch / SmartUnit / CustomerOrder
app.use('/api/orders', orderRoutes);             // SmartUnit / CustomerOrder
app.use('/api/new-products', newProductRoutes);  // SalesManager
app.use('/api/evaluations', evaluationRoutes);   // SalesManager
app.use('/api/eval-data', evalDataRoutes);       // SalesManager: SQL Server 実データ評価スコア

app.listen(PORT, () => {
  console.log(`✅ 芦塚酒店 統合APIサーバー起動 → http://localhost:${PORT}`);
  console.log('   接続システム: SmartUnit / CustomerOrder / AlcoholSearch / SalesManager');
  console.log('   SQL Server 評価データ: GET /api/eval-data  POST /api/eval-data/refresh');
});
