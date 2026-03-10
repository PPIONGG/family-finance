/* eslint-disable @typescript-eslint/no-explicit-any */
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

  // กรองเฉพาะรายการที่เกี่ยวกับฉัน
  const myInstallments = installments.filter((inst: any) => {
    const hasSplits = inst.splits && inst.splits.length > 0
    if (hasSplits) return inst.splits.some((s: any) => s.profileId === userId)
    return inst.createdBy === userId
  })

  // คำนวณสรุป
  const activeInstallments = myInstallments.filter((i: any) => i.status !== 'completed')

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  let myPaid = 0
  let myUnpaid = 0
  let myTotal = 0
  let myOverdue = 0
  let overdueInstCount = 0

  // สรุปแยกแพลตฟอร์ม
  const platformSummary: Record<string, { label: string; icon: string; paid: number; unpaid: number; overdue: number; count: number; unpaidPaymentIds: string[]; overduePaymentIds: string[]; items: { name: string; amount: number; paid: boolean }[] }> = {}

  activeInstallments.forEach((inst: any) => {
    const monthly = Number(inst.monthlyPayment)

    // คำนวณสัดส่วนของฉัน (ratio)
    // - มี splits + ฉันอยู่ใน splits → ใช้สัดส่วนของฉัน
    // - มี splits + ฉันไม่อยู่ → ฉันไม่ต้องจ่าย (ratio = 0)
    // - ไม่มี splits (ผ่อนคนเดียว) → เฉพาะคนสร้างเท่านั้น
    const hasSplits = inst.splits && inst.splits.length > 0
    const mySplit = inst.splits?.find((s: any) => s.profileId === userId)
    const myRatio = hasSplits
      ? (mySplit ? Number(mySplit.amountPerMonth) / monthly : 0)
      : (inst.createdBy === userId ? 1 : 0)

    // คงเหลือ = รวม amountDue ของงวดที่ยังไม่จ่าย
    const remainingPayments = inst.payments?.filter((p: any) => p.status !== 'paid') ?? []
    const remainingTotal = remainingPayments.reduce((sum: number, p: any) => sum + Number(p.amountDue), 0)
    myTotal += remainingTotal * myRatio

    // ยอดค้างชำระ (overdue)
    const overduePayments = inst.payments?.filter((p: any) => p.status === 'overdue') ?? []
    if (overduePayments.length > 0) {
      const overdueTotal = overduePayments.reduce((sum: number, p: any) => sum + Number(p.amountDue), 0)
      myOverdue += overdueTotal * myRatio
      overdueInstCount++
    }

    // หางวดของเดือนนี้ — ใช้ amountDue จริง (อาจต่างจาก monthlyPayment ในงวดสุดท้าย)
    const thisMonthPayment = inst.payments?.find((p: any) => {
      const due = new Date(p.dueDate)
      return due.getMonth() === currentMonth && due.getFullYear() === currentYear
    })
    const isPaidThisMonth = thisMonthPayment?.status === 'paid'
    const thisMonthAmount = thisMonthPayment ? Number(thisMonthPayment.amountDue) * myRatio : 0

    if (isPaidThisMonth) {
      myPaid += thisMonthAmount
    } else if (thisMonthPayment) {
      myUnpaid += thisMonthAmount
    }

    // Group by platform
    const pKey = inst.platform
    if (!platformSummary[pKey]) {
      const p = PLATFORMS.find((p) => p.value === pKey)
      platformSummary[pKey] = {
        label: p?.label ?? pKey,
        icon: p?.icon ?? '📋',
        paid: 0,
        unpaid: 0,
        overdue: 0,
        count: 0,
        unpaidPaymentIds: [],
        overduePaymentIds: [],
        items: [],
      }
    }
    if (isPaidThisMonth) {
      platformSummary[pKey].paid += thisMonthAmount
    } else if (thisMonthPayment) {
      platformSummary[pKey].unpaid += thisMonthAmount
      platformSummary[pKey].unpaidPaymentIds.push(thisMonthPayment.id)
    }

    // Add overdue payments to platform summary
    if (overduePayments.length > 0) {
      const overdueAmount = overduePayments.reduce((sum: number, p: any) => sum + Number(p.amountDue), 0) * myRatio
      const overdueIds = overduePayments.map((p: any) => p.id)
      platformSummary[pKey].overdue += overdueAmount
      platformSummary[pKey].overduePaymentIds.push(...overdueIds)
      platformSummary[pKey].unpaidPaymentIds.push(...overdueIds)
    }

    platformSummary[pKey].count += 1
    platformSummary[pKey].items.push({
      name: inst.name,
      amount: thisMonthAmount,
      paid: isPaidThisMonth,
    })
  })

  const platformEntries = Object.entries(platformSummary).sort((a, b) => (b[1].paid + b[1].unpaid) - (a[1].paid + a[1].unpaid))

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

      {myInstallments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">ยังไม่มีรายการผ่อนชำระ</p>
          <Link href="/installments/new">
            <Button>เพิ่มรายการผ่อนแรก</Button>
          </Link>
        </div>
      ) : (
        <>
          {/* แถบเตือนค้างชำระ */}
          {myOverdue > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-semibold text-red-700">
                  คุณมียอดค้างชำระ {formatCurrency(myOverdue)} ({overdueInstCount} รายการ)
                </p>
                <p className="text-sm text-red-600">กรุณาชำระเงินโดยเร็วเพื่อหลีกเลี่ยงค่าปรับ</p>
              </div>
            </div>
          )}

          {/* สรุปรวม — แสดงเฉพาะส่วนของฉัน */}
          <div className={`grid gap-4 ${myOverdue > 0 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-3'}`}>
            {myOverdue > 0 && (
              <Card className="border-red-200">
                <CardContent className="pt-4">
                  <p className="text-xs text-red-600 font-medium">ค้างชำระ</p>
                  <p className="text-lg font-bold text-red-600">{formatCurrency(myOverdue)}</p>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">ยังต้องจ่ายเดือนนี้</p>
                <p className="text-lg font-bold text-orange-600">{formatCurrency(myUnpaid)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">จ่ายแล้วเดือนนี้</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(myPaid)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">คงเหลือทั้งหมด</p>
                <p className="text-lg font-bold">{formatCurrency(myTotal)}</p>
              </CardContent>
            </Card>
          </div>

          {/* สรุปแยกแพลตฟอร์ม */}
          {platformEntries.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">ยอดผ่อนเดือนนี้แยกตามแพลตฟอร์ม</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  {platformEntries.map(([key, data]) => (
                    <PlatformRow
                      key={key}
                      label={data.label}
                      icon={data.icon}
                      paid={data.paid}
                      unpaid={data.unpaid}
                      overdue={data.overdue}
                      count={data.count}
                      unpaidPaymentIds={data.unpaidPaymentIds}
                      items={data.items}
                    />
                  ))}

                  {/* แถวรวม */}
                  <div className="flex items-center justify-between pt-2 font-bold">
                    <span>รวมทั้งหมด</span>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-orange-600">{formatCurrency(myUnpaid)}</p>
                        {myPaid > 0 && (
                          <p className="text-xs text-green-600 font-medium">จ่ายแล้ว {formatCurrency(myPaid)}</p>
                        )}
                      </div>
                      {myUnpaid > 0 && (
                        <PayPlatformButton
                          platformLabel="ทุกแพลตฟอร์ม"
                          paymentIds={platformEntries.flatMap(([, d]) => d.unpaidPaymentIds)}
                          totalAmount={myUnpaid}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* รายการผ่อน */}
          <InstallmentList
            myInstallments={myInstallments}
            allInstallments={installments}
            currentUserId={userId}
          />
        </>
      )}
    </div>
  )
}
