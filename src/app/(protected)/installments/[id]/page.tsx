import { notFound } from 'next/navigation'
import { getInstallmentById } from '@/actions/installments'
import { getFamilyMembers } from '@/actions/family'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatCurrency, formatShortDate } from '@/lib/utils'
import { PLATFORMS } from '@/constants/platforms'
import { PaymentTable } from '@/components/installments/payment-table'
import { ManageSplitsDialog } from '@/components/installments/manage-splits-dialog'
import { DeleteInstallmentButton } from '@/components/installments/delete-installment-button'
import type { InstallmentStatus } from '@/types'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default async function InstallmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [installment, members] = await Promise.all([
    getInstallmentById(id),
    getFamilyMembers(),
  ])

  if (!installment) notFound()

  const progress = (installment.paidInstallments / installment.totalInstallments) * 100
  const platform = PLATFORMS.find((p) => p.value === installment.platform)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/installments">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{installment.name}</h1>
          <p className="text-muted-foreground">
            {platform?.icon} {platform?.label ?? installment.platform}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ManageSplitsDialog
            installmentId={installment.id}
            monthlyPayment={Number(installment.monthlyPayment)}
            members={members.map((m) => ({
              profileId: m.profileId,
              displayName: m.profile.displayName,
            }))}
            existingSplits={installment.splits as any}
          />
          <DeleteInstallmentButton id={installment.id} />
          <StatusBadge status={installment.status as InstallmentStatus} />
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">ราคาสินค้า</p>
            <p className="text-lg font-bold">{formatCurrency(Number(installment.principalAmount))}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">ดอกเบี้ยรวม</p>
            <p className="text-lg font-bold text-orange-600">{formatCurrency(Number(installment.totalInterest))}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">ยอดรวมทั้งหมด</p>
            <p className="text-lg font-bold">{formatCurrency(Number(installment.totalAmount))}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">งวดละ</p>
            <p className="text-lg font-bold text-blue-600">{formatCurrency(Number(installment.monthlyPayment))}</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex justify-between text-sm mb-2">
            <span>ความคืบหน้า</span>
            <span className="font-medium">
              {installment.paidInstallments}/{installment.totalInstallments} งวด ({Math.round(progress)}%)
            </span>
          </div>
          <Progress value={progress} className="h-3" />
        </CardContent>
      </Card>

      {/* Split info */}
      {installment.splits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">การหารค่าผ่อน</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {installment.splits.map((split) => (
                <div key={split.id} className="flex items-center justify-between p-2 rounded border">
                  <span className="font-medium text-sm">{split.profile.displayName}</span>
                  <span className="text-sm text-blue-600 font-semibold">
                    {formatCurrency(Number(split.amountPerMonth))}/เดือน
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Table */}
      <PaymentTable payments={installment.payments} />

      {installment.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">หมายเหตุ</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{installment.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
