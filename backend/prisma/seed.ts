// ============================================================
// 芦塚酒店 統合プラットフォーム - シードデータ
// SmartUnit の社員・評価データを投入
// ============================================================
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 シードデータを投入中...');

  // --- 社員 ---
  const employees = [
    { id: 'emp_tan', name: '谷口 亮介',   color: '#3b82f6', avatar: '谷', role: 'driver' },
    { id: 'emp_oku', name: '奥田 玲晃',   color: '#22c55e', avatar: '奥', role: 'driver' },
    { id: 'emp_abi', name: '阿比留 徹',   color: '#f59e0b', avatar: '阿', role: 'driver' },
    { id: 'emp_aka', name: '赤川 秀敏',   color: '#ef4444', avatar: '赤', role: 'driver' },
    { id: 'emp_ima', name: '今村 淳子',   color: '#a855f7', avatar: '今', role: 'driver' },
    { id: 'emp_kaw', name: '川原 未香',   color: '#ec4899', avatar: '川', role: 'driver' },
    { id: 'emp_ash', name: '芦塚 義幸',   color: '#06b6d4', avatar: '芦', role: 'manager' },
    { id: 'emp_sak', name: '酒井 さやか', color: '#84cc16', avatar: '酒', role: 'sales'  },
  ];

  for (const emp of employees) {
    await prisma.employee.upsert({
      where: { id: emp.id },
      update: emp,
      create: emp,
    });
  }
  console.log(`✅ 社員 ${employees.length} 件`);

  // --- 四半期評価（2026-Q1） ---
  const evalData = [
    { empId: 'emp_tan', name: '谷口 亮介',   newCount: 9,  newTarget: 7,  newScore: 100, margin: 32, marginTarget: 28, marginScore: 100, settle: 78, settleTarget: 70, settleScore: 100, total: 100, coef: 0.45, prev: 92 },
    { empId: 'emp_oku', name: '奥田 玲晃',   newCount: 7,  newTarget: 7,  newScore: 88,  margin: 30, marginTarget: 28, marginScore: 94,  settle: 71, settleTarget: 70, settleScore: 88,  total: 90,  coef: 0.45, prev: 85 },
    { empId: 'emp_abi', name: '阿比留 徹',   newCount: 6,  newTarget: 7,  newScore: 75,  margin: 29, marginTarget: 28, marginScore: 88,  settle: 75, settleTarget: 70, settleScore: 92,  total: 85,  coef: 0.45, prev: 80 },
    { empId: 'emp_aka', name: '赤川 秀敏',   newCount: 4,  newTarget: 7,  newScore: 58,  margin: 27, marginTarget: 28, marginScore: 75,  settle: 60, settleTarget: 70, settleScore: 70,  total: 68,  coef: 0.45, prev: 65 },
    { empId: 'emp_ima', name: '今村 淳子',   newCount: 3,  newTarget: 6,  newScore: 55,  margin: 26, marginTarget: 28, marginScore: 70,  settle: 55, settleTarget: 70, settleScore: 65,  total: 63,  coef: 0.45, prev: 60 },
    { empId: 'emp_kaw', name: '川原 未香',   newCount: 2,  newTarget: 6,  newScore: 45,  margin: 25, marginTarget: 28, marginScore: 65,  settle: 50, settleTarget: 70, settleScore: 58,  total: 56,  coef: 0.45, prev: 52 },
    { empId: 'emp_ash', name: '芦塚 義幸',   newCount: 2,  newTarget: 6,  newScore: 42,  margin: 24, marginTarget: 28, marginScore: 60,  settle: 45, settleTarget: 70, settleScore: 52,  total: 51,  coef: 0.45, prev: 48 },
    { empId: 'emp_sak', name: '酒井 さやか', newCount: 1,  newTarget: 5,  newScore: 35,  margin: 23, marginTarget: 28, marginScore: 55,  settle: 40, settleTarget: 70, settleScore: 45,  total: 45,  coef: 0.45, prev: 42 },
  ];

  for (const e of evalData) {
    await prisma.quarterlyEvaluation.upsert({
      where: { employeeId_quarterKey: { employeeId: e.empId, quarterKey: '2026-Q1' } },
      update: {},
      create: {
        employeeId:       e.empId,
        employeeName:     e.name,
        quarterKey:       '2026-Q1',
        newProductCount:  e.newCount,
        newProductTarget: e.newTarget,
        newProductScore:  e.newScore,
        avgGrossMargin:   e.margin,
        marginTarget:     e.marginTarget,
        marginScore:      e.marginScore,
        settlementRate:   e.settle,
        settlementTarget: e.settleTarget,
        settlementScore:  e.settleScore,
        totalScore:       e.total,
        baseCoefficient:  e.coef,
        prevQuarterScore: e.prev,
      },
    });
  }
  console.log(`✅ 四半期評価 ${evalData.length} 件（2026-Q1）`);

  console.log('🎉 シード完了');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
