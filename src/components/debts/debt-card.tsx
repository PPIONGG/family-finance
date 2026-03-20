'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { StatusBadge } from '@/components/shared/status-badge'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { formatCurrency, formatShortDate } from '@/lib/utils'
import { payDebt, deleteDebt } from '@/actions/debts'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import type { DebtStatus } from '@/types'

interface DebtCardProps {
  debt: {
    id: string
    creditorName: string
    totalAmount: number
    remainingAmount: number
    interestRate: number
    minimumPayment: number | null
    dueDate: Date | string | null
    status: string
    notes: string | null
  }
}

export function DebtCard({ debt }: DebtCardProps) {
  const router = useRouter()
  const [payAmount, setPayAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const paid = debt.totalAmount - debt.remainingAmount
  const progress = (paid / debt.totalAmount) * 100

  const handlePay = async () => {
    const amount = parseFloat(payAmount)
    if (!amount || amount <= 0) return
    setLoading(true)
    try {
      await payDebt(debt.id, amount)
      toast.success('บันทึกการชำระสำเร็จ')
      setPayAmount('')
      router.refresh()
    } catch {
      toast.error('เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteDebt(debt.id)
      toast.success('ลบรายการสำเร็จ')
      router.refresh()
    } catch {
      toast.error('เกิดข้อผิดพลาด')
    } finally {
      setDeleting(false)
      setShowDelete(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-base">{debt.creditorName}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={debt.status as DebtStatus} />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-red-600"
                onClick={() => setShowDelete(true)}
                aria-label="ลบรายการ"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">ยอดรวม</span>
            <span className="font-semibold">{formatCurrency(debt.totalAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">คงเหลือ</span>
            <span className="font-semibold text-orange-600">{formatCurrency(debt.remainingAmount)}</span>
          </div>
          {debt.interestRate > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">ดอกเบี้ย</span>
              <span>{debt.interestRate}% ต่อปี</span>
            </div>
          )}
          {debt.dueDate && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">ครบกำหนด</span>
              <span>{formatShortDate(debt.dueDate)}</span>
            </div>
          )}

          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>ชำระแล้ว {formatCurrency(paid)}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {debt.status === 'active' && (
            <div className="flex gap-2 pt-2">
              <Input
                type="number"
                placeholder="จำนวนเงิน"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="flex-1"
              />
              <Button size="sm" onClick={handlePay} disabled={loading}>
                {loading ? '...' : 'ชำระ'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="ลบรายการหนี้สิน"
        description={`คุณแน่ใจหรือไม่ว่าต้องการลบ "${debt.creditorName}"?`}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  )
}
