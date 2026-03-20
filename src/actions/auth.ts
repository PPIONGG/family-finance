'use server'

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { generateInviteCode } from '@/lib/utils'
import { DEFAULT_CATEGORIES } from '@/constants/categories'
import { getActiveGroupId, setActiveGroupId } from '@/lib/active-group'
import { revalidatePath } from 'next/cache'

export const getCurrentUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    include: {
      groupMembers: {
        include: {
          group: true,
        },
        orderBy: { joinedAt: 'asc' },
      },
    },
  })

  return { user, profile }
})

// คืนกลุ่มทั้งหมดที่ user อยู่
export async function getUserGroups() {
  const userData = await getCurrentUser()
  if (!userData?.profile) return []
  return userData.profile.groupMembers.map((m) => m.group)
}

// คืน active group จาก cookie (null = personal mode)
export async function getActiveGroup() {
  const userData = await getCurrentUser()
  if (!userData?.profile) return null

  const groups = userData.profile.groupMembers.map((m) => m.group)
  if (groups.length === 0) return null

  const activeId = await getActiveGroupId()
  if (!activeId) return null

  return groups.find((g) => g.id === activeId) ?? null
}

// server action สำหรับ switch group (null = personal)
export async function switchGroup(groupId: string | null) {
  const userData = await getCurrentUser()
  if (!userData?.profile) throw new Error('ไม่พบข้อมูลผู้ใช้')

  if (groupId !== null) {
    const isMember = userData.profile.groupMembers.some((m) => m.group.id === groupId)
    if (!isMember) throw new Error('คุณไม่ได้อยู่ในกลุ่มนี้')
  }

  await setActiveGroupId(groupId)
  revalidatePath('/', 'layout')
}

// backward-compat — ใช้ getActiveGroup แทนได้
export async function getUserGroup() {
  return getActiveGroup()
}

export async function createGroup(name: string) {
  const userData = await getCurrentUser()
  if (!userData?.profile) throw new Error('ไม่พบข้อมูลผู้ใช้')

  const group = await prisma.group.create({
    data: {
      name,
      inviteCode: generateInviteCode(),
      createdBy: userData.user.id,
      members: {
        create: {
          profileId: userData.user.id,
          nickname: userData.profile.displayName,
        },
      },
    },
  })

  // สร้าง default categories
  await prisma.category.createMany({
    data: DEFAULT_CATEGORIES.map((cat) => ({
      groupId: group.id,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      isDefault: true,
    })),
  })

  revalidatePath('/', 'layout')
  return group
}

export async function joinGroup(inviteCode: string) {
  const userData = await getCurrentUser()
  if (!userData?.profile) throw new Error('ไม่พบข้อมูลผู้ใช้')

  const group = await prisma.group.findUnique({
    where: { inviteCode },
  })

  if (!group) throw new Error('ไม่พบกลุ่ม กรุณาตรวจสอบรหัสเชิญ')

  const existing = await prisma.groupMember.findUnique({
    where: {
      groupId_profileId: {
        groupId: group.id,
        profileId: userData.user.id,
      },
    },
  })

  if (existing) throw new Error('คุณเป็นสมาชิกกลุ่มนี้แล้ว')

  await prisma.groupMember.create({
    data: {
      groupId: group.id,
      profileId: userData.user.id,
      nickname: userData.profile.displayName,
    },
  })

  revalidatePath('/', 'layout')
  return group
}
