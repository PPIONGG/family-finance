'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { leaveGroup } from '@/actions/family'
import { toast } from 'sonner'
import { LogOut } from 'lucide-react'

interface LeaveGroupButtonProps {
  groupId: string
  isCreator: boolean
  memberCount: number
}

export function LeaveGroupButton({ groupId, isCreator, memberCount }: LeaveGroupButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const canLeave = !(isCreator && memberCount > 1)

  const handleLeave = async () => {
    setLoading(true)
    try {
      await leaveGroup(groupId)
      toast.success('ออกจากกลุ่มสำเร็จ')
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
        onClick={() => setOpen(true)}
        disabled={!canLeave}
        title={!canLeave ? 'ผู้สร้างกลุ่มไม่สามารถออกได้ถ้ายังมีสมาชิกอยู่' : undefined}
      >
        <LogOut className="h-4 w-4 mr-1.5" />
        ออกจากกลุ่ม
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="ออกจากกลุ่ม"
        description="คุณแน่ใจหรือไม่? การแบ่งจ่ายค่าผ่อนที่เกี่ยวข้องกับคุณจะถูกลบ และคุณจะไม่สามารถเข้าถึงข้อมูลกลุ่มได้อีก"
        onConfirm={handleLeave}
        loading={loading}
      />
    </>
  )
}
