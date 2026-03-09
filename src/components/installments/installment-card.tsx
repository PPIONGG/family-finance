import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatCurrency } from '@/lib/utils'
import { PLATFORMS } from '@/constants/platforms'
import type { InstallmentStatus } from '@/types'

interface InstallmentCardProps {
  installment: {
    id: string
    name: string
    platform: string
    totalAmount: unknown
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
  const monthlyPayment = Number(installment.monthlyPayment)

  // หาส่วนของฉัน
  const hasSplits = installment.splits && installment.splits.length > 0
  const mySplit = currentUserId && installment.splits?.find((s) => s.profileId === currentUserId)
  const isMyInstallment = !hasSplits
    ? installment.createdBy === currentUserId
    : !!mySplit
  const myAmount = mySplit ? Number(mySplit.amountPerMonth) : null
  const showMyShare = hasSplits && installment.splits!.length > 1

  // หางวดถัดไปที่ต้องจ่าย
  const nextPayment = installment.payments?.find((p) => p.status === 'pending' || p.status === 'overdue')
  const nextAmount = nextPayment ? Number(nextPayment.amountDue) : monthlyPayment

  // เช็คงวดเดือนนี้จ่ายแล้วหรือยัง
  const now = new Date()
  const thisMonthPayment = installment.payments?.find((p) => {
    const due = new Date(p.dueDate)
    return due.getMonth() === now.getMonth() && due.getFullYear() === now.getFullYear()
  })
  const isPaidThisMonth = thisMonthPayment?.status === 'paid'

  return (
    <Link href={`/installments/${installment.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-base">{installment.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {platform?.icon} {platform?.label ?? installment.platform}
              </p>
            </div>
            <StatusBadge status={installment.status as InstallmentStatus} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">ยอดรวม</span>
            <span className="font-semibold">{formatCurrency(Number(installment.totalAmount))}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">งวดถัดไป</span>
            <span className="font-semibold">
              {formatCurrency(nextAmount)}
            </span>
          </div>

          {/* สถานะงวดเดือนนี้ */}
          {thisMonthPayment && (
            <div className={`flex justify-between text-sm -mx-4 px-4 py-1.5 rounded ${
              isPaidThisMonth ? 'bg-green-50' : 'bg-orange-50'
            }`}>
              <span className={`font-medium ${isPaidThisMonth ? 'text-green-600' : 'text-orange-600'}`}>
                เดือนนี้ {formatCurrency(Number(thisMonthPayment.amountDue))}
              </span>
              <span className={`font-bold ${isPaidThisMonth ? 'text-green-600' : 'text-orange-600'}`}>
                {isPaidThisMonth ? '✓ จ่ายแล้ว' : 'ยังไม่จ่าย'}
              </span>
            </div>
          )}

          {/* ส่วนของฉัน */}
          {showMyShare && myAmount != null && (
            <div className="flex justify-between text-sm bg-blue-50 -mx-4 px-4 py-1.5 rounded">
              <span className="text-blue-600 font-medium">ส่วนของฉัน</span>
              <span className="font-bold text-blue-600">
                {formatCurrency(myAmount)}
              </span>
            </div>
          )}

          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>จ่ายแล้ว {installment.paidInstallments}/{installment.totalInstallments} งวด</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
