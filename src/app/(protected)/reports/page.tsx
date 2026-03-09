import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getDashboardData } from '@/actions/dashboard'
import { formatCurrency, formatShortDate } from '@/lib/utils'
import { getInstallments } from '@/actions/installments'
import { getFamilyMembers } from '@/actions/family'
import { getCurrentUser } from '@/actions/auth'
import { PLATFORMS } from '@/constants/platforms'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default async function ReportsPage() {
  const [dashData, installments, members, userData] = await Promise.all([
    getDashboardData(),
    getInstallments(),
    getFamilyMembers(),
    getCurrentUser(),
  ])

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const activeInstallments = installments.filter((i: any) => i.status === 'active')

  // ── ยอดเดือนนี้แยกแพลตฟอร์ม (ทั้งกลุ่ม) ──
  const platformSummary: Record<string, {
    label: string
    icon: string
    totalDue: number
    totalPaid: number
    items: { name: string; amount: number; status: string }[]
  }> = {}

  let groupTotalDue = 0
  let groupTotalPaid = 0

  activeInstallments.forEach((inst: any) => {
    const thisMonthPayment = inst.payments?.find((p: any) => {
      const due = new Date(p.dueDate)
      return due.getMonth() === currentMonth && due.getFullYear() === currentYear
    })
    if (!thisMonthPayment) return

    const amount = Number(thisMonthPayment.amountDue)
    const isPaid = thisMonthPayment.status === 'paid'

    if (isPaid) {
      groupTotalPaid += amount
    } else {
      groupTotalDue += amount
    }

    const pKey = inst.platform
    if (!platformSummary[pKey]) {
      const p = PLATFORMS.find((p) => p.value === pKey)
      platformSummary[pKey] = {
        label: p?.label ?? pKey,
        icon: p?.icon ?? '📋',
        totalDue: 0,
        totalPaid: 0,
        items: [],
      }
    }
    if (isPaid) {
      platformSummary[pKey].totalPaid += amount
    } else {
      platformSummary[pKey].totalDue += amount
    }
    platformSummary[pKey].items.push({
      name: inst.name,
      amount,
      status: thisMonthPayment.status,
    })
  })

  const platformEntries = Object.entries(platformSummary).sort(
    (a, b) => (b[1].totalDue + b[1].totalPaid) - (a[1].totalDue + a[1].totalPaid)
  )

  // ── สรุปรายสมาชิก ──
  const memberSummary = members.map((member: any) => {
    const memberId = member.profileId
    const memberName = member.profile?.displayName || member.nickname || 'ไม่ระบุ'

    let thisMonthDue = 0
    let thisMonthPaid = 0
    let totalRemaining = 0
    let activeCount = 0

    activeInstallments.forEach((inst: any) => {
      const hasSplits = inst.splits && inst.splits.length > 0
      const mySplit = inst.splits?.find((s: any) => s.profileId === memberId)
      const monthly = Number(inst.monthlyPayment)

      const myRatio = hasSplits
        ? (mySplit ? Number(mySplit.amountPerMonth) / monthly : 0)
        : (inst.createdBy === memberId ? 1 : 0)

      if (myRatio === 0) return

      activeCount++

      // ยอดเดือนนี้
      const thisMonthPayment = inst.payments?.find((p: any) => {
        const due = new Date(p.dueDate)
        return due.getMonth() === currentMonth && due.getFullYear() === currentYear
      })
      if (thisMonthPayment) {
        const amount = Number(thisMonthPayment.amountDue) * myRatio
        if (thisMonthPayment.status === 'paid') {
          thisMonthPaid += amount
        } else {
          thisMonthDue += amount
        }
      }

      // ยอดคงเหลือทั้งหมด
      const remaining = inst.payments
        ?.filter((p: any) => p.status !== 'paid')
        .reduce((sum: number, p: any) => sum + Number(p.amountDue), 0) ?? 0
      totalRemaining += remaining * myRatio
    })

    return {
      id: memberId,
      name: memberName,
      thisMonthDue,
      thisMonthPaid,
      totalRemaining,
      activeCount,
    }
  }).filter((m: any) => m.activeCount > 0)

  // ── ยอดผ่อนรวมทั้งหมด (ใช้ actual payment amounts) ──
  const totalPaidAll = installments.reduce((sum: number, inst: any) => {
    return sum + (inst.payments?.filter((p: any) => p.status === 'paid')
      .reduce((s: number, p: any) => s + Number(p.amountDue), 0) ?? 0)
  }, 0)

  const totalRemainingAll = installments.reduce((sum: number, inst: any) => {
    return sum + (inst.payments?.filter((p: any) => p.status !== 'paid')
      .reduce((s: number, p: any) => s + Number(p.amountDue), 0) ?? 0)
  }, 0)

  const thaiMonth = new Intl.DateTimeFormat('th', { month: 'long', year: 'numeric' }).format(now)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">รายงาน</h1>

      {/* ── ยอดเดือนนี้ (ทั้งกลุ่ม) ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ยอดผ่อนชำระเดือนนี้ — {thaiMonth}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3 mb-4">
            <div className="rounded-lg bg-orange-50 border border-orange-200 p-3 text-center">
              <p className="text-xs text-orange-600 mb-1">ยังไม่จ่าย</p>
              <p className="text-lg font-bold text-orange-700">{formatCurrency(groupTotalDue)}</p>
            </div>
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-center">
              <p className="text-xs text-green-600 mb-1">จ่ายแล้ว</p>
              <p className="text-lg font-bold text-green-700">{formatCurrency(groupTotalPaid)}</p>
            </div>
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-center">
              <p className="text-xs text-blue-600 mb-1">รวมทั้งหมด</p>
              <p className="text-lg font-bold text-blue-700">{formatCurrency(groupTotalDue + groupTotalPaid)}</p>
            </div>
          </div>

          {/* แยกตามแพลตฟอร์ม */}
          {platformEntries.length > 0 && (
            <div className="space-y-3">
              {platformEntries.map(([key, data]) => (
                <div key={key} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{data.icon} {data.label}</span>
                    <span className="font-bold">{formatCurrency(data.totalDue + data.totalPaid)}</span>
                  </div>
                  <div className="space-y-1">
                    {data.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{item.name}</span>
                          {item.status === 'paid' ? (
                            <Badge variant="outline" className="text-green-600 border-green-300 text-[10px] px-1.5 py-0">จ่ายแล้ว</Badge>
                          ) : (
                            <Badge variant="outline" className="text-orange-600 border-orange-300 text-[10px] px-1.5 py-0">ยังไม่จ่าย</Badge>
                          )}
                        </div>
                        <span className={item.status === 'paid' ? 'text-green-600' : 'text-orange-600'}>
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                  {data.items.length > 1 && (
                    <div className="border-t mt-2 pt-1.5 flex justify-between text-xs">
                      {data.totalPaid > 0 && (
                        <span className="text-green-600">จ่ายแล้ว {formatCurrency(data.totalPaid)}</span>
                      )}
                      {data.totalDue > 0 && (
                        <span className="text-orange-600 ml-auto">ค้าง {formatCurrency(data.totalDue)}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── สรุปรายสมาชิก ── */}
      {memberSummary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">สรุปรายสมาชิก — เดือนนี้</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>สมาชิก</TableHead>
                    <TableHead className="text-right">รายการ</TableHead>
                    <TableHead className="text-right">ยังไม่จ่าย</TableHead>
                    <TableHead className="text-right">จ่ายแล้ว</TableHead>
                    <TableHead className="text-right">คงเหลือทั้งหมด</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memberSummary.map((m: any) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell className="text-right">{m.activeCount}</TableCell>
                      <TableCell className="text-right text-orange-600 font-medium">
                        {formatCurrency(m.thisMonthDue)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatCurrency(m.thisMonthPaid)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatCurrency(m.totalRemaining)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── สรุปรายรับ-รายจ่าย ── */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">สรุปรายเดือน</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">รายรับ</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(dashData?.totalIncome ?? 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">รายจ่าย</span>
              <span className="font-semibold text-red-600">
                {formatCurrency(dashData?.totalExpense ?? 0)}
              </span>
            </div>
            <div className="border-t pt-2 flex justify-between">
              <span className="font-medium">ยอดคงเหลือ</span>
              <span className={`font-bold ${(dashData?.balance ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(dashData?.balance ?? 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">สรุปยอดผ่อนทั้งหมด</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">รายการผ่อนทั้งหมด</span>
              <span className="font-semibold">{installments.length} รายการ</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">กำลังผ่อน</span>
              <span className="font-semibold">{activeInstallments.length} รายการ</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">จ่ายไปแล้ว</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(totalPaidAll)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">เหลืออีก</span>
              <span className="font-semibold text-orange-600">
                {formatCurrency(totalRemainingAll)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── รายรับ-รายจ่าย 6 เดือน ── */}
      {dashData?.chartData && dashData.chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">รายรับ-รายจ่าย 6 เดือนย้อนหลัง</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>เดือน</TableHead>
                    <TableHead className="text-right">รายรับ</TableHead>
                    <TableHead className="text-right">รายจ่าย</TableHead>
                    <TableHead className="text-right">คงเหลือ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashData.chartData.map((d) => (
                    <TableRow key={d.month}>
                      <TableCell>{d.month}</TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatCurrency(d.income)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {formatCurrency(d.expense)}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${
                        d.income - d.expense >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(d.income - d.expense)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── รายละเอียดการผ่อนชำระ ── */}
      {installments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">รายละเอียดการผ่อนชำระ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>รายการ</TableHead>
                    <TableHead>แพลตฟอร์ม</TableHead>
                    <TableHead className="text-right">ยอดรวม</TableHead>
                    <TableHead className="text-center">งวด</TableHead>
                    <TableHead className="text-right">จ่ายแล้ว</TableHead>
                    <TableHead className="text-right">เหลือ</TableHead>
                    <TableHead className="text-center">สถานะ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {installments.map((inst: any) => {
                    const paidAmount = inst.payments
                      ?.filter((p: any) => p.status === 'paid')
                      .reduce((s: number, p: any) => s + Number(p.amountDue), 0) ?? 0
                    const remainAmount = inst.payments
                      ?.filter((p: any) => p.status !== 'paid')
                      .reduce((s: number, p: any) => s + Number(p.amountDue), 0) ?? 0
                    const platform = PLATFORMS.find((p) => p.value === inst.platform)
                    return (
                      <TableRow key={inst.id}>
                        <TableCell className="font-medium">{inst.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {platform ? `${platform.icon} ${platform.label}` : inst.platform}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(inst.totalAmount))}</TableCell>
                        <TableCell className="text-center">{inst.paidInstallments}/{inst.totalInstallments}</TableCell>
                        <TableCell className="text-right text-green-600">{formatCurrency(paidAmount)}</TableCell>
                        <TableCell className="text-right text-orange-600">{formatCurrency(remainAmount)}</TableCell>
                        <TableCell className="text-center">
                          {inst.status === 'completed' ? (
                            <Badge variant="outline" className="text-green-600 border-green-300">เสร็จสิ้น</Badge>
                          ) : (
                            <Badge variant="outline" className="text-blue-600 border-blue-300">กำลังผ่อน</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
