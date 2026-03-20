'use client'

import { useState } from 'react'
import { InstallmentCard } from './installment-card'
import { PLATFORMS } from '@/constants/platforms'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface Installment {
  id: string
  name: string
  platform: string
  monthlyPayment: unknown
  totalInstallments: number
  paidInstallments: number
  status: string
  createdBy?: string
  splits?: { profileId: string; amountPerMonth: unknown }[]
  payments?: { id: string; dueDate: string | Date; status: string; amountDue: unknown }[]
}

interface InstallmentListProps {
  installments: Installment[]
  currentUserId?: string
}

export function InstallmentList({ installments, currentUserId }: InstallmentListProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // จัดกลุ่มตาม platform
  const grouped = PLATFORMS
    .map((p) => ({
      ...p,
      items: installments.filter((inst) => inst.platform === p.value),
    }))
    .filter((g) => g.items.length > 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">รายการของฉัน</h2>
      </div>

      <div className="space-y-4">
        {grouped.map((group) => {
          const isCollapsed = collapsedGroups.has(group.value)
          return (
            <div key={group.value}>
              <button
                type="button"
                className="flex items-center gap-1 text-sm font-medium text-muted-foreground mb-2 hover:text-foreground transition-colors cursor-pointer"
                onClick={() => toggleGroup(group.value)}
              >
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {group.icon} {group.label} ({group.items.length})
              </button>
              {!isCollapsed && (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((installment) => (
                    <InstallmentCard key={installment.id} installment={installment} currentUserId={currentUserId} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
