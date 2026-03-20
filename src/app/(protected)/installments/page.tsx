import Link from 'next/link'
import { getInstallments } from '@/actions/installments'
import { getCurrentUser } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { InstallmentList } from '@/components/installments/installment-list'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { PLATFORMS } from '@/constants/platforms'
import { PayPlatformButton } from '@/components/installments/pay-platform-button'
import { PlatformRow } from '@/components/installments/platform-row'

export default async function InstallmentsPage() {
  const [installments, userData] = await Promise.all([
    getInstallments(),
    getCurrentUser(),
  ])
  const userId = userData?.user?.id

  // คำนวณสรุป (filtered by active group แล้ว)
  const activeInstallments = installments.filter((i) => i.status !== 'completed')

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  let myPaid = 0, myUnpaid = 0, myTotal = 0, myOverdue = 0, overdueInstCount = 0

  const platformSummary: Record<string, {
    label: string; icon: string; paid: number; unpaid: number; overdue: number
    count: number; unpaidPaymentIds: string[]; overduePaymentIds: string[]
    items: { name: string; amount: number; paid: boolean }[]
  }> = {}

  activeInstallments.forEach((inst) => {
    const monthly = Number(inst.monthlyPayment)
    const hasSplits = inst.splits && inst.splits.length > 0
    const mySplit = inst.splits?.find((s) => s.profileId === userId)
    const myRatio = hasSplits
      ? (mySplit ? Number(mySplit.amountPerMonth) / monthly : 0)
      : (inst.createdBy === userId ? 1 : inst.groupId ? 1 : 0)

    const remainingPayments = inst.payments?.filter((p) => p.status !== 'paid') ?? []
    myTotal += remainingPayments.reduce((sum, p) => sum + Number(p.amountDue), 0) * myRatio

    const overduePayments = inst.payments?.filter((p) => p.status === 'overdue') ?? []
    if (overduePayments.length > 0) {
      myOverdue += overduePayments.reduce((sum, p) => sum + Number(p.amountDue), 0) * myRatio
      overdueInstCount++
    }

    const thisMonthPayment = inst.payments?.find((p) => {
      const due = new Date(p.dueDate)
      return due.getMonth() === currentMonth && due.getFullYear() === currentYear
    })
    const isPaidThisMonth = thisMonthPayment?.status === 'paid'
    const thisMonthAmount = thisMonthPayment ? Number(thisMonthPayment.amountDue) * myRatio : 0

    if (isPaidThisMonth) myPaid += thisMonthAmount
    else if (thisMonthPayment) myUnpaid += thisMonthAmount

    const pKey = inst.platform
    if (!platformSummary[pKey]) {
      const plat = PLATFORMS.find((pl) => pl.value === pKey)
      platformSummary[pKey] = { label: plat?.label ?? pKey, icon: plat?.icon ?? '', paid: 0, unpaid: 0, overdue: 0, count: 0, unpaidPaymentIds: [], overduePaymentIds: [], items: [] }
    }
    if (isPaidThisMonth) platformSummary[pKey].paid += thisMonthAmount
    else if (thisMonthPayment) {
      platformSummary[pKey].unpaid += thisMonthAmount
      platformSummary[pKey].unpaidPaymentIds.push(thisMonthPayment.id)
    }
    if (overduePayments.length > 0) {
      const overdueAmount = overduePayments.reduce((sum, p) => sum + Number(p.amountDue), 0) * myRatio
      platformSummary[pKey].overdue += overdueAmount
      platformSummary[pKey].overduePaymentIds.push(...overduePayments.map((p) => p.id))
      platformSummary[pKey].unpaidPaymentIds.push(...overduePayments.map((p) => p.id))
    }
    platformSummary[pKey].count += 1
    platformSummary[pKey].items.push({ name: inst.name, amount: thisMonthAmount, paid: isPaidThisMonth })
  })

  const platformEntries = Object.entries(platformSummary).sort((a, b) => (b[1].paid + b[1].unpaid) - (a[1].paid + a[1].unpaid))
  const hasAny = installments.length > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">การผ่อนชำระ</h1>
        <Link href="/installments/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            เพิ่มรายการผ่อน
          </Button>
        </Link>
      </div>

      {!hasAny ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">ยังไม่มีรายการผ่อนชำระ</p>
          <Link href="/installments/new"><Button>เพิ่มรายการผ่อนแรก</Button></Link>
        </div>
      ) : (
        <>
          {myOverdue > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-semibold text-red-700">คุณมียอดค้างชำระ {formatCurrency(myOverdue)} ({overdueInstCount} รายการ)</p>
                <p className="text-sm text-red-600">กรุณาชำระเงินโดยเร็วเพื่อหลีกเลี่ยงค่าปรับ</p>
              </div>
            </div>
          )}

          <div className={`grid gap-4 ${myOverdue > 0 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-3'}`}>
            {myOverdue > 0 && (
              <Card className="border-red-200">
                <CardContent className="pt-4">
                  <p className="text-xs text-red-600 font-medium">ค้างชำระ</p>
                  <p className="text-lg font-bold text-red-600">{formatCurrency(myOverdue)}</p>
                </CardContent>
              </Card>
            )}
            <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">ยังต้องจ่ายเดือนนี้</p><p className="text-lg font-bold text-orange-600">{formatCurrency(myUnpaid)}</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">จ่ายแล้วเดือนนี้</p><p className="text-lg font-bold text-green-600">{formatCurrency(myPaid)}</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">คงเหลือทั้งหมด</p><p className="text-lg font-bold">{formatCurrency(myTotal)}</p></CardContent></Card>
          </div>

          {platformEntries.length > 0 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">ยอดผ่อนเดือนนี้แยกตามแพลตฟอร์ม</CardTitle></CardHeader>
              <CardContent>
                <div>
                  {platformEntries.map(([key, data]) => (
                    <PlatformRow key={key} label={data.label} icon={data.icon} paid={data.paid} unpaid={data.unpaid} overdue={data.overdue} count={data.count} unpaidPaymentIds={data.unpaidPaymentIds} items={data.items} />
                  ))}
                  <div className="flex items-center justify-between pt-2 font-bold">
                    <span>รวมทั้งหมด</span>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-orange-600">{formatCurrency(myUnpaid)}</p>
                        {myPaid > 0 && <p className="text-xs text-green-600 font-medium">จ่ายแล้ว {formatCurrency(myPaid)}</p>}
                      </div>
                      {myUnpaid > 0 && <PayPlatformButton platformLabel="ทุกแพลตฟอร์ม" paymentIds={platformEntries.flatMap(([, d]) => d.unpaidPaymentIds)} totalAmount={myUnpaid} />}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <InstallmentList
            installments={installments}
            currentUserId={userId}
          />
        </>
      )}
    </div>
  )
}
