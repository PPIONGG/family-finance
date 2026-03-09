'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser, getUserFamilyGroup } from './auth'
import { revalidatePath } from 'next/cache'
import { serialize } from '@/lib/utils'

interface CreateTransactionInput {
  type: 'income' | 'expense'
  amount: number
  description: string
  categoryId: string
  date: string
  isRecurring?: boolean
  recurringType?: string
}

export async function createTransaction(input: CreateTransactionInput) {
  const userData = await getCurrentUser()
  if (!userData?.profile) throw new Error('ไม่พบข้อมูลผู้ใช้')

  const group = await getUserFamilyGroup()
  if (!group) throw new Error('ไม่พบกลุ่มครอบครัว')

  const transaction = await prisma.transaction.create({
    data: {
      familyGroupId: group.id,
      createdBy: userData.user.id,
      type: input.type,
      amount: input.amount,
      description: input.description,
      categoryId: input.categoryId,
      date: new Date(input.date),
      isRecurring: input.isRecurring ?? false,
      recurringType: input.recurringType,
    },
  })

  revalidatePath('/transactions')
  revalidatePath('/dashboard')
  return serialize(transaction)
}

export async function getTransactions(filters?: {
  month?: number
  year?: number
  type?: string
  categoryId?: string
}) {
  const group = await getUserFamilyGroup()
  if (!group) return []

  const where: Record<string, unknown> = { familyGroupId: group.id }

  if (filters?.type && filters.type !== 'all') {
    where.type = filters.type
  }

  if (filters?.categoryId && filters.categoryId !== 'all') {
    where.categoryId = filters.categoryId
  }

  if (filters?.month && filters?.year) {
    const startDate = new Date(filters.year, filters.month - 1, 1)
    const endDate = new Date(filters.year, filters.month, 0)
    where.date = { gte: startDate, lte: endDate }
  }

  const result = await prisma.transaction.findMany({
    where,
    include: {
      category: true,
      creator: true,
    },
    orderBy: { date: 'desc' },
  })
  return serialize(result)
}

export async function deleteTransaction(id: string) {
  await prisma.transaction.delete({ where: { id } })
  revalidatePath('/transactions')
  revalidatePath('/dashboard')
}

export async function getCategories() {
  const group = await getUserFamilyGroup()
  if (!group) return []

  return prisma.category.findMany({
    where: { familyGroupId: group.id },
    orderBy: { name: 'asc' },
  })
}
