import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// 四半期評価一覧（社員・四半期でフィルタ可）
router.get('/', async (req, res) => {
  try {
    const { employeeId, quarterKey } = req.query;
    const evaluations = await prisma.quarterlyEvaluation.findMany({
      where: {
        ...(employeeId ? { employeeId: String(employeeId) } : {}),
        ...(quarterKey ? { quarterKey: String(quarterKey) } : {}),
      },
      include: { employee: true },
      orderBy: [{ quarterKey: 'desc' }, { totalScore: 'desc' }],
    });
    res.json({ data: evaluations, error: null, success: true });
  } catch (e) {
    res.status(500).json({ data: null, error: String(e), success: false });
  }
});

// 四半期評価の作成または更新
router.post('/', async (req, res) => {
  try {
    const { employeeId, quarterKey, ...rest } = req.body;
    const evaluation = await prisma.quarterlyEvaluation.upsert({
      where: { employeeId_quarterKey: { employeeId, quarterKey } },
      create: { employeeId, quarterKey, ...rest },
      update: rest,
    });
    res.json({ data: evaluation, error: null, success: true });
  } catch (e) {
    res.status(400).json({ data: null, error: String(e), success: false });
  }
});

export default router;
