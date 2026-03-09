import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getDashboardData } from '@/actions/dashboard'
import { formatCurrency } from '@/lib/utils'
import { getInstallments } from '@/actions/installments'

export default async function ReportsPage() {
  const [dashData, installments] = await Promise.all([
    getDashboardData(),
    getInstallments(),
  ])

  const totalInstallmentPaid = installments.reduce((sum, i) => {
    return sum + Number(i.monthlyPayment) * i.paidInstallments
  }, 0)

  const totalInstallmentRemaining = installments.reduce((sum, i) => {
    return sum + Number(i.monthlyPayment) * (i.totalInstallments - i.paidInstallments)
  }, 0)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">รายงาน</h1>

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
              <span className="font-medium">ยอมคงเหลือ</span>
              <span className={`font-bold ${(dashData?.balance ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(dashData?.balance ?? 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">สรุปยอดผ่อน</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">รายการผ่อนทั้งหมด</span>
              <span className="font-semibold">{installments.length} รายการ</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">จ่ายไปแล้ว</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(totalInstallmentPaid)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">เหลืออีก</span>
              <span className="font-semibold text-orange-600">
                {formatCurrency(totalInstallmentRemaining)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly chart data */}
      {dashData?.chartData && dashData.chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">รายรับ-รายจ่าย 6 เดือนย้อนหลัง</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 px-3 font-medium">เดือน</th>
                    <th className="py-2 px-3 font-medium text-right">รายรับ</th>
                    <th className="py-2 px-3 font-medium text-right">รายจ่าย</th>
                    <th className="py-2 px-3 font-medium text-right">คงเหลือ</th>
                  </tr>
                </thead>
                <tbody>
                  {dashData.chartData.map((d) => (
                    <tr key={d.month} className="border-b last:border-0">
                      <td className="py-2 px-3">{d.month}</td>
                      <td className="py-2 px-3 text-right text-green-600">
                        {formatCurrency(d.income)}
                      </td>
                      <td className="py-2 px-3 text-right text-red-600">
                        {formatCurrency(d.expense)}
                      </td>
                      <td className={`py-2 px-3 text-right font-medium ${
                        d.income - d.expense >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(d.income - d.expense)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Installment breakdown */}
      {installments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">รายละเอียดการผ่อนชำระ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 px-3 font-medium">รายการ</th>
                    <th className="py-2 px-3 font-medium">แพลตฟอร์ม</th>
                    <th className="py-2 px-3 font-medium text-right">ยอดรวม</th>
                    <th className="py-2 px-3 font-medium text-center">งวด</th>
                    <th className="py-2 px-3 font-medium text-right">จ่ายแล้ว</th>
                    <th className="py-2 px-3 font-medium text-right">เหลือ</th>
                  </tr>
                </thead>
                <tbody>
                  {installments.map((inst) => {
                    const paidAmount = Number(inst.monthlyPayment) * inst.paidInstallments
                    const remainAmount = Number(inst.monthlyPayment) * (inst.totalInstallments - inst.paidInstallments)
                    return (
                      <tr key={inst.id} className="border-b last:border-0">
                        <td className="py-2 px-3 font-medium">{inst.name}</td>
                        <td className="py-2 px-3 text-muted-foreground">{inst.platform}</td>
                        <td className="py-2 px-3 text-right">{formatCurrency(Number(inst.totalAmount))}</td>
                        <td className="py-2 px-3 text-center">{inst.paidInstallments}/{inst.totalInstallments}</td>
                        <td className="py-2 px-3 text-right text-green-600">{formatCurrency(paidAmount)}</td>
                        <td className="py-2 px-3 text-right text-orange-600">{formatCurrency(remainAmount)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
