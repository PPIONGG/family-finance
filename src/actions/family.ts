'use server'

import { prisma } from '@/lib/prisma'
import { getUserFamilyGroup } from './auth'
import { revalidatePath } from 'next/cache'

export async function getFamilyMembers() {
  const group = await getUserFamilyGroup()
  if (!group) return []

  return prisma.familyMember.findMany({
    where: { familyGroupId: group.id },
    include: { profile: true },
    orderBy: { joinedAt: 'asc' },
  })
}

export async function getFamilyGroup() {
  const group = await getUserFamilyGroup()
  if (!group) return null

  return prisma.familyGroup.findUnique({
    where: { id: group.id },
    include: {
      members: {
        include: { profile: true },
        orderBy: { joinedAt: 'asc' },
      },
    },
  })
}

export async function removeFamilyMember(memberId: string) {
  await prisma.familyMember.delete({ where: { id: memberId } })
  revalidatePath('/settings')
}
