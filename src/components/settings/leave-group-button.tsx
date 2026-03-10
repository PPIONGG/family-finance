'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { leaveFamilyGroup } from '@/actions/family'
import { toast } from 'sonner'
import { LogOut } from 'lucide-react'

interface LeaveGroupButtonProps {
  isAdmin: boolean
  memberCount: number
}

export function LeaveGroupButton({ isAdmin, memberCount }: LeaveGroupButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const canLeave = !(isAdmin && memberCount > 1)

  const handleLeave = async () => {
    setLoading(true)
    try {
      await leaveFamilyGroup()
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
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
        onClick={() => setOpen(true)}
        disabled={!canLeave}
      >
        <LogOut className="h-4 w-4 mr-2" />
        ออกจากกลุ่ม
      </Button>
      {!canLeave && (
        <p className="text-xs text-muted-foreground mt-1">
          ผู้ดูแลไม่สามารถออกได้ถ้ายังมีสมาชิกอยู่
        </p>
      )}

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="ออกจากกลุ่มครอบครัว"
        description="คุณแน่ใจหรือไม่? การแบ่งจ่ายค่าผ่อนที่เกี่ยวข้องกับคุณจะถูกลบ และคุณจะไม่สามารถเข้าถึงข้อมูลครอบครัวได้อีก"
        onConfirm={handleLeave}
        loading={loading}
      />
    </>
  )
}
