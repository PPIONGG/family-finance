import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatShortDate } from '@/lib/utils'
import { StatusBadge } from '@/components/shared/status-badge'
import type { UpcomingPayment } from '@/types'

interface UpcomingPaymentsProps {
  payments: UpcomingPayment[]
}

export function UpcomingPayments({ payments }: UpcomingPaymentsProps) {
  if (payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">งวดที่ต้องจ่ายเดือนนี้</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            ไม่มีงวดที่ต้องจ่ายเดือนนี้
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">งวดที่ต้องจ่ายเดือนนี้ ({payments.length} รายการ)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="flex items-center justify-between p-3 rounded-lg border"
            >
              <div>
                <p className="font-medium text-sm">{payment.installmentName}</p>
                <p className="text-xs text-muted-foreground">
                  {payment.platform} - งวดที่ {payment.installmentNumber}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-sm text-blue-600">
                  {formatCurrency(payment.amountDue)}
                </p>
                <p className="text-xs text-muted-foreground">
                  ครบกำหนด {formatShortDate(payment.dueDate)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
