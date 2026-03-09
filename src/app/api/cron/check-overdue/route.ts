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

  // อัปเดต pending → overdue ถ้าเลยกำหนด
  const overduePayments = await prisma.installmentPayment.updateMany({
    where: {
      status: 'pending',
      dueDate: { lt: now },
    },
    data: { status: 'overdue' },
  })

  // อัปเดต installments ที่มีงวดค้าง
  const overdueInstallmentIds = await prisma.installmentPayment.findMany({
    where: { status: 'overdue' },
    select: { installmentId: true },
    distinct: ['installmentId'],
  })

  if (overdueInstallmentIds.length > 0) {
    await prisma.installment.updateMany({
      where: {
        id: { in: overdueInstallmentIds.map((p) => p.installmentId) },
        status: 'active',
      },
      data: { status: 'overdue' },
    })
  }

  return NextResponse.json({
    success: true,
    overduePaymentsUpdated: overduePayments.count,
    overdueInstallmentsUpdated: overdueInstallmentIds.length,
  })
}
