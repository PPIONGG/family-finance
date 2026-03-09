import Link from 'next/link'
import { getInstallments } from '@/actions/installments'
import { getCurrentUser } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { InstallmentList } from '@/components/installments/installment-list'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { PLATFORMS } from '@/constants/platforms'

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
  const activeInstallments = myInstallments.filter((i: any) => i.status === 'active')

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  let myPaid = 0
  let myUnpaid = 0
  let myTotal = 0

  // สรุปแยกแพลตฟอร์ม
  const platformSummary: Record<string, { label: string; icon: string; paid: number; unpaid: number; count: number }> = {}

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
        count: 0,
      }
    }
    if (isPaidThisMonth) {
      platformSummary[pKey].paid += thisMonthAmount
    } else if (thisMonthPayment) {
      platformSummary[pKey].unpaid += thisMonthAmount
    }
    platformSummary[pKey].count += 1
  })

  const myMonthly = myPaid + myUnpaid
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
          {/* สรุปรวม — แสดงเฉพาะส่วนของฉัน */}
          <div className="grid gap-4 grid-cols-3">
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
                <div className="space-y-3">
                  {platformEntries.map(([key, data]) => {
                    const platformTotal = data.paid + data.unpaid
                    const allPaid = data.unpaid === 0 && data.paid > 0
                    return (
                      <div key={key} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{data.icon}</span>
                          <div>
                            <p className="font-medium text-sm">{data.label}</p>
                            <p className="text-xs text-muted-foreground">{data.count} รายการ</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {allPaid ? (
                            <p className="font-bold text-green-600">✓ จ่ายแล้ว {formatCurrency(platformTotal)}</p>
                          ) : (
                            <>
                              {data.unpaid > 0 && (
                                <p className="font-bold text-orange-600">{formatCurrency(data.unpaid)}</p>
                              )}
                              {data.paid > 0 && (
                                <p className="text-xs text-green-600">จ่ายแล้ว {formatCurrency(data.paid)}</p>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {/* แถวรวม */}
                  <div className="flex items-center justify-between pt-2 font-bold">
                    <span>รวมทั้งหมด</span>
                    <div className="text-right">
                      <p className="text-orange-600">{formatCurrency(myUnpaid)}</p>
                      {myPaid > 0 && (
                        <p className="text-xs text-green-600 font-medium">จ่ายแล้ว {formatCurrency(myPaid)}</p>
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
