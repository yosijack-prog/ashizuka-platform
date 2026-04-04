import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// 発注一覧（ソース・担当者・顧客・期間でフィルタ可）
router.get('/', async (req, res) => {
  try {
    const { source, employeeId, customerId, from, to } = req.query;
    const orders = await prisma.order.findMany({
      where: {
        ...(source ? { source: source as 'smart_unit' | 'customer_order' | 'manual' } : {}),
        ...(employeeId ? { employeeId: String(employeeId) } : {}),
        ...(customerId ? { customerId: String(customerId) } : {}),
        ...(from || to
          ? {
              orderDate: {
                ...(from ? { gte: new Date(String(from)) } : {}),
                ...(to ? { lte: new Date(String(to)) } : {}),
              },
            }
          : {}),
      },
      include: { lines: true },
      orderBy: { orderDate: 'desc' },
    });
    res.json({ data: orders, error: null, success: true });
  } catch (e) {
    res.status(500).json({ data: null, error: String(e), success: false });
  }
});

// 発注取得
router.get('/:id', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { lines: true, customer: true, employee: true },
    });
    if (!order) return res.status(404).json({ data: null, error: '発注が見つかりません', success: false });
    res.json({ data: order, error: null, success: true });
  } catch (e) {
    res.status(500).json({ data: null, error: String(e), success: false });
  }
});

// 発注作成（明細込み）
router.post('/', async (req, res) => {
  try {
    const { lines, ...header } = req.body;
    const order = await prisma.order.create({
      data: {
        ...header,
        orderDate: new Date(header.orderDate),
        deliveryDate: header.deliveryDate ? new Date(header.deliveryDate) : undefined,
        lines: { create: lines },
      },
      include: { lines: true },
    });
    res.status(201).json({ data: order, error: null, success: true });
  } catch (e) {
    res.status(400).json({ data: null, error: String(e), success: false });
  }
});

// 配送ステータス更新
router.patch('/:id/delivery-status', async (req, res) => {
  try {
    const { deliveryStatus } = req.body;
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { deliveryStatus },
    });
    res.json({ data: order, error: null, success: true });
  } catch (e) {
    res.status(400).json({ data: null, error: String(e), success: false });
  }
});

export default router;
