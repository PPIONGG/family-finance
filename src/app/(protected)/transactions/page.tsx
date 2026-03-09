import { getTransactions, getCategories } from '@/actions/transactions'
import { TransactionTable } from '@/components/transactions/transaction-table'
import { TransactionForm } from '@/components/transactions/transaction-form'
import { getFamilyMembers } from '@/actions/family'

export default async function TransactionsPage() {
  const [transactions, categories, members] = await Promise.all([
    getTransactions(),
    getCategories(),
    getFamilyMembers(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">รายรับ-รายจ่าย</h1>
        <TransactionForm
          categories={categories.map((c) => ({
            id: c.id,
            name: c.name,
            icon: c.icon,
          }))}
        />
      </div>

      <TransactionTable
        transactions={transactions.map((t) => ({
          id: t.id,
          type: t.type as 'income' | 'expense',
          amount: Number(t.amount),
          description: t.description,
          date: t.date,
          category: { name: t.category.name, icon: t.category.icon },
          creator: { displayName: t.creator.displayName },
        }))}
      />
    </div>
  )
}
