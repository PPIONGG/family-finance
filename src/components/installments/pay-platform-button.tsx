'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { payMultipleInstallments } from '@/actions/installments'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { CheckCircle } from 'lucide-react'

interface PayPlatformButtonProps {
  platformLabel: string
  paymentIds: string[]
  totalAmount: number
}

export function PayPlatformButton({ platformLabel, paymentIds, totalAmount }: PayPlatformButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  if (paymentIds.length === 0) return null

  const handlePay = async () => {
    setLoading(true)
    try {
      await payMultipleInstallments(paymentIds)
      toast.success(`จ่ายค่างวด ${platformLabel} สำเร็จ (${paymentIds.length} รายการ)`)
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
        size="sm"
        variant="outline"
        className="text-green-600 hover:text-green-700 hover:bg-green-50"
        onClick={() => setOpen(true)}
      >
        <CheckCircle className="h-3.5 w-3.5 mr-1" />
        จ่ายทั้งหมด
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`จ่ายค่างวด ${platformLabel} ทั้งหมด`}
        description={`ยืนยันจ่ายค่างวดเดือนนี้ ${paymentIds.length} รายการ รวม ${formatCurrency(totalAmount)}`}
        onConfirm={handlePay}
        loading={loading}
        variant="default"
      />
    </>
  )
}
