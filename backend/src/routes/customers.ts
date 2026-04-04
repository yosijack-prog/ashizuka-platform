import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// 顧客一覧（エリア・担当者でフィルタ可）
router.get('/', async (req, res) => {
  try {
    const { area, employeeId } = req.query;
    const customers = await prisma.customer.findMany({
      where: {
        ...(area ? { area: String(area) } : {}),
        ...(employeeId ? { assignedEmployeeId: String(employeeId) } : {}),
      },
      include: { assignedEmployee: true },
      orderBy: { furigana: 'asc' },
    });
    res.json({ data: customers, error: null, success: true });
  } catch (e) {
    res.status(500).json({ data: null, error: String(e), success: false });
  }
});

// 顧客取得（価格マスタ込み）
router.get('/:id', async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: { assignedEmployee: true, prices: { include: { product: true } } },
    });
    if (!customer) return res.status(404).json({ data: null, error: '顧客が見つかりません', success: false });
    res.json({ data: customer, error: null, success: true });
  } catch (e) {
    res.status(500).json({ data: null, error: String(e), success: false });
  }
});

// 顧客作成
router.post('/', async (req, res) => {
  try {
    const customer = await prisma.customer.create({ data: req.body });
    res.status(201).json({ data: customer, error: null, success: true });
  } catch (e) {
    res.status(400).json({ data: null, error: String(e), success: false });
  }
});

// 顧客更新
router.put('/:id', async (req, res) => {
  try {
    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json({ data: customer, error: null, success: true });
  } catch (e) {
    res.status(400).json({ data: null, error: String(e), success: false });
  }
});

// 顧客別価格の更新（upsert）
router.put('/:id/prices', async (req, res) => {
  try {
    const { productId, sellingPrice } = req.body;
    const price = await prisma.customerPrice.upsert({
      where: { customerId_productId: { customerId: req.params.id, productId } },
      create: { customerId: req.params.id, productId, sellingPrice },
      update: { sellingPrice },
    });
    res.json({ data: price, error: null, success: true });
  } catch (e) {
    res.status(400).json({ data: null, error: String(e), success: false });
  }
});

export default router;
