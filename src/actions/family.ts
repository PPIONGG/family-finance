'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from './auth'
import { setActiveGroupId } from '@/lib/active-group'
import { revalidatePath } from 'next/cache'

export async function getGroupMembers(groupId: string) {
  const userData = await getCurrentUser()
  if (!userData?.profile) throw new Error('ไม่พบข้อมูลผู้ใช้')

  const isMember = userData.profile.groupMembers.some((m) => m.group.id === groupId)
  if (!isMember) throw new Error('คุณไม่ได้อยู่ในกลุ่มนี้')

  return prisma.groupMember.findMany({
    where: { groupId },
    include: { profile: true },
    orderBy: { joinedAt: 'asc' },
  })
}

export async function getGroup(groupId: string) {
  const userData = await getCurrentUser()
  if (!userData?.profile) throw new Error('ไม่พบข้อมูลผู้ใช้')

  const isMember = userData.profile.groupMembers.some((m) => m.group.id === groupId)
  if (!isMember) throw new Error('คุณไม่ได้อยู่ในกลุ่มนี้')

  return prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: { profile: true },
        orderBy: { joinedAt: 'asc' },
      },
    },
  })
}

// ดึงทุกกลุ่มที่ user อยู่ พร้อม members
export async function getAllUserGroups() {
  const userData = await getCurrentUser()
  if (!userData?.profile) return []

  const groupIds = userData.profile.groupMembers.map((m) => m.group.id)
  if (groupIds.length === 0) return []

  return prisma.group.findMany({
    where: { id: { in: groupIds } },
    include: {
      members: {
        include: { profile: true },
        orderBy: { joinedAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'asc' },
  })
}

export async function removeGroupMember(memberId: string, groupId: string) {
  const userData = await getCurrentUser()
  if (!userData?.profile) throw new Error('ไม่พบข้อมูลผู้ใช้')

  const group = await prisma.group.findUnique({ where: { id: groupId } })
  if (!group) throw new Error('ไม่พบกลุ่ม')

  if (group.createdBy !== userData.user.id) throw new Error('เฉพาะผู้สร้างกลุ่มเท่านั้น')

  const member = await prisma.groupMember.findFirst({
    where: { id: memberId, groupId },
  })
  if (!member) throw new Error('ไม่พบสมาชิกในกลุ่ม')
  if (member.profileId === userData.user.id) throw new Error('ไม่สามารถลบตัวเองได้')

  await prisma.$transaction(async (tx) => {
    await tx.installmentSplit.deleteMany({
      where: {
        profileId: member.profileId,
        installment: { groupId },
      },
    })

    await tx.groupMember.delete({ where: { id: memberId } })
  })
  revalidatePath('/settings')
}

export async function leaveGroup(groupId: string) {
  const userData = await getCurrentUser()
  if (!userData?.profile) throw new Error('ไม่พบข้อมูลผู้ใช้')

  const group = await prisma.group.findUnique({ where: { id: groupId } })
  if (!group) throw new Error('ไม่พบกลุ่ม')

  const isMember = userData.profile.groupMembers.some((m) => m.group.id === groupId)
  if (!isMember) throw new Error('คุณไม่ได้อยู่ในกลุ่มนี้')

  const isCreator = group.createdBy === userData.user.id
  if (isCreator) {
    const memberCount = await prisma.groupMember.count({ where: { groupId } })
    if (memberCount > 1) {
      throw new Error('ผู้สร้างกลุ่มไม่สามารถออกได้ ถ้ายังมีสมาชิกอยู่ กรุณาลบสมาชิกทั้งหมดก่อน')
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.installmentSplit.deleteMany({
      where: {
        profileId: userData.user.id,
        installment: { groupId },
      },
    })

    await tx.groupMember.delete({
      where: {
        groupId_profileId: {
          groupId,
          profileId: userData.user.id,
        },
      },
    })
  })

  // clear active group ถ้าเป็นกลุ่มที่เพิ่งออก
  await setActiveGroupId(null)

  revalidatePath('/settings')
  revalidatePath('/installments')
}
