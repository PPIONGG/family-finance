'use server'

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { generateInviteCode } from '@/lib/utils'
import { DEFAULT_CATEGORIES } from '@/constants/categories'

export const getCurrentUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    include: {
      familyMembers: {
        include: {
          familyGroup: true,
        },
      },
    },
  })

  return { user, profile }
})

export async function getUserFamilyGroup() {
  const userData = await getCurrentUser()
  if (!userData?.profile) return null

  const member = userData.profile.familyMembers[0]
  if (!member) return null

  return member.familyGroup
}

export async function createFamilyGroup(name: string) {
  const userData = await getCurrentUser()
  if (!userData?.profile) throw new Error('ไม่พบข้อมูลผู้ใช้')

  const group = await prisma.familyGroup.create({
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
      familyGroupId: group.id,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      isDefault: true,
    })),
  })

  // อัปเดต role เป็น admin
  await prisma.profile.update({
    where: { id: userData.user.id },
    data: { role: 'admin' },
  })

  return group
}

export async function joinFamilyGroup(inviteCode: string) {
  const userData = await getCurrentUser()
  if (!userData?.profile) throw new Error('ไม่พบข้อมูลผู้ใช้')

  const group = await prisma.familyGroup.findUnique({
    where: { inviteCode },
  })

  if (!group) throw new Error('ไม่พบกลุ่มครอบครัว กรุณาตรวจสอบรหัสเชิญ')

  const existing = await prisma.familyMember.findUnique({
    where: {
      familyGroupId_profileId: {
        familyGroupId: group.id,
        profileId: userData.user.id,
      },
    },
  })

  if (existing) throw new Error('คุณเป็นสมาชิกกลุ่มนี้แล้ว')

  await prisma.familyMember.create({
    data: {
      familyGroupId: group.id,
      profileId: userData.user.id,
      nickname: userData.profile.displayName,
    },
  })

  return group
}
