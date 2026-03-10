'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { PayPlatformButton } from './pay-platform-button'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface PlatformRowProps {
  label: string
  icon: string
  paid: number
  unpaid: number
  overdue: number
  count: number
  unpaidPaymentIds: string[]
  items: { name: string; amount: number; paid: boolean }[]
}

export function PlatformRow({ label, icon, paid, unpaid, overdue, count, unpaidPaymentIds, items }: PlatformRowProps) {
  const [expanded, setExpanded] = useState(false)
  const allPaid = unpaid === 0 && overdue === 0 && paid > 0
  const platformTotal = paid + unpaid

  return (
    <div className="border-b last:border-0">
      <div className="flex items-center justify-between py-2">
        <button
          type="button"
          className="flex items-center gap-3 hover:opacity-70 transition-opacity"
          onClick={() => setExpanded(!expanded)}
        >
          <span className="text-xl">{icon}</span>
          <div className="text-left">
            <p className="font-medium text-sm">{label}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {count} รายการ
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </p>
          </div>
        </button>
        <div className="flex items-center gap-3">
          <div className="text-right">
            {allPaid ? (
              <p className="font-bold text-green-600">✓ จ่ายแล้ว {formatCurrency(platformTotal)}</p>
            ) : (
              <>
                {overdue > 0 && (
                  <p className="font-bold text-red-600">ค้างชำระ {formatCurrency(overdue)}</p>
                )}
                {unpaid > 0 && (
                  <p className="font-bold text-orange-600">{formatCurrency(unpaid)}</p>
                )}
                {paid > 0 && (
                  <p className="text-xs text-green-600">จ่ายแล้ว {formatCurrency(paid)}</p>
                )}
              </>
            )}
          </div>
          {!allPaid && unpaidPaymentIds.length > 0 && (
            <PayPlatformButton
              platformLabel={label}
              paymentIds={unpaidPaymentIds}
              totalAmount={unpaid + overdue}
            />
          )}
        </div>
      </div>

      {/* รายการย่อย */}
      {expanded && (
        <div className="pb-2 pl-12 space-y-1">
          {items.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-xs py-0.5">
              <span className="text-muted-foreground">{item.name}</span>
              <span className={item.paid ? 'text-green-600' : 'text-orange-600'}>
                {item.paid ? '✓ ' : ''}{formatCurrency(item.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
