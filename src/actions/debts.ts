'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser, getUserFamilyGroup } from './auth'
import { revalidatePath } from 'next/cache'
import { serialize } from '@/lib/utils'

interface CreateDebtInput {
  creditorName: string
  debtorId: string
  totalAmount: number
  interestRate?: number
  minimumPayment?: number
  dueDate?: string
  notes?: string
}

export async function createDebt(input: CreateDebtInput) {
  const userData = await getCurrentUser()
  if (!userData?.profile) throw new Error('ไม่พบข้อมูลผู้ใช้')

  const group = await getUserFamilyGroup()
  if (!group) throw new Error('ไม่พบกลุ่มครอบครัว')

  const debt = await prisma.debt.create({
    data: {
      familyGroupId: group.id,
      createdBy: userData.user.id,
      creditorName: input.creditorName,
      debtorId: input.debtorId,
      totalAmount: input.totalAmount,
      remainingAmount: input.totalAmount,
      interestRate: input.interestRate ?? 0,
      minimumPayment: input.minimumPayment,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      notes: input.notes,
    },
  })

  revalidatePath('/debts')
  revalidatePath('/dashboard')
  return serialize(debt)
}

export async function getDebts(status?: string) {
  const group = await getUserFamilyGroup()
  if (!group) return []

  const result = await prisma.debt.findMany({
    where: {
      familyGroupId: group.id,
      ...(status && status !== 'all' ? { status } : {}),
    },
    include: {
      creator: true,
      debtor: true,
    },
    orderBy: { createdAt: 'desc' },
  })
  return serialize(result)
}

export async function payDebt(id: string, amount: number) {
  const debt = await prisma.debt.findUnique({ where: { id } })
  if (!debt) throw new Error('ไม่พบข้อมูลหนี้สิน')

  const newRemaining = Number(debt.remainingAmount) - amount
  const isPaidOff = newRemaining <= 0

  await prisma.debt.update({
    where: { id },
    data: {
      remainingAmount: isPaidOff ? 0 : newRemaining,
      status: isPaidOff ? 'paid_off' : 'active',
    },
  })

  revalidatePath('/debts')
  revalidatePath('/dashboard')
}

export async function deleteDebt(id: string) {
  await prisma.debt.delete({ where: { id } })
  revalidatePath('/debts')
  revalidatePath('/dashboard')
}
