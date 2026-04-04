import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// 新商品導入記録一覧（社員・四半期でフィルタ可）
router.get('/', async (req, res) => {
  try {
    const { employeeId, quarterKey } = req.query;
    const records = await prisma.newProductIntroduction.findMany({
      where: {
        ...(employeeId ? { employeeId: String(employeeId) } : {}),
        ...(quarterKey ? { quarterKey: String(quarterKey) } : {}),
      },
      orderBy: { firstOrderDate: 'desc' },
    });
    res.json({ data: records, error: null, success: true });
  } catch (e) {
    res.status(500).json({ data: null, error: String(e), success: false });
  }
});

// 新商品導入記録の作成または更新
router.post('/', async (req, res) => {
  try {
    const { employeeId, customerId, productId, quarterKey, ...rest } = req.body;
    const record = await prisma.newProductIntroduction.upsert({
      where: { employeeId_customerId_productId_quarterKey: { employeeId, customerId, productId, quarterKey } },
      create: {
        employeeId,
        customerId,
        productId,
        quarterKey,
        ...rest,
        firstOrderDate: new Date(rest.firstOrderDate),
      },
      update: {
        continuedMonths: rest.continuedMonths,
        isSettled: rest.isSettled,
      },
    });
    res.json({ data: record, error: null, success: true });
  } catch (e) {
    res.status(400).json({ data: null, error: String(e), success: false });
  }
});

export default router;
