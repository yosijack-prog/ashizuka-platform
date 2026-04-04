import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// 社員一覧
router.get('/', async (_req, res) => {
  try {
    const employees = await prisma.employee.findMany({ orderBy: { name: 'asc' } });
    res.json({ data: employees, error: null, success: true });
  } catch (e) {
    res.status(500).json({ data: null, error: String(e), success: false });
  }
});

// 社員取得
router.get('/:id', async (req, res) => {
  try {
    const employee = await prisma.employee.findUnique({ where: { id: req.params.id } });
    if (!employee) return res.status(404).json({ data: null, error: '社員が見つかりません', success: false });
    res.json({ data: employee, error: null, success: true });
  } catch (e) {
    res.status(500).json({ data: null, error: String(e), success: false });
  }
});

// 社員作成
router.post('/', async (req, res) => {
  try {
    const employee = await prisma.employee.create({ data: req.body });
    res.status(201).json({ data: employee, error: null, success: true });
  } catch (e) {
    res.status(400).json({ data: null, error: String(e), success: false });
  }
});

// 社員更新
router.put('/:id', async (req, res) => {
  try {
    const employee = await prisma.employee.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json({ data: employee, error: null, success: true });
  } catch (e) {
    res.status(400).json({ data: null, error: String(e), success: false });
  }
});

// 社員削除
router.delete('/:id', async (req, res) => {
  try {
    await prisma.employee.delete({ where: { id: req.params.id } });
    res.json({ data: null, error: null, success: true });
  } catch (e) {
    res.status(400).json({ data: null, error: String(e), success: false });
  }
});

export default router;
