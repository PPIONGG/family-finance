/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { InstallmentCard } from './installment-card'
import { PLATFORMS } from '@/constants/platforms'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface InstallmentListProps {
  myInstallments: any[]
  allInstallments: any[]
  currentUserId?: string
}

export function InstallmentList({ myInstallments, allInstallments, currentUserId }: InstallmentListProps) {
  const [showAll, setShowAll] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }
  const otherInstallments = allInstallments.filter(
    (inst) => !myInstallments.some((my) => my.id === inst.id)
  )
  const hasOthers = otherInstallments.length > 0

  // จัดกลุ่มตาม platform
  const grouped = PLATFORMS
    .map((p) => ({
      ...p,
      items: myInstallments.filter((inst: any) => inst.platform === p.value),
    }))
    .filter((g) => g.items.length > 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">รายการของฉัน</h2>
        {hasOthers && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'ซ่อนของคนอื่น' : `ดูของคนอื่น (${otherInstallments.length})`}
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {grouped.map((group) => {
          const isCollapsed = collapsedGroups.has(`my-${group.value}`)
          return (
            <div key={group.value}>
              <button
                type="button"
                className="flex items-center gap-1 text-sm font-medium text-muted-foreground mb-2 hover:text-foreground transition-colors cursor-pointer"
                onClick={() => toggleGroup(`my-${group.value}`)}
              >
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {group.icon} {group.label} ({group.items.length})
              </button>
              {!isCollapsed && (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((installment: any) => (
                    <InstallmentCard key={installment.id} installment={installment} currentUserId={currentUserId} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {showAll && otherInstallments.length > 0 && (
        <div className="mt-6 opacity-70">
          <h2 className="text-lg font-semibold mb-4 text-muted-foreground">รายการของคนอื่น</h2>
          <div className="space-y-4">
            {PLATFORMS
              .map((p) => ({
                ...p,
                items: otherInstallments.filter((inst: any) => inst.platform === p.value),
              }))
              .filter((g) => g.items.length > 0)
              .map((group) => {
                const isCollapsed = collapsedGroups.has(`other-${group.value}`)
                return (
                  <div key={group.value}>
                    <button
                      type="button"
                      className="flex items-center gap-1 text-sm font-medium text-muted-foreground mb-2 hover:text-foreground transition-colors cursor-pointer"
                      onClick={() => toggleGroup(`other-${group.value}`)}
                    >
                      {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      {group.icon} {group.label} ({group.items.length})
                    </button>
                    {!isCollapsed && (
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {group.items.map((installment: any) => (
                          <InstallmentCard key={installment.id} installment={installment} currentUserId={currentUserId} />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}
