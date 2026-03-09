'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { deleteInstallment } from '@/actions/installments'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'

export function DeleteInstallmentButton({ id }: { id: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      await deleteInstallment(id)
      toast.success('ลบรายการผ่อนสำเร็จ')
      router.push('/installments')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex gap-2">
        <Button
          variant="destructive"
          size="sm"
          disabled={loading}
          onClick={handleDelete}
        >
          {loading ? 'กำลังลบ...' : 'ยืนยันลบ'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConfirming(false)}
        >
          ยกเลิก
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="text-red-600 hover:text-red-700 hover:bg-red-50"
      onClick={() => setConfirming(true)}
    >
      <Trash2 className="h-4 w-4 mr-1" />
      ลบ
    </Button>
  )
}
