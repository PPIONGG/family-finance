'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'
import { serialize } from '@/lib/utils'
import { getActiveGroupId } from '@/lib/active-group'

interface CreateDebtInput {
  groupId?: string | null
  creditorName: string
  totalAmount: number
  interestRate?: number
  minimumPayment?: number
  dueDate?: string
  notes?: string
}

export async function createDebt(input: CreateDebtInput) {
  const userData = await getCurrentUser()
  if (!userData?.profile) throw new Error('ไม่พบข้อมูลผู้ใช้')

  // ถ้ามี groupId ต้องเป็นสมาชิกกลุ่มนั้น
  if (input.groupId) {
    const isMember = userData.profile.groupMembers.some((m) => m.group.id === input.groupId)
    if (!isMember) throw new Error('คุณไม่ได้อยู่ในกลุ่มนี้')
  }

  const debt = await prisma.debt.create({
    data: {
      groupId: input.groupId ?? null,
      createdBy: userData.user.id,
      creditorName: input.creditorName,
      totalAmount: input.totalAmount,
      remainingAmount: input.totalAmount,
      interestRate: input.interestRate ?? 0,
      minimumPayment: input.minimumPayment,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      notes: input.notes,
    },
  })

  revalidatePath('/debts')
  return serialize(debt)
}

export async function getDebts(status?: string) {
  const userData = await getCurrentUser()
  if (!userData?.profile) return []

  const rawActiveGroupId = await getActiveGroupId()
  // ตรวจสอบว่า user เป็นสมาชิกของกลุ่มที่เลือกจริง
  const activeGroupId = rawActiveGroupId && userData.profile.groupMembers.some((m) => m.group.id === rawActiveGroupId)
    ? rawActiveGroupId
    : null
  const statusFilter = status && status !== 'all' ? { status } : {}

  const whereClause = activeGroupId
    ? { groupId: activeGroupId, ...statusFilter }
    : { createdBy: userData.user.id, groupId: null, ...statusFilter }

  const result = await prisma.debt.findMany({
    where: whereClause,
    include: {
      creator: true,
      group: true,
    },
    orderBy: { createdAt: 'desc' },
  })
  return serialize(result)
}

export async function payDebt(id: string, amount: number) {
  const userData = await getCurrentUser()
  if (!userData?.profile) throw new Error('ไม่พบข้อมูลผู้ใช้')

  const groupIds = userData.profile.groupMembers.map((m) => m.group.id)

  if (amount <= 0) throw new Error('จำนวนเงินต้องมากกว่า 0')

  const debt = await prisma.debt.findFirst({
    where: {
      id,
      OR: [
        { createdBy: userData.user.id },
        ...(groupIds.length > 0 ? [{ groupId: { in: groupIds } }] : []),
      ],
    },
  })
  if (!debt) throw new Error('ไม่พบข้อมูลหนี้สิน')

  if (debt.status !== 'active') throw new Error('หนี้สินนี้ไม่สามารถชำระได้')

  const remaining = Number(debt.remainingAmount)
  if (amount > remaining) throw new Error('จำนวนเงินเกินยอดคงเหลือ')

  const newRemaining = remaining - amount
  const isPaidOff = newRemaining <= 0

  await prisma.debt.update({
    where: { id },
    data: {
      remainingAmount: isPaidOff ? 0 : newRemaining,
      status: isPaidOff ? 'paid_off' : 'active',
    },
  })

  revalidatePath('/debts')
}

export async function deleteDebt(id: string) {
  const userData = await getCurrentUser()
  if (!userData?.profile) throw new Error('ไม่พบข้อมูลผู้ใช้')

  const groupIds = userData.profile.groupMembers.map((m) => m.group.id)

  const debt = await prisma.debt.findFirst({
    where: {
      id,
      OR: [
        { createdBy: userData.user.id },
        ...(groupIds.length > 0 ? [{ groupId: { in: groupIds } }] : []),
      ],
    },
  })
  if (!debt) throw new Error('ไม่พบข้อมูลหนี้สิน')

  await prisma.debt.delete({ where: { id } })
  revalidatePath('/debts')
}
