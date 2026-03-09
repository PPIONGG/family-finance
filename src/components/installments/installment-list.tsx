'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { InstallmentCard } from './installment-card'

interface InstallmentListProps {
  myInstallments: any[]
  allInstallments: any[]
  currentUserId?: string
}

export function InstallmentList({ myInstallments, allInstallments, currentUserId }: InstallmentListProps) {
  const [showAll, setShowAll] = useState(false)
  const otherInstallments = allInstallments.filter(
    (inst) => !myInstallments.some((my) => my.id === inst.id)
  )
  const hasOthers = otherInstallments.length > 0

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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {myInstallments.map((installment: any) => (
          <InstallmentCard key={installment.id} installment={installment} currentUserId={currentUserId} />
        ))}
      </div>

      {showAll && otherInstallments.length > 0 && (
        <>
          <h2 className="text-lg font-semibold mt-6 mb-4 text-muted-foreground">รายการของคนอื่น</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 opacity-70">
            {otherInstallments.map((installment: any) => (
              <InstallmentCard key={installment.id} installment={installment} currentUserId={currentUserId} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
