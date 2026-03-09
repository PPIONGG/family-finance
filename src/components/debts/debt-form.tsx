'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { debtSchema, type DebtInput } from '@/lib/validations'
import { createDebt } from '@/actions/debts'
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

interface DebtFormProps {
  members: { profileId: string; displayName: string }[]
}

export function DebtForm({ members }: DebtFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<DebtInput>({
    resolver: zodResolver(debtSchema),
  })

  const onSubmit = async (data: DebtInput) => {
    setLoading(true)
    try {
      await createDebt(data)
      toast.success('เพิ่มรายการหนี้สินสำเร็จ')
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
        เพิ่มหนี้สิน
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>เพิ่มรายการหนี้สินใหม่</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>ชื่อเจ้าหนี้</Label>
            <Input placeholder="เช่น ธนาคาร, บุคคล" {...register('creditorName')} />
            {errors.creditorName && <p className="text-sm text-red-500">{errors.creditorName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>ผู้รับผิดชอบ</Label>
            <Select onValueChange={(v) => setValue('debtorId', v as string)}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกสมาชิก" />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.profileId} value={m.profileId}>
                    {m.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.debtorId && <p className="text-sm text-red-500">{errors.debtorId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>จำนวนเงิน (บาท)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0"
              {...register('totalAmount', { valueAsNumber: true })}
            />
            {errors.totalAmount && <p className="text-sm text-red-500">{errors.totalAmount.message}</p>}
          </div>

          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <Label>ดอกเบี้ย (% ต่อปี)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0"
                {...register('interestRate', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label>จ่ายขั้นต่ำ/เดือน</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0"
                {...register('minimumPayment', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>วันครบกำหนด (ไม่บังคับ)</Label>
            <Input type="date" {...register('dueDate')} />
          </div>

          <div className="space-y-2">
            <Label>หมายเหตุ (ไม่บังคับ)</Label>
            <Input placeholder="รายละเอียดเพิ่มเติม" {...register('notes')} />
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
