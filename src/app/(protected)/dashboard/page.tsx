import { getDashboardData } from '@/actions/dashboard'
import { getUserFamilyGroup } from '@/actions/auth'
import { SummaryCards } from '@/components/dashboard/summary-cards'
import { MonthlyChart } from '@/components/dashboard/monthly-chart'
import { CategoryPie } from '@/components/dashboard/category-pie'
import { UpcomingPayments } from '@/components/dashboard/upcoming-payments'
import { SetupPrompt } from '@/components/dashboard/setup-prompt'

export default async function DashboardPage() {
  const group = await getUserFamilyGroup()

  if (!group) {
    return <SetupPrompt />
  }

  const data = await getDashboardData()
  if (!data) return <SetupPrompt />

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">แดชบอร์ด</h1>

      <SummaryCards
        totalIncome={data.totalIncome}
        totalExpense={data.totalExpense}
        balance={data.balance}
        totalInstallmentDue={data.totalInstallmentDue}
        totalDebtRemaining={data.totalDebtRemaining}
      />

      {data.overduePayments.length > 0 && (
        <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
          <h3 className="font-semibold text-orange-700 mb-2">
            แจ้งเตือน: งวดที่เลยกำหนดชำระ ({data.overduePayments.length} รายการ)
          </h3>
          <ul className="space-y-1 text-sm text-orange-600">
            {data.overduePayments.map((p) => (
              <li key={p.id}>
                {p.installmentName} ({p.platform}) - เลยกำหนด {p.daysOverdue} วัน
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <MonthlyChart data={data.chartData} />
        <CategoryPie data={data.categoryData} />
      </div>

      <UpcomingPayments payments={data.upcomingPayments} />
    </div>
  )
}
