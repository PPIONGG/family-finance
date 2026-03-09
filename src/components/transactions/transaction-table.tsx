'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatShortDate } from '@/lib/utils'
import { deleteTransaction } from '@/actions/transactions'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  description: string
  date: Date | string
  category: { name: string; icon: string }
  creator: { displayName: string }
}

interface TransactionTableProps {
  transactions: Transaction[]
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await deleteTransaction(deleteId)
      toast.success('ลบรายการสำเร็จ')
      router.refresh()
    } catch {
      toast.error('เกิดข้อผิดพลาด')
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">ยังไม่มีรายการ</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-3 px-4 font-medium">วันที่</th>
                  <th className="py-3 px-4 font-medium">รายละเอียด</th>
                  <th className="py-3 px-4 font-medium">หมวดหมู่</th>
                  <th className="py-3 px-4 font-medium">โดย</th>
                  <th className="py-3 px-4 font-medium text-right">จำนวนเงิน</th>
                  <th className="py-3 px-4 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-3 px-4 text-muted-foreground">
                      {formatShortDate(t.date)}
                    </td>
                    <td className="py-3 px-4 font-medium">{t.description}</td>
                    <td className="py-3 px-4">
                      {t.category.icon} {t.category.name}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{t.creator.displayName}</td>
                    <td
                      className={`py-3 px-4 text-right font-semibold ${
                        t.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {t.type === 'income' ? '+' : '-'}
                      {formatCurrency(t.amount)}
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-red-600"
                        onClick={() => setDeleteId(t.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="ลบรายการ"
        description="คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  )
}
