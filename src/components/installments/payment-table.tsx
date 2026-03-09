'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatCurrency, formatShortDate } from '@/lib/utils'
import { payInstallment, payMultipleInstallments } from '@/actions/installments'
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
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [batchPaying, setBatchPaying] = useState(false)

  const unpaidPayments = payments.filter(
    (p) => p.status === 'pending' || p.status === 'overdue' || p.status === 'upcoming'
  )
  const canSelect = unpaidPayments.length > 1

  const toggleSelect = (id: string, installmentNumber: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        // Uncheck: also uncheck all after this
        for (const p of payments) {
          if (p.installmentNumber >= installmentNumber && next.has(p.id)) {
            next.delete(p.id)
          }
        }
      } else {
        // Check: also check all unpaid before this (ต้องจ่ายตามลำดับ)
        for (const p of payments) {
          if (p.installmentNumber <= installmentNumber && p.status !== 'paid') {
            next.add(p.id)
          }
        }
      }
      return next
    })
  }

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

  const handleBatchPay = async () => {
    if (selected.size === 0) return
    setBatchPaying(true)
    try {
      await payMultipleInstallments(Array.from(selected))
      toast.success(`บันทึกการจ่าย ${selected.size} งวดสำเร็จ`)
      setSelected(new Set())
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
    } finally {
      setBatchPaying(false)
    }
  }

  const selectedTotal = payments
    .filter((p) => selected.has(p.id))
    .reduce((sum, p) => sum + Number(p.amountDue), 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">ตารางผ่อนชำระ</CardTitle>
          {selected.size > 0 && (
            <Button
              size="sm"
              disabled={batchPaying}
              onClick={handleBatchPay}
            >
              {batchPaying
                ? 'กำลังจ่าย...'
                : `จ่าย ${selected.size} งวด (${formatCurrency(selectedTotal)})`}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                {canSelect && <th className="py-2 px-2 w-8"></th>}
                <th className="py-2 px-2 font-medium">งวดที่</th>
                <th className="py-2 px-2 font-medium">วันครบกำหนด</th>
                <th className="py-2 px-2 font-medium text-right">ยอด</th>
                <th className="py-2 px-2 font-medium">สถานะ</th>
                <th className="py-2 px-2 font-medium">จ่ายโดย</th>
                <th className="py-2 px-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => {
                const isUnpaid = payment.status !== 'paid'
                const isSelected = selected.has(payment.id)

                return (
                  <tr
                    key={payment.id}
                    className={`border-b last:border-0 ${isSelected ? 'bg-blue-50' : ''}`}
                  >
                    {canSelect && (
                      <td className="py-2.5 px-2">
                        {isUnpaid && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(payment.id, payment.installmentNumber)}
                            className="h-4 w-4 rounded"
                          />
                        )}
                      </td>
                    )}
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
                      {(payment.status === 'pending' || payment.status === 'overdue') && selected.size === 0 && (
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
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
