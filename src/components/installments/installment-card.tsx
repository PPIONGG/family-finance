import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { formatCurrency } from '@/lib/utils'
import { PLATFORMS } from '@/constants/platforms'

interface InstallmentCardProps {
  installment: {
    id: string
    name: string
    platform: string
    monthlyPayment: unknown
    totalInstallments: number
    paidInstallments: number
    status: string
    createdBy?: string
    splits?: { profileId: string; amountPerMonth: unknown }[]
    payments?: { dueDate: string; status: string; amountDue: unknown }[]
  }
  currentUserId?: string
}

export function InstallmentCard({ installment, currentUserId }: InstallmentCardProps) {
  const progress = (installment.paidInstallments / installment.totalInstallments) * 100
  const platform = PLATFORMS.find((p) => p.value === installment.platform)
  const monthly = Number(installment.monthlyPayment)

  // คำนวณส่วนของฉัน
  const hasSplits = installment.splits && installment.splits.length > 0
  const showSplitInfo = installment.splits && installment.splits.length > 1
  const mySplit = currentUserId && installment.splits?.find((s) => s.profileId === currentUserId)
  // เช็คงวดเดือนนี้
  const now = new Date()
  const thisMonthPayment = installment.payments?.find((p) => {
    const due = new Date(p.dueDate)
    return due.getMonth() === now.getMonth() && due.getFullYear() === now.getFullYear()
  })
  const isPaidThisMonth = thisMonthPayment?.status === 'paid'

  // นับงวดค้างชำระ (overdue)
  const overduePayments = installment.payments?.filter((p) => p.status === 'overdue') ?? []
  const overdueCount = overduePayments.length

  // ยอดเดือนนี้ของฉัน
  const thisMonthFull = thisMonthPayment ? Number(thisMonthPayment.amountDue) : null
  const myRatio = hasSplits && mySplit ? Number(mySplit.amountPerMonth) / monthly : 1
  const thisMonthMine = thisMonthFull != null ? thisMonthFull * myRatio : null

  // ยอดค้างชำระรวม (overdue) ของฉัน
  const overdueTotal = overduePayments.reduce((sum, p) => sum + Number(p.amountDue), 0) * myRatio

  return (
    <Link href={`/installments/${installment.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="pt-4 pb-3 space-y-2">
          {/* ชื่อ + platform */}
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{installment.name}</p>
              <p className="text-xs text-muted-foreground">{platform?.icon} {platform?.label}</p>
            </div>
          </div>

          {/* แจ้งเตือนค้างชำระ */}
          {overdueCount > 0 && (
            <div className="flex justify-between items-center text-sm rounded px-2 py-1 -mx-1 bg-red-50">
              <span className="text-xs text-red-600 font-medium">⚠ ค้างชำระ {overdueCount} งวด</span>
              <span className="font-bold text-red-600">{formatCurrency(overdueTotal)}</span>
            </div>
          )}

          {/* ยอดเดือนนี้ของฉัน */}
          {thisMonthMine != null ? (
            <div className={`flex justify-between items-center text-sm rounded px-2 py-1 -mx-1 ${
              isPaidThisMonth ? 'bg-green-50' : 'bg-orange-50'
            }`}>
              <span className={`text-xs ${isPaidThisMonth ? 'text-green-600' : 'text-orange-600'}`}>
                {isPaidThisMonth ? '✓ จ่ายแล้ว' : 'เดือนนี้ต้องจ่าย'}
              </span>
              <span className={`font-bold ${isPaidThisMonth ? 'text-green-600' : 'text-orange-600'}`}>
                {formatCurrency(thisMonthMine)}
              </span>
            </div>
          ) : (
            <div className="flex justify-between items-center text-sm rounded px-2 py-1 -mx-1 bg-muted/50">
              <span className="text-xs text-muted-foreground">เดือนนี้ไม่มีงวดต้องจ่าย</span>
              <span className="font-bold text-muted-foreground">฿0</span>
            </div>
          )}

          {/* แสดงว่าเป็นยอดส่วนของฉัน ถ้าแบ่งจ่าย */}
          {showSplitInfo && (
            <p className="text-[11px] text-blue-500">
              ส่วนของฉัน (จากยอดเต็ม {formatCurrency(monthly)})
            </p>
          )}

          {/* Progress */}
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{installment.paidInstallments}/{installment.totalInstallments} งวด</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
