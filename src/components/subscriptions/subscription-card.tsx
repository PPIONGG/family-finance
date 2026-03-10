'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { formatCurrency } from '@/lib/utils'
import { updateSubscriptionStatus, deleteSubscription } from '@/actions/subscriptions'
import { SUBSCRIPTION_CATEGORIES, BILLING_CYCLES } from '@/constants/subscriptions'
import { toast } from 'sonner'
import { Trash2, Pause, Play, X } from 'lucide-react'

interface SubscriptionCardProps {
  subscription: {
    id: string
    name: string
    category: string
    amount: number
    billingCycle: string
    billingDay: number
    status: string
    autoRenew: boolean
    notes: string | null
  }
}

export function SubscriptionCard({ subscription: sub }: SubscriptionCardProps) {
  const router = useRouter()
  const [showDelete, setShowDelete] = useState(false)
  const [loading, setLoading] = useState(false)

  const category = SUBSCRIPTION_CATEGORIES.find((c) => c.value === sub.category)
  const cycle = BILLING_CYCLES.find((c) => c.value === sub.billingCycle)
  const monthlyAmount = sub.billingCycle === 'yearly' ? sub.amount / 12 : sub.amount

  const handleStatusChange = async (status: string) => {
    setLoading(true)
    try {
      await updateSubscriptionStatus(sub.id, status)
      const msg = status === 'active' ? 'เปิดใช้งานแล้ว' : status === 'paused' ? 'หยุดชั่วคราว' : 'ยกเลิกแล้ว'
      toast.success(msg)
      router.refresh()
    } catch {
      toast.error('เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      await deleteSubscription(sub.id)
      toast.success('ลบสำเร็จ')
      router.refresh()
    } catch {
      toast.error('เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
      setShowDelete(false)
    }
  }

  const statusColor = sub.status === 'active'
    ? 'bg-green-100 text-green-700'
    : sub.status === 'paused'
    ? 'bg-yellow-100 text-yellow-700'
    : 'bg-red-100 text-red-700'

  const statusLabel = sub.status === 'active' ? 'ใช้งาน' : sub.status === 'paused' ? 'หยุดชั่วคราว' : 'ยกเลิก'

  return (
    <>
      <Card className={sub.status === 'cancelled' ? 'opacity-60' : ''}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{category?.icon || '📦'}</span>
              <div>
                <CardTitle className="text-base">{sub.name}</CardTitle>
                <p className="text-xs text-muted-foreground">{category?.label || sub.category}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}>
                {statusLabel}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-red-600"
                onClick={() => setShowDelete(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">ค่าบริการ</span>
            <span className="font-semibold">
              {formatCurrency(sub.amount)}/{cycle?.label || sub.billingCycle}
            </span>
          </div>
          {sub.billingCycle === 'yearly' && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">เฉลี่ยต่อเดือน</span>
              <span className="text-muted-foreground">{formatCurrency(monthlyAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">วันตัดจ่าย</span>
            <span>ทุกวันที่ {sub.billingDay}</span>
          </div>
          {sub.notes && (
            <p className="text-xs text-muted-foreground pt-1">{sub.notes}</p>
          )}

          {sub.status !== 'cancelled' && (
            <div className="flex gap-2 pt-2">
              {sub.status === 'active' ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleStatusChange('paused')}
                  disabled={loading}
                >
                  <Pause className="h-3.5 w-3.5 mr-1" />
                  หยุดชั่วคราว
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleStatusChange('active')}
                  disabled={loading}
                >
                  <Play className="h-3.5 w-3.5 mr-1" />
                  เปิดใช้งาน
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
                onClick={() => handleStatusChange('cancelled')}
                disabled={loading}
              >
                <X className="h-3.5 w-3.5 mr-1" />
                ยกเลิก
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="ลบ Subscription"
        description={`คุณแน่ใจหรือไม่ว่าต้องการลบ "${sub.name}"?`}
        onConfirm={handleDelete}
        loading={loading}
      />
    </>
  )
}
