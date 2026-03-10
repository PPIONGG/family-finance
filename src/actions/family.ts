'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser, getUserFamilyGroup } from './auth'
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
  const userData = await getCurrentUser()
  if (!userData?.profile) throw new Error('ไม่พบข้อมูลผู้ใช้')

  const group = await getUserFamilyGroup()
  if (!group) throw new Error('ไม่พบกลุ่มครอบครัว')

  // ตรวจสอบว่าเป็น admin
  if (userData.profile.role !== 'admin') throw new Error('เฉพาะ admin เท่านั้น')

  // ตรวจสอบว่าสมาชิกอยู่ในกลุ่มเดียวกัน
  const member = await prisma.familyMember.findFirst({
    where: { id: memberId, familyGroupId: group.id },
  })
  if (!member) throw new Error('ไม่พบสมาชิกในกลุ่ม')

  // ห้ามลบตัวเอง
  if (member.profileId === userData.profile.id) throw new Error('ไม่สามารถลบตัวเองได้')

  await prisma.familyMember.delete({ where: { id: memberId } })
  revalidatePath('/settings')
}

export async function leaveFamilyGroup() {
  const userData = await getCurrentUser()
  if (!userData?.profile) throw new Error('ไม่พบข้อมูลผู้ใช้')

  const group = await getUserFamilyGroup()
  if (!group) throw new Error('คุณไม่ได้อยู่ในกลุ่มใดๆ')

  // ถ้าเป็น admin ต้องเช็คว่ามีสมาชิกอื่นอยู่ไหม
  if (userData.profile.role === 'admin') {
    const memberCount = await prisma.familyMember.count({
      where: { familyGroupId: group.id },
    })
    if (memberCount > 1) {
      throw new Error('ผู้ดูแลไม่สามารถออกจากกลุ่มได้ ถ้ายังมีสมาชิกอยู่ กรุณาลบสมาชิกทั้งหมดก่อน')
    }
  }

  // ลบ InstallmentSplit ที่ผูกกับ profileId
  await prisma.installmentSplit.deleteMany({
    where: {
      profileId: userData.user.id,
      installment: { familyGroupId: group.id },
    },
  })

  // ลบ FamilyMember record
  await prisma.familyMember.delete({
    where: {
      familyGroupId_profileId: {
        familyGroupId: group.id,
        profileId: userData.user.id,
      },
    },
  })

  // เปลี่ยน role เป็น member
  await prisma.profile.update({
    where: { id: userData.user.id },
    data: { role: 'member' },
  })

  revalidatePath('/settings')
  revalidatePath('/installments')
}
