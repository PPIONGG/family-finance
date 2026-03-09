import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, Wallet, CreditCard, Landmark } from 'lucide-react'

interface SummaryCardsProps {
  totalIncome: number
  totalExpense: number
  balance: number
  totalInstallmentDue: number
  totalDebtRemaining: number
}

export function SummaryCards({
  totalIncome,
  totalExpense,
  balance,
  totalInstallmentDue,
  totalDebtRemaining,
}: SummaryCardsProps) {
  const cards = [
    {
      title: 'รายรับเดือนนี้',
      value: totalIncome,
      icon: TrendingUp,
      className: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'รายจ่ายเดือนนี้',
      value: totalExpense,
      icon: TrendingDown,
      className: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      title: 'ยอดคงเหลือ',
      value: balance,
      icon: Wallet,
      className: balance >= 0 ? 'text-green-600' : 'text-red-600',
      bg: balance >= 0 ? 'bg-green-50' : 'bg-red-50',
    },
    {
      title: 'ยอดผ่อนเดือนนี้',
      value: totalInstallmentDue,
      icon: CreditCard,
      className: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'หนี้สินคงเหลือ',
      value: totalDebtRemaining,
      icon: Landmark,
      className: 'text-orange-600',
      bg: 'bg-orange-50',
    },
  ]

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${card.bg}`}>
              <card.icon className={`h-4 w-4 ${card.className}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-lg font-bold ${card.className}`}>
              {formatCurrency(card.value)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
