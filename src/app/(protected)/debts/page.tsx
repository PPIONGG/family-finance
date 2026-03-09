import { getDebts } from '@/actions/debts'
import { getFamilyMembers } from '@/actions/family'
import { DebtCard } from '@/components/debts/debt-card'
import { DebtForm } from '@/components/debts/debt-form'

export default async function DebtsPage() {
  const [debts, members] = await Promise.all([getDebts(), getFamilyMembers()])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">หนี้สิน</h1>
        <DebtForm
          members={members.map((m) => ({
            profileId: m.profileId,
            displayName: m.profile.displayName,
          }))}
        />
      </div>

      {debts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">ยังไม่มีรายการหนี้สิน</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {debts.map((debt) => (
            <DebtCard
              key={debt.id}
              debt={{
                id: debt.id,
                creditorName: debt.creditorName,
                totalAmount: Number(debt.totalAmount),
                remainingAmount: Number(debt.remainingAmount),
                interestRate: Number(debt.interestRate),
                minimumPayment: debt.minimumPayment ? Number(debt.minimumPayment) : null,
                dueDate: debt.dueDate,
                status: debt.status,
                debtor: { displayName: debt.debtor.displayName },
                notes: debt.notes,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
