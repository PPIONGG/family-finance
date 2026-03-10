'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { subscriptionSchema, type SubscriptionInput } from '@/lib/validations'
import { createSubscription } from '@/actions/subscriptions'
import { BILLING_CYCLES, POPULAR_SERVICES } from '@/constants/subscriptions'
import { ServiceIcon } from './service-icon'
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

export function SubscriptionForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPresets, setShowPresets] = useState(true)

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<SubscriptionInput>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      category: 'other',
      billingCycle: 'monthly',
      autoRenew: true,
    },
  })

  const selectPreset = (service: typeof POPULAR_SERVICES[number]) => {
    setValue('name', service.name)
    setValue('category', service.category)
    setValue('amount', service.amount)
    setValue('billingCycle', service.billingCycle)
    setShowPresets(false)
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      reset()
      setShowPresets(true)
    }
  }

  const onSubmit = async (data: SubscriptionInput) => {
    setLoading(true)
    try {
      await createSubscription(data)
      toast.success('เพิ่ม Subscription สำเร็จ')
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4 mr-2" />
        เพิ่ม Subscription
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>เพิ่ม Subscription ใหม่</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Quick presets */}
          {showPresets ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>เลือกบริการ</Label>
                <button
                  type="button"
                  className="text-xs text-blue-600 hover:underline"
                  onClick={() => setShowPresets(false)}
                >
                  กรอกเอง
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2 max-h-52 overflow-y-auto pr-1">
                {POPULAR_SERVICES.map((service) => (
                  <button
                    key={service.name}
                    type="button"
                    className="flex flex-col items-center gap-1 p-2 rounded-lg border hover:bg-accent transition-colors text-center"
                    onClick={() => selectPreset(service)}
                  >
                    <ServiceIcon name={service.name} size="sm" />
                    <span className="text-[10px] leading-tight text-muted-foreground line-clamp-2">
                      {service.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>ชื่อบริการ</Label>
                <button
                  type="button"
                  className="text-xs text-blue-600 hover:underline"
                  onClick={() => setShowPresets(true)}
                >
                  เลือกจากรายการ
                </button>
              </div>
              <Input placeholder="เช่น Netflix, ChatGPT Plus" {...register('name')} />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>
          )}

          {/* Hidden category field - auto-filled */}
          <input type="hidden" {...register('category')} />

          <div className="grid gap-4 grid-cols-2">
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
              <Label>รอบการจ่าย</Label>
              <Select defaultValue="monthly" onValueChange={(v) => setValue('billingCycle', v as 'monthly' | 'yearly')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BILLING_CYCLES.map((cycle) => (
                    <SelectItem key={cycle.value} value={cycle.value}>
                      {cycle.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <Label>วันตัดจ่าย (1-31)</Label>
              <Input
                type="number"
                min={1}
                max={31}
                placeholder="1"
                {...register('billingDay', { valueAsNumber: true })}
              />
              {errors.billingDay && <p className="text-sm text-red-500">{errors.billingDay.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>วันที่เริ่มใช้งาน</Label>
              <Input type="date" {...register('startDate')} />
              {errors.startDate && <p className="text-sm text-red-500">{errors.startDate.message}</p>}
            </div>
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
