'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from './auth'
import { getActiveGroupId } from '@/lib/active-group'
import { calculateInstallment, generatePaymentSchedule, generatePaymentScheduleFromFirstDate, generateDailyPaymentSchedule } from '@/lib/calculations'
import { revalidatePath } from 'next/cache'
import type { InterestType } from '@/types'
import { serialize } from '@/lib/utils'

interface CreateInstallmentInput {
  name: string
  platform: string
  principalAmount: number
  totalInstallments: number
  interestRate: number
  interestType: InterestType
  monthlyPayment?: number
  shopeeTotalPayment?: number
  shopeeTotalInterest?: number
  shopeeFirstPayDate?: string
  startDate: string
  dueDay: number
  notes?: string
  groupId?: string | null
  splits?: {
    profileId: string
    splitType: 'equal' | 'percentage' | 'fixed'
    splitValue?: number
  }[]
}

export async function createInstallment(input: CreateInstallmentInput) {
  const userData = await getCurrentUser()
  if (!userData?.profile) throw new Error('ไม่พบข้อมูลผู้ใช้')

  // ใช้ groupId จาก input → ถ้าไม่มีให้ดึงจาก active group cookie
  const resolvedGroupId = input.groupId !== undefined
    ? input.groupId
    : await getActiveGroupId()

  // ถ้ามี groupId ต้องเป็นสมาชิกกลุ่มนั้น
  if (resolvedGroupId) {
    const isMember = userData.profile.groupMembers.some((m) => m.group.id === resolvedGroupId)
    if (!isMember) throw new Error('คุณไม่ได้อยู่ในกลุ่มนี้')
  }

  // ถ้ามีค่าจาก Shopee ให้ใช้ค่าตรงนั้นเลย ไม่ต้องคำนวณ
  const isShopeeManual = input.shopeeTotalPayment && input.shopeeTotalInterest && input.monthlyPayment

  const calc = calculateInstallment(
    input.principalAmount,
    input.interestRate,
    input.totalInstallments,
    input.interestType,
    new Date(input.startDate),
    input.dueDay,
    input.monthlyPayment,
  )

  const finalTotalAmount = isShopeeManual ? input.shopeeTotalPayment! : calc.totalAmount
  const finalTotalInterest = isShopeeManual ? input.shopeeTotalInterest! : calc.totalInterest
  const finalMonthlyPayment = isShopeeManual ? input.monthlyPayment! : calc.monthlyPayment

  const result = await prisma.$transaction(async (tx) => {
    const installment = await tx.installment.create({
      data: {
        groupId: resolvedGroupId ?? null,
        createdBy: userData.user.id,
        name: input.name,
        platform: input.platform,
        totalAmount: finalTotalAmount,
        principalAmount: input.principalAmount,
        interestRate: input.interestRate,
        interestType: input.interestType,
        totalInterest: finalTotalInterest,
        monthlyPayment: finalMonthlyPayment,
        totalInstallments: input.totalInstallments,
        startDate: new Date(input.startDate),
        dueDay: input.shopeeFirstPayDate ? new Date(input.shopeeFirstPayDate).getDate() : input.dueDay,
        notes: input.notes,
      },
    })

    // สร้าง payment schedule
    const effectiveStartDate = input.shopeeFirstPayDate
      ? new Date(input.shopeeFirstPayDate)
      : new Date(input.startDate)
    const effectiveDueDay = input.shopeeFirstPayDate
      ? new Date(input.shopeeFirstPayDate).getDate()
      : input.dueDay

    let schedule
    if (isShopeeManual) {
      const lastPayment = Math.round((input.shopeeTotalPayment! - input.monthlyPayment! * (input.totalInstallments - 1)) * 100) / 100
      schedule = generatePaymentScheduleFromFirstDate(
        installment.id,
        input.totalInstallments,
        input.monthlyPayment!,
        effectiveStartDate,
        effectiveDueDay,
      )
      schedule[schedule.length - 1].amount_due = lastPayment
    } else {
      const hasSchedule = 'schedule' in calc && calc.schedule
      schedule = hasSchedule
        ? generateDailyPaymentSchedule(installment.id, calc.schedule as { installmentNumber: number; dueDate: Date; totalPayment: number }[])
        : generatePaymentSchedule(
            installment.id,
            input.totalInstallments,
            calc.monthlyPayment,
            new Date(input.startDate),
            input.dueDay
          )
    }

    await tx.installmentPayment.createMany({
      data: schedule.map((p) => ({
        installmentId: p.installment_id,
        installmentNumber: p.installment_number,
        amountDue: p.amount_due,
        amountPaid: p.amount_paid,
        dueDate: p.due_date,
        status: p.status,
      })),
    })

    // สร้าง splits ถ้ามี
    if (input.splits && input.splits.length > 0) {
      const splitData = input.splits.map((s) => {
        let amountPerMonth: number
        switch (s.splitType) {
          case 'equal':
            amountPerMonth = finalMonthlyPayment / input.splits!.length
            break
          case 'percentage':
            amountPerMonth = finalMonthlyPayment * ((s.splitValue ?? 0) / 100)
            break
          case 'fixed':
            amountPerMonth = s.splitValue ?? 0
            break
        }
        return {
          installmentId: installment.id,
          profileId: s.profileId,
          splitType: s.splitType,
          splitValue: s.splitValue ?? null,
          amountPerMonth: Math.round(amountPerMonth * 100) / 100,
        }
      })

      await tx.installmentSplit.createMany({ data: splitData })
    }

    return installment
  })

  revalidatePath('/installments')
  return serialize(result)
}

/**
 * Sync สถานะ payment ทั้งหมดของ installment ให้ตรงกับวันที่ปัจจุบัน
 */
async function syncPaymentStatuses(installmentId: string) {
  const now = new Date()

  await prisma.installmentPayment.updateMany({
    where: {
      installmentId,
      status: { in: ['pending', 'upcoming'] },
      dueDate: { lt: now },
    },
    data: { status: 'overdue' },
  })

  const nextUpcoming = await prisma.installmentPayment.findFirst({
    where: {
      installmentId,
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
  }

  const hasOverdue = await prisma.installmentPayment.count({
    where: { installmentId, status: 'overdue' },
  })

  const paidCount = await prisma.installmentPayment.count({
    where: { installmentId, status: 'paid' },
  })

  const installment = await prisma.installment.findUnique({
    where: { id: installmentId },
  })

  if (installment && installment.status !== 'completed') {
    const isCompleted = paidCount >= installment.totalInstallments
    let newStatus: string
    if (isCompleted) {
      newStatus = 'completed'
    } else if (hasOverdue > 0) {
      newStatus = 'overdue'
    } else {
      newStatus = 'active'
    }

    if (installment.status !== newStatus) {
      await prisma.installment.update({
        where: { id: installmentId },
        data: {
          status: newStatus,
          paidInstallments: paidCount,
        },
      })
    }
  }
}

/** Sync สถานะทุก installment ของ user */
async function syncAllPaymentStatuses(userId: string) {
  try {
    const installments = await prisma.installment.findMany({
      where: { createdBy: userId, status: { not: 'completed' } },
      select: { id: true },
    })

    await Promise.all(installments.map((inst) => syncPaymentStatuses(inst.id)))
  } catch (e) {
    console.error('Failed to sync payment statuses:', e)
  }
}

export async function getInstallments(status?: string) {
  const userData = await getCurrentUser()
  if (!userData?.profile) return []

  await syncAllPaymentStatuses(userData.user.id)

  const rawActiveGroupId = await getActiveGroupId()
  // ตรวจสอบว่า user เป็นสมาชิกของกลุ่มที่เลือกจริง
  const activeGroupId = rawActiveGroupId && userData.profile.groupMembers.some((m) => m.group.id === rawActiveGroupId)
    ? rawActiveGroupId
    : null
  const statusFilter = status && status !== 'all' ? { status } : {}

  const whereClause = activeGroupId
    ? { groupId: activeGroupId, ...statusFilter }
    : { createdBy: userData.user.id, groupId: null, ...statusFilter }

  const result = await prisma.installment.findMany({
    where: whereClause,
    include: {
      creator: true,
      group: true,
      splits: { include: { profile: true } },
      payments: { orderBy: { installmentNumber: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return serialize(result)
}

export async function getInstallmentById(id: string) {
  const userData = await getCurrentUser()
  if (!userData?.profile) return null

  try { await syncPaymentStatuses(id) } catch (e) { console.error('Failed to sync:', e) }

  const groupIds = userData.profile.groupMembers.map((m) => m.groupId)

  const result = await prisma.installment.findFirst({
    where: {
      id,
      OR: [
        { createdBy: userData.user.id },
        ...(groupIds.length > 0 ? [{ groupId: { in: groupIds } }] : []),
      ],
    },
    include: {
      creator: true,
      splits: { include: { profile: true } },
      payments: {
        orderBy: { installmentNumber: 'asc' },
        include: { payer: true },
      },
    },
  })
  return serialize(result)
}

export async function payInstallment(paymentId: string) {
  const userData = await getCurrentUser()
  if (!userData?.profile) throw new Error('ไม่พบข้อมูลผู้ใช้')

  const payment = await prisma.installmentPayment.findUnique({
    where: { id: paymentId },
    include: { installment: true },
  })

  if (!payment) throw new Error('ไม่พบข้อมูลงวด')

  // ตรวจสอบว่า user เป็นผู้สร้างหรือเป็นสมาชิกกลุ่มของรายการผ่อน
  const isCreator = payment.installment.createdBy === userData.user.id
  const isGroupMember = payment.installment.groupId
    ? userData.profile.groupMembers.some((m) => m.group.id === payment.installment.groupId)
    : false
  if (!isCreator && !isGroupMember) throw new Error('คุณไม่มีสิทธิ์จ่ายงวดนี้')

  if (payment.status !== 'pending' && payment.status !== 'overdue') {
    throw new Error('งวดนี้ไม่สามารถจ่ายได้')
  }

  await prisma.installmentPayment.update({
    where: { id: paymentId },
    data: {
      status: 'paid',
      amountPaid: payment.amountDue,
      paidDate: new Date(),
      paidBy: userData.user.id,
    },
  })

  await syncPaymentStatuses(payment.installmentId)

  revalidatePath('/installments')
}

export async function payMultipleInstallments(paymentIds: string[]) {
  const userData = await getCurrentUser()
  if (!userData?.profile) throw new Error('ไม่พบข้อมูลผู้ใช้')
  if (paymentIds.length === 0) throw new Error('กรุณาเลือกงวดที่ต้องการจ่าย')

  const payments = await prisma.installmentPayment.findMany({
    where: { id: { in: paymentIds } },
    include: { installment: true },
    orderBy: { installmentNumber: 'asc' },
  })

  if (payments.length === 0) throw new Error('ไม่พบข้อมูลงวด')

  // ตรวจสอบว่า user เป็นผู้สร้างหรือเป็นสมาชิกกลุ่มของทุกรายการ
  for (const p of payments) {
    const isCreator = p.installment.createdBy === userData.user.id
    const isGroupMember = p.installment.groupId
      ? userData.profile.groupMembers.some((m) => m.group.id === p.installment.groupId)
      : false
    if (!isCreator && !isGroupMember) throw new Error('คุณไม่มีสิทธิ์จ่ายงวดนี้')
  }

  const invalidPayment = payments.find((p) => p.status !== 'pending' && p.status !== 'overdue' && p.status !== 'upcoming')
  if (invalidPayment) {
    throw new Error(`งวดที่ ${invalidPayment.installmentNumber} ไม่สามารถจ่ายได้`)
  }

  await prisma.$transaction(
    payments.map((p) =>
      prisma.installmentPayment.update({
        where: { id: p.id },
        data: {
          status: 'paid',
          amountPaid: p.amountDue,
          paidDate: new Date(),
          paidBy: userData.user.id,
        },
      })
    )
  )

  const installmentIds = [...new Set(payments.map((p) => p.installmentId))]
  await Promise.all(installmentIds.map((id) => syncPaymentStatuses(id)))

  revalidatePath('/installments')
}

export async function updateInstallmentSplits(
  installmentId: string,
  splits: {
    profileId: string
    splitType: 'equal' | 'percentage' | 'fixed'
    splitValue?: number
  }[]
) {
  const userData = await getCurrentUser()
  if (!userData?.profile) throw new Error('ไม่พบข้อมูลผู้ใช้')

  const groupIds = userData.profile.groupMembers.map((m) => m.groupId)

  const installment = await prisma.installment.findFirst({
    where: {
      id: installmentId,
      OR: [
        { createdBy: userData.user.id },
        ...(groupIds.length > 0 ? [{ groupId: { in: groupIds } }] : []),
      ],
    },
  })
  if (!installment) throw new Error('ไม่พบรายการผ่อน')

  const monthlyPayment = Number(installment.monthlyPayment)

  await prisma.installmentSplit.deleteMany({
    where: { installmentId },
  })

  if (splits.length > 0) {
    const splitData = splits.map((s) => {
      let amountPerMonth: number
      switch (s.splitType) {
        case 'equal':
          amountPerMonth = monthlyPayment / splits.length
          break
        case 'percentage':
          amountPerMonth = monthlyPayment * ((s.splitValue ?? 0) / 100)
          break
        case 'fixed':
          amountPerMonth = s.splitValue ?? 0
          break
      }
      return {
        installmentId,
        profileId: s.profileId,
        splitType: s.splitType,
        splitValue: s.splitValue ?? null,
        amountPerMonth: Math.round(amountPerMonth * 100) / 100,
      }
    })

    await prisma.installmentSplit.createMany({ data: splitData })
  }

  revalidatePath(`/installments/${installmentId}`)
  revalidatePath('/installments')
}

export async function updateInstallment(
  id: string,
  data: { name?: string; platform?: string; notes?: string; dueDay?: number }
) {
  const userData = await getCurrentUser()
  if (!userData?.profile) throw new Error('ไม่พบข้อมูลผู้ใช้')

  const groupIds = userData.profile.groupMembers.map((m) => m.groupId)

  const installment = await prisma.installment.findFirst({
    where: {
      id,
      OR: [
        { createdBy: userData.user.id },
        ...(groupIds.length > 0 ? [{ groupId: { in: groupIds } }] : []),
      ],
    },
  })
  if (!installment) throw new Error('ไม่พบรายการผ่อน')

  await prisma.installment.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.platform !== undefined && { platform: data.platform }),
      ...(data.notes !== undefined && { notes: data.notes || null }),
      ...(data.dueDay !== undefined && { dueDay: data.dueDay }),
    },
  })

  revalidatePath(`/installments/${id}`)
  revalidatePath('/installments')
}

export async function deleteInstallment(id: string) {
  const userData = await getCurrentUser()
  if (!userData?.profile) throw new Error('ไม่พบข้อมูลผู้ใช้')

  const groupIds = userData.profile.groupMembers.map((m) => m.groupId)

  await prisma.installment.delete({
    where: {
      id,
      OR: [
        { createdBy: userData.user.id },
        ...(groupIds.length > 0 ? [{ groupId: { in: groupIds } }] : []),
      ],
    },
  })

  revalidatePath('/installments')
}
