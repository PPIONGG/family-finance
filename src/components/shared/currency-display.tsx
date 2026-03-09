import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface CurrencyDisplayProps {
  amount: number
  className?: string
  type?: 'income' | 'expense' | 'neutral'
}

export function CurrencyDisplay({ amount, className, type = 'neutral' }: CurrencyDisplayProps) {
  return (
    <span
      className={cn(
        'font-semibold',
        type === 'income' && 'text-green-600',
        type === 'expense' && 'text-red-600',
        className
      )}
    >
      {type === 'income' && '+'}
      {type === 'expense' && '-'}
      {formatCurrency(Math.abs(amount))}
    </span>
  )
}
