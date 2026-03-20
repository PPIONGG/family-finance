import { getDebts } from '@/actions/debts'
import { getUserGroups } from '@/actions/auth'
import { DebtCard } from '@/components/debts/debt-card'
import { DebtForm } from '@/components/debts/debt-form'

export default async function DebtsPage() {
  const [debts, groups] = await Promise.all([getDebts(), getUserGroups()])

  const isEmpty = debts.length === 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">หนี้สิน</h1>
        <DebtForm groups={groups} />
      </div>

      {isEmpty ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">ยังไม่มีรายการหนี้สิน</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {debts.map((debt: any) => (
            <DebtCard key={debt.id} debt={{
              id: debt.id,
              creditorName: debt.creditorName,
              totalAmount: Number(debt.totalAmount),
              remainingAmount: Number(debt.remainingAmount),
              interestRate: Number(debt.interestRate),
              minimumPayment: debt.minimumPayment ? Number(debt.minimumPayment) : null,
              dueDate: debt.dueDate,
              status: debt.status,
              notes: debt.notes,
            }} />
          ))}
        </div>
      )}
    </div>
  )
}
