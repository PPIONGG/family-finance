'use server'

import { prisma } from '@/lib/prisma'
import { getUserFamilyGroup } from './auth'

export async function getDashboardData() {
  const group = await getUserFamilyGroup()
  if (!group) return null

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  // Query ทั้งหมดพร้อมกัน
  const [transactions, upcomingPayments, overduePayments, debts, monthlyTransactions, expenseByCategory, categories] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        familyGroupId: group.id,
        date: { gte: startOfMonth, lte: endOfMonth },
      },
    }),
    prisma.installmentPayment.findMany({
      where: {
        installment: { familyGroupId: group.id },
        dueDate: { gte: startOfMonth, lte: endOfMonth },
        status: { in: ['pending', 'upcoming'] },
      },
      include: { installment: true },
      orderBy: { dueDate: 'asc' },
    }),
    prisma.installmentPayment.findMany({
      where: {
        installment: { familyGroupId: group.id },
        status: 'overdue',
      },
      include: { installment: true },
      orderBy: { dueDate: 'asc' },
    }),
    prisma.debt.findMany({
      where: {
        familyGroupId: group.id,
        status: 'active',
      },
    }),
    prisma.transaction.findMany({
      where: {
        familyGroupId: group.id,
        date: { gte: sixMonthsAgo },
      },
      orderBy: { date: 'asc' },
    }),
    prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        familyGroupId: group.id,
        type: 'expense',
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
    }),
    prisma.category.findMany({
      where: { familyGroupId: group.id },
    }),
  ])

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const totalInstallmentDue = upcomingPayments.reduce(
    (sum, p) => sum + Number(p.amountDue),
    0
  )

  const totalDebtRemaining = debts.reduce(
    (sum, d) => sum + Number(d.remainingAmount),
    0
  )

  const monthlyData: Record<string, { income: number; expense: number }> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthlyData[key] = { income: 0, expense: 0 }
  }

  monthlyTransactions.forEach((t) => {
    const d = new Date(t.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (monthlyData[key]) {
      if (t.type === 'income') {
        monthlyData[key].income += Number(t.amount)
      } else {
        monthlyData[key].expense += Number(t.amount)
      }
    }
  })

  const chartData = Object.entries(monthlyData).map(([month, data]) => ({
    month,
    income: data.income,
    expense: data.expense,
  }))

  const categoryData = expenseByCategory.map((e) => {
    const cat = categories.find((c) => c.id === e.categoryId)
    return {
      name: cat?.name ?? 'อื่นๆ',
      value: Number(e._sum.amount ?? 0),
      color: cat?.color ?? '#64748b',
      icon: cat?.icon ?? '📦',
    }
  }).sort((a, b) => b.value - a.value)

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    totalInstallmentDue,
    totalDebtRemaining,
    upcomingPayments: upcomingPayments.map((p) => ({
      id: p.id,
      installmentName: p.installment.name,
      platform: p.installment.platform,
      amountDue: Number(p.amountDue),
      dueDate: p.dueDate,
      installmentNumber: p.installmentNumber,
    })),
    overduePayments: overduePayments.map((p) => ({
      id: p.id,
      installmentName: p.installment.name,
      platform: p.installment.platform,
      amountDue: Number(p.amountDue),
      dueDate: p.dueDate,
      daysOverdue: Math.floor(
        (now.getTime() - new Date(p.dueDate).getTime()) / (1000 * 60 * 60 * 24)
      ),
    })),
    chartData,
    categoryData,
  }
}
