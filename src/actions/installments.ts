'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser, getUserFamilyGroup } from './auth'
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
  splits?: {
    profileId: string
    splitType: 'equal' | 'percentage' | 'fixed'
    splitValue?: number
  }[]
}

export async function createInstallment(input: CreateInstallmentInput) {
  const userData = await getCurrentUser()
  if (!userData?.profile) throw new Error('ไม่พบข้อมูลผู้ใช้')

  const group = await getUserFamilyGroup()
  if (!group) throw new Error('ไม่พบกลุ่มครอบครัว')

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

  const installment = await prisma.installment.create({
    data: {
      familyGroupId: group.id,
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
  // ถ้า Shopee กรอกวันชำระงวดแรก → ใช้ dueDay จากวันนั้น + startDate เป็นวันก่อนงวดแรก
  const effectiveStartDate = input.shopeeFirstPayDate
    ? new Date(input.shopeeFirstPayDate)
    : new Date(input.startDate)
  const effectiveDueDay = input.shopeeFirstPayDate
    ? new Date(input.shopeeFirstPayDate).getDate()
    : input.dueDay

  let schedule
  if (isShopeeManual) {
    // Shopee: ใช้ค่าที่ user กรอก, งวดสุดท้ายปรับให้ตรง
    const lastPayment = Math.round((input.shopeeTotalPayment! - input.monthlyPayment! * (input.totalInstallments - 1)) * 100) / 100
    schedule = generatePaymentScheduleFromFirstDate(
      installment.id,
      input.totalInstallments,
      input.monthlyPayment!,
      effectiveStartDate,
      effectiveDueDay,
    )
    // แก้งวดสุดท้ายให้ตรง
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

  await prisma.installmentPayment.createMany({
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
          amountPerMonth = calc.monthlyPayment / input.splits!.length
          break
        case 'percentage':
          amountPerMonth = calc.monthlyPayment * ((s.splitValue ?? 0) / 100)
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

    await prisma.installmentSplit.createMany({ data: splitData })
  }

  revalidatePath('/installments')
  revalidatePath('/dashboard')
  return serialize(installment)
}

export async function getInstallments(status?: string) {
  const group = await getUserFamilyGroup()
  if (!group) return []

  const result = await prisma.installment.findMany({
    where: {
      familyGroupId: group.id,
      ...(status && status !== 'all' ? { status } : {}),
    },
    include: {
      creator: true,
      splits: { include: { profile: true } },
      payments: { orderBy: { installmentNumber: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return serialize(result)
}

export async function getInstallmentById(id: string) {
  const group = await getUserFamilyGroup()
  if (!group) return null

  const result = await prisma.installment.findFirst({
    where: { id, familyGroupId: group.id },
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

  const newPaidCount = payment.installment.paidInstallments + 1
  const isCompleted = newPaidCount >= payment.installment.totalInstallments

  // รวมทุก update ใน transaction เดียว
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: any[] = [
    prisma.installmentPayment.update({
      where: { id: paymentId },
      data: {
        status: 'paid',
        amountPaid: payment.amountDue,
        paidDate: new Date(),
        paidBy: userData.user.id,
      },
    }),
    prisma.installment.update({
      where: { id: payment.installmentId },
      data: {
        paidInstallments: newPaidCount,
        status: isCompleted ? 'completed' : 'active',
      },
    }),
  ]

  if (!isCompleted) {
    updates.push(
      prisma.installmentPayment.updateMany({
        where: {
          installmentId: payment.installmentId,
          installmentNumber: payment.installmentNumber + 1,
        },
        data: { status: 'pending' },
      })
    )
  }

  await prisma.$transaction(updates)

  revalidatePath('/installments')
  revalidatePath('/dashboard')
}

export async function updateInstallmentSplits(
  installmentId: string,
  splits: {
    profileId: string
    splitType: 'equal' | 'percentage' | 'fixed'
    splitValue?: number
  }[]
) {
  const group = await getUserFamilyGroup()
  if (!group) throw new Error('ไม่พบกลุ่มครอบครัว')

  const installment = await prisma.installment.findFirst({
    where: { id: installmentId, familyGroupId: group.id },
  })
  if (!installment) throw new Error('ไม่พบรายการผ่อน')

  const monthlyPayment = Number(installment.monthlyPayment)

  // ลบ splits เก่าแล้วสร้างใหม่
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

export async function deleteInstallment(id: string) {
  const group = await getUserFamilyGroup()
  if (!group) throw new Error('ไม่พบกลุ่มครอบครัว')

  await prisma.installment.delete({
    where: { id },
  })

  revalidatePath('/installments')
  revalidatePath('/dashboard')
}
