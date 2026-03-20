'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'
import { serialize } from '@/lib/utils'
import { getActiveGroupId } from '@/lib/active-group'
import type { SubscriptionInput } from '@/lib/validations'

export async function getSubscriptions() {
  const userData = await getCurrentUser()
  if (!userData?.profile) return []

  const rawActiveGroupId = await getActiveGroupId()
  // ตรวจสอบว่า user เป็นสมาชิกของกลุ่มที่เลือกจริง
  const activeGroupId = rawActiveGroupId && userData.profile.groupMembers.some((m) => m.group.id === rawActiveGroupId)
    ? rawActiveGroupId
    : null

  const whereClause = activeGroupId
    ? { groupId: activeGroupId }
    : { profileId: userData.user.id, groupId: null }

  try {
    const subscriptions = await prisma.subscription.findMany({
      where: whereClause,
      include: { group: true },
      orderBy: [{ status: 'asc' }, { billingDay: 'asc' }],
    })
    return serialize(subscriptions)
  } catch {
    return []
  }
}

export async function createSubscription(data: SubscriptionInput & { groupId?: string | null }) {
  const userData = await getCurrentUser()
  if (!userData?.profile) throw new Error('ไม่พบข้อมูลผู้ใช้')

  if (data.groupId) {
    const isMember = userData.profile.groupMembers.some((m) => m.group.id === data.groupId)
    if (!isMember) throw new Error('คุณไม่ได้อยู่ในกลุ่มนี้')
  }

  const subscription = await prisma.subscription.create({
    data: {
      groupId: data.groupId ?? null,
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

  const validStatuses = ['active', 'paused', 'cancelled']
  if (!validStatuses.includes(status)) throw new Error('สถานะไม่ถูกต้อง')

  const groupIds = userData.profile.groupMembers.map((m) => m.group.id)

  await prisma.subscription.updateMany({
    where: {
      id,
      OR: [
        { profileId: userData.user.id },
        ...(groupIds.length > 0 ? [{ groupId: { in: groupIds } }] : []),
      ],
    },
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

  const groupIds = userData.profile.groupMembers.map((m) => m.group.id)

  const sub = await prisma.subscription.findFirst({
    where: {
      id,
      OR: [
        { profileId: userData.user.id },
        ...(groupIds.length > 0 ? [{ groupId: { in: groupIds } }] : []),
      ],
    },
  })
  if (!sub) throw new Error('ไม่พบข้อมูลการสมัครสมาชิก')

  await prisma.subscription.delete({ where: { id } })
  revalidatePath('/subscriptions')
}

export async function getSubscriptionSummary() {
  const userData = await getCurrentUser()
  if (!userData?.profile) return { monthlyTotal: 0, yearlyTotal: 0, count: 0 }

  const rawActiveGroupId = await getActiveGroupId()
  // ตรวจสอบว่า user เป็นสมาชิกของกลุ่มที่เลือกจริง
  const activeGroupId = rawActiveGroupId && userData.profile.groupMembers.some((m) => m.group.id === rawActiveGroupId)
    ? rawActiveGroupId
    : null

  const whereClause = activeGroupId
    ? { groupId: activeGroupId }
    : { profileId: userData.user.id, groupId: null }

  let subscriptions
  try {
    subscriptions = await prisma.subscription.findMany({
      where: {
        status: 'active',
        ...whereClause,
      },
    })
  } catch {
    return { monthlyTotal: 0, yearlyTotal: 0, count: 0 }
  }

  let monthlyTotal = 0
  for (const sub of subscriptions) {
    const amount = Number(sub.amount)
    monthlyTotal += sub.billingCycle === 'monthly' ? amount : amount / 12
  }

  return { monthlyTotal, yearlyTotal: monthlyTotal * 12, count: subscriptions.length }
}
