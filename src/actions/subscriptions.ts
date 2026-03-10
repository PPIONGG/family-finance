'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'
import { serialize } from '@/lib/utils'
import type { SubscriptionInput } from '@/lib/validations'

export async function getSubscriptions() {
  const userData = await getCurrentUser()
  if (!userData?.profile) return []

  try {
    const subscriptions = await prisma.subscription.findMany({
      where: { profileId: userData.user.id },
      orderBy: [{ status: 'asc' }, { billingDay: 'asc' }],
    })
    return serialize(subscriptions)
  } catch {
    return []
  }
}

export async function createSubscription(data: SubscriptionInput) {
  const userData = await getCurrentUser()
  if (!userData?.profile) throw new Error('ไม่พบข้อมูลผู้ใช้')

  const subscription = await prisma.subscription.create({
    data: {
      profileId: userData.user.id,
      name: data.name,
      category: data.category,
      amount: data.amount,
      billingCycle: data.billingCycle,
      billingDay: data.billingDay,
      startDate: new Date(data.startDate),
      autoRenew: data.autoRenew ?? true,
      notes: data.notes || null,
    },
  })

  revalidatePath('/subscriptions')
  return serialize(subscription)
}

export async function updateSubscriptionStatus(id: string, status: string) {
  const userData = await getCurrentUser()
  if (!userData?.profile) throw new Error('ไม่พบข้อมูลผู้ใช้')

  await prisma.subscription.update({
    where: { id, profileId: userData.user.id },
    data: {
      status,
      ...(status === 'cancelled' ? { endDate: new Date() } : {}),
    },
  })

  revalidatePath('/subscriptions')
}

export async function deleteSubscription(id: string) {
  const userData = await getCurrentUser()
  if (!userData?.profile) throw new Error('ไม่พบข้อมูลผู้ใช้')

  await prisma.subscription.delete({
    where: { id, profileId: userData.user.id },
  })

  revalidatePath('/subscriptions')
}

export async function getSubscriptionSummary() {
  const userData = await getCurrentUser()
  if (!userData?.profile) return { monthlyTotal: 0, yearlyTotal: 0, count: 0 }

  let subscriptions
  try {
    subscriptions = await prisma.subscription.findMany({
      where: { profileId: userData.user.id, status: 'active' },
    })
  } catch {
    return { monthlyTotal: 0, yearlyTotal: 0, count: 0 }
  }

  let monthlyTotal = 0
  for (const sub of subscriptions) {
    const amount = Number(sub.amount)
    if (sub.billingCycle === 'monthly') {
      monthlyTotal += amount
    } else {
      monthlyTotal += amount / 12
    }
  }

  const yearlyTotal = monthlyTotal * 12

  return { monthlyTotal, yearlyTotal, count: subscriptions.length }
}
