import { getSubscriptions, getSubscriptionSummary } from '@/actions/subscriptions'
import { SubscriptionForm } from '@/components/subscriptions/subscription-form'
import { SubscriptionCard } from '@/components/subscriptions/subscription-card'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { SUBSCRIPTION_CATEGORIES } from '@/constants/subscriptions'
import { Tv, TrendingDown } from 'lucide-react'

export default async function SubscriptionsPage() {
  const [subscriptions, summary] = await Promise.all([
    getSubscriptions(),
    getSubscriptionSummary(),
  ])

  // จัดกลุ่มตามหมวดหมู่
  const grouped = SUBSCRIPTION_CATEGORIES
    .map((cat) => ({
      ...cat,
      items: subscriptions.filter((s: { category: string }) => s.category === cat.value),
    }))
    .filter((g) => g.items.length > 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Subscriptions</h1>
          <p className="text-muted-foreground">จัดการค่าบริการรายเดือน/รายปี</p>
        </div>
        <SubscriptionForm />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Tv className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">จำนวน</p>
                <p className="text-xl font-bold">{summary.count} รายการ</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingDown className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ต่อเดือน</p>
                <p className="text-xl font-bold">{formatCurrency(summary.monthlyTotal)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ต่อปี</p>
                <p className="text-xl font-bold">{formatCurrency(summary.yearlyTotal)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription List by Category */}
      {grouped.length > 0 ? (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.value}>
              <h2 className="text-lg font-semibold mb-3">
                {group.icon} {group.label}
              </h2>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {group.items.map((sub: any) => (
                  <SubscriptionCard key={sub.id} subscription={sub} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Tv className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-1">ยังไม่มี Subscription</h3>
            <p className="text-muted-foreground">เพิ่มค่าบริการที่คุณสมัครใช้งาน เช่น Netflix, ChatGPT, Spotify</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
