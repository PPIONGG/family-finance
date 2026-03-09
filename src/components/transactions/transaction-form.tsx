'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { transactionSchema, type TransactionInput } from '@/lib/validations'
import { createTransaction } from '@/actions/transactions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

interface TransactionFormProps {
  categories: { id: string; name: string; icon: string }[]
}

export function TransactionForm({ categories }: TransactionFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TransactionInput>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'expense',
      date: new Date().toISOString().split('T')[0],
    },
  })

  const onSubmit = async (data: TransactionInput) => {
    setLoading(true)
    try {
      await createTransaction(data)
      toast.success('บันทึกรายการสำเร็จ')
      reset()
      setOpen(false)
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4 mr-2" />
        เพิ่มรายการ
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>เพิ่มรายการใหม่</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>ประเภท</Label>
            <Select defaultValue="expense" onValueChange={(v) => setValue('type', String(v) as 'income' | 'expense')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">รายจ่าย</SelectItem>
                <SelectItem value="income">รายรับ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>จำนวนเงิน (บาท)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0"
              {...register('amount', { valueAsNumber: true })}
            />
            {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>รายละเอียด</Label>
            <Input placeholder="เช่น ค่าอาหารกลางวัน" {...register('description')} />
            {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>หมวดหมู่</Label>
            <Select onValueChange={(v) => setValue('categoryId', v as string)}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกหมวดหมู่" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && <p className="text-sm text-red-500">{errors.categoryId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>วันที่</Label>
            <Input type="date" {...register('date')} />
            {errors.date && <p className="text-sm text-red-500">{errors.date.message}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              ยกเลิก
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
