import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  // ตรวจสอบ authorization (Vercel Cron)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const now = new Date()

  // 1. อัปเดต pending/upcoming ที่เลยกำหนด → overdue
  const overduePayments = await prisma.installmentPayment.updateMany({
    where: {
      status: { in: ['pending', 'upcoming'] },
      dueDate: { lt: now },
    },
    data: { status: 'overdue' },
  })

  // 2. หา installment ที่ยังไม่จบ แล้วเลื่อนงวดถัดไปเป็น pending
  const activeInstallments = await prisma.installment.findMany({
    where: { status: { not: 'completed' } },
    select: { id: true },
  })

  let promotedCount = 0
  for (const inst of activeInstallments) {
    // หางวดถัดไปที่ยังเป็น upcoming
    const nextUpcoming = await prisma.installmentPayment.findFirst({
      where: {
        installmentId: inst.id,
        status: 'upcoming',
        dueDate: { gte: now },
      },
      orderBy: { installmentNumber: 'asc' },
    })

    if (nextUpcoming) {
      await prisma.installmentPayment.update({
        where: { id: nextUpcoming.id },
        data: { status: 'pending' },
      })
      promotedCount++
    }
  }

  // 3. อัปเดต installments ที่มีงวดค้าง
  const overdueInstallmentIds = await prisma.installmentPayment.findMany({
    where: { status: 'overdue' },
    select: { installmentId: true },
    distinct: ['installmentId'],
  })

  let overdueInstallmentsUpdated = 0
  if (overdueInstallmentIds.length > 0) {
    const result = await prisma.installment.updateMany({
      where: {
        id: { in: overdueInstallmentIds.map((p) => p.installmentId) },
        status: 'active',
      },
      data: { status: 'overdue' },
    })
    overdueInstallmentsUpdated = result.count
  }

  return NextResponse.json({
    success: true,
    overduePaymentsUpdated: overduePayments.count,
    pendingPromoted: promotedCount,
    overdueInstallmentsUpdated,
  })
}
