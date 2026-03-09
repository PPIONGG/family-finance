'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatCurrency, formatShortDate } from '@/lib/utils'
import { payInstallment } from '@/actions/installments'
import { toast } from 'sonner'
import type { PaymentStatus } from '@/types'

interface Payment {
  id: string
  installmentNumber: number
  amountDue: unknown
  amountPaid: unknown
  dueDate: Date | string
  paidDate: Date | string | null
  status: string
  payer: { displayName: string } | null
}

interface PaymentTableProps {
  payments: Payment[]
}

export function PaymentTable({ payments }: PaymentTableProps) {
  const router = useRouter()
  const [payingId, setPayingId] = useState<string | null>(null)

  const handlePay = async (paymentId: string) => {
    setPayingId(paymentId)
    try {
      await payInstallment(paymentId)
      toast.success('บันทึกการจ่ายเงินสำเร็จ')
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
    } finally {
      setPayingId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">ตารางผ่อนชำระ</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 px-2 font-medium">งวดที่</th>
                <th className="py-2 px-2 font-medium">วันครบกำหนด</th>
                <th className="py-2 px-2 font-medium text-right">ยอด</th>
                <th className="py-2 px-2 font-medium">สถานะ</th>
                <th className="py-2 px-2 font-medium">จ่ายโดย</th>
                <th className="py-2 px-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b last:border-0">
                  <td className="py-2.5 px-2">{payment.installmentNumber}</td>
                  <td className="py-2.5 px-2">{formatShortDate(payment.dueDate)}</td>
                  <td className="py-2.5 px-2 text-right font-medium">
                    {formatCurrency(Number(payment.amountDue))}
                  </td>
                  <td className="py-2.5 px-2">
                    <StatusBadge status={payment.status as PaymentStatus} />
                  </td>
                  <td className="py-2.5 px-2 text-muted-foreground">
                    {payment.payer?.displayName ?? '-'}
                  </td>
                  <td className="py-2.5 px-2">
                    {(payment.status === 'pending' || payment.status === 'overdue') && (
                      <Button
                        size="sm"
                        variant={payment.status === 'overdue' ? 'destructive' : 'default'}
                        disabled={payingId === payment.id}
                        onClick={() => handlePay(payment.id)}
                      >
                        {payingId === payment.id ? 'กำลังจ่าย...' : 'จ่ายงวดนี้'}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
