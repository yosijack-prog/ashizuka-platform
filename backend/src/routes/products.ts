import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// 商品一覧（ジャンルでフィルタ・名前検索可）
router.get('/', async (req, res) => {
  try {
    const { genre, q } = req.query;
    const products = await prisma.product.findMany({
      where: {
        ...(genre ? { genre: String(genre) } : {}),
        ...(q ? { name: { contains: String(q) } } : {}),
      },
      orderBy: { name: 'asc' },
    });
    res.json({ data: products, error: null, success: true });
  } catch (e) {
    res.status(500).json({ data: null, error: String(e), success: false });
  }
});

// 商品取得
router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ data: null, error: '商品が見つかりません', success: false });
    res.json({ data: product, error: null, success: true });
  } catch (e) {
    res.status(500).json({ data: null, error: String(e), success: false });
  }
});

// 商品作成
router.post('/', async (req, res) => {
  try {
    const product = await prisma.product.create({ data: req.body });
    res.status(201).json({ data: product, error: null, success: true });
  } catch (e) {
    res.status(400).json({ data: null, error: String(e), success: false });
  }
});

// 商品更新（在庫更新にも使用）
router.put('/:id', async (req, res) => {
  try {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json({ data: product, error: null, success: true });
  } catch (e) {
    res.status(400).json({ data: null, error: String(e), success: false });
  }
});

export default router;
