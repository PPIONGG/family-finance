'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { installmentSchema, type InstallmentInput } from '@/lib/validations'
import { calculateInstallment } from '@/lib/calculations'
import { createInstallment } from '@/actions/installments'
import { PLATFORMS } from '@/constants/platforms'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DateInput } from '@/components/ui/date-input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency, formatShortDate } from '@/lib/utils'
import { SplitConfig } from './split-config'
import { toast } from 'sonner'
import type { InterestType, SplitType } from '@/types'

const INTEREST_TYPE_LABELS: Record<string, string> = {
  none: 'ไม่มีดอกเบี้ย',
  flat: 'Flat Rate',
  reducing: 'ลดต้นลดดอก (รายเดือน)',
  reducing_daily: 'ลดต้นลดดอก (รายวัน)',
}

interface Group {
  id: string
  name: string
}

interface InstallmentFormProps {
  groups: Group[]
  activeGroupId: string | null
  members: { profileId: string; displayName: string; nickname: string }[]
}

export function InstallmentForm({ groups, activeGroupId, members }: InstallmentFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(activeGroupId)
  const [principalRaw, setPrincipalRaw] = useState('')
  const [interestRaw, setInterestRaw] = useState('')
  const [splitMode, setSplitMode] = useState<'solo' | 'shared'>('solo')
  const [soloOwner, setSoloOwner] = useState<string>(members[0]?.profileId ?? '')
  const [splits, setSplits] = useState<
    { profileId: string; splitType: SplitType; splitValue?: number }[]
  >(members.map((m) => ({ profileId: m.profileId, splitType: 'equal' })))

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InstallmentInput>({
    resolver: zodResolver(installmentSchema),
    defaultValues: {
      interestType: 'none',
      interestRate: 0,
      dueDay: 1,
    },
  })

  const principalAmount = watch('principalAmount')
  const totalInstallments = watch('totalInstallments')
  const interestRate = watch('interestRate')
  const interestType = watch('interestType') as InterestType
  const startDate = watch('startDate')
  const dueDay = watch('dueDay')
  const monthlyPayment = watch('monthlyPayment')
  const platform = watch('platform')
  const shopeeTotalPayment = watch('shopeeTotalPayment')
  const shopeeTotalInterest = watch('shopeeTotalInterest')
  const shopeeFirstPayDate = watch('shopeeFirstPayDate')

  const isShopee = platform === 'shopee' || platform === 'shopee_cash'
  const hasShopeeData = isShopee && monthlyPayment && shopeeTotalPayment && shopeeTotalInterest != null

  // Auto-calculate
  const calc = useMemo(
    () => {
      if (!(principalAmount > 0 && totalInstallments > 0)) return null

      // Shopee: ใช้ค่าที่ user กรอกตรงๆ
      if (hasShopeeData) {
        const lastPayment = Math.round((shopeeTotalPayment - monthlyPayment * (totalInstallments - 1)) * 100) / 100
        return {
          totalInterest: shopeeTotalInterest,
          totalAmount: shopeeTotalPayment,
          monthlyPayment: monthlyPayment,
          lastPayment,
        }
      }

      return calculateInstallment(
        principalAmount,
        interestRate || 0,
        totalInstallments,
        interestType,
        startDate ? new Date(startDate) : undefined,
        dueDay || undefined,
        monthlyPayment || undefined,
      )
    },
    [principalAmount, totalInstallments, interestRate, interestType, startDate, dueDay, monthlyPayment, hasShopeeData, shopeeTotalPayment, shopeeTotalInterest]
  )

  const onSubmit = async (data: InstallmentInput) => {
    setLoading(true)
    try {
      await createInstallment({
        ...data,
        groupId: selectedGroupId,
        interestType: data.interestType as InterestType,
        splits: splitMode === 'shared'
          ? splits
          : [{ profileId: soloOwner, splitType: 'equal' as const }],
      })
      toast.success('สร้างรายการผ่อนสำเร็จ')
      router.push('/installments')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Group selector — แสดงเมื่อ user มีกลุ่ม */}
      {groups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">เพิ่มเข้ากลุ่ม</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedGroupId ?? '__personal__'}
              onValueChange={(v) => setSelectedGroupId(v === '__personal__' ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกกลุ่ม" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__personal__">ส่วนตัว (ไม่ผูกกลุ่ม)</SelectItem>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">ข้อมูลสินค้า</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>ชื่อสินค้า</Label>
              <Input placeholder="เช่น ตู้เย็น Samsung" {...register('name')} />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>แพลตฟอร์ม</Label>
              <Select onValueChange={(v) => {
                setValue('platform', v as string)
                if (v === 'shopee' || v === 'shopee_cash') setValue('interestType', 'reducing_daily')
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกแพลตฟอร์ม" />
                </SelectTrigger>
                <SelectContent className="min-w-56">
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.icon} {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.platform && <p className="text-sm text-red-500">{errors.platform.message}</p>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>ราคาสินค้า (บาท)</Label>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={principalRaw}
                onChange={(e) => {
                  // ลบ comma และอักขระที่ไม่ใช่ตัวเลข/จุด
                  const raw = e.target.value.replace(/,/g, '').replace(/[^0-9.]/g, '')
                  const parts = raw.split('.')
                  const cleaned = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : raw
                  // format comma เฉพาะส่วนจำนวนเต็ม
                  const [intPart, decPart] = cleaned.split('.')
                  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                  setPrincipalRaw(decPart !== undefined ? `${formatted}.${decPart}` : formatted)
                  const num = parseFloat(cleaned)
                  setValue('principalAmount', isNaN(num) ? 0 : num)
                }}
              />
              {errors.principalAmount && (
                <p className="text-sm text-red-500">{errors.principalAmount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>จำนวนงวด</Label>
              <Input
                type="number"
                placeholder="0"
                {...register('totalInstallments', { valueAsNumber: true })}
              />
              {errors.totalInstallments && (
                <p className="text-sm text-red-500">{errors.totalInstallments.message}</p>
              )}
            </div>

          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>ประเภทดอกเบี้ย</Label>
              <Select
                value={interestType}
                onValueChange={(v) => setValue('interestType', String(v) as InterestType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกประเภท">
                    {INTEREST_TYPE_LABELS[interestType] ?? 'เลือกประเภท'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ไม่มีดอกเบี้ย</SelectItem>
                  <SelectItem value="flat">Flat Rate</SelectItem>
                  <SelectItem value="reducing">ลดต้นลดดอก (รายเดือน)</SelectItem>
                  <SelectItem value="reducing_daily">ลดต้นลดดอก (รายวัน)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {interestType !== 'none' && (
            <div className="space-y-2 max-w-xs">
              <Label>อัตราดอกเบี้ย (% ต่อปี)</Label>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={interestRaw}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9.]/g, '')
                  const parts = raw.split('.')
                  const cleaned = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : raw
                  setInterestRaw(cleaned)
                  const num = parseFloat(cleaned)
                  setValue('interestRate', isNaN(num) ? 0 : num)
                }}
              />
            </div>
          )}

          {/* Shopee: กรอกค่าจาก SEasyCash ตรงๆ */}
          {isShopee && (
            <div className="rounded-lg border border-orange-200 bg-orange-50/50 p-4 space-y-4">
              <p className="text-sm font-medium text-orange-700">ข้อมูลจาก Shopee SEasyCash</p>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>ยอดชำระต่องวด (บาท)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="เช่น 2,603.59"
                    {...register('monthlyPayment', { setValueAs: (v: string) => v === '' ? undefined : parseFloat(v) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>รวมยอดชำระรายเดือน (บาท)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="เช่น 5,181.10"
                    {...register('shopeeTotalPayment', { setValueAs: (v: string) => v === '' ? undefined : parseFloat(v) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>รวมดอกเบี้ยถึงกำหนดชำระ (บาท)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="เช่น 181.10"
                    {...register('shopeeTotalInterest', { setValueAs: (v: string) => v === '' ? undefined : parseFloat(v) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>วันชำระงวดแรก</Label>
                  <DateInput
                    value={shopeeFirstPayDate}
                    onChange={(v) => setValue('shopeeFirstPayDate', v)}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                ไม่บังคับ — ถ้ามีข้อมูลจาก SEasyCash ให้กรอกทั้ง 3 ช่อง ระบบจะใช้ค่าที่กรอกแทนการคำนวณ ถ้าไม่กรอกจะใช้สูตรคำนวณให้อัตโนมัติ
              </p>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>วันที่เริ่มคิดดอกเบี้ย</Label>
              <DateInput
                value={startDate}
                onChange={(v) => setValue('startDate', v)}
              />
              {errors.startDate && (
                <p className="text-sm text-red-500">{errors.startDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>วันครบกำหนดของทุกเดือน</Label>
              <Input
                type="number"
                min={1}
                max={31}
                placeholder="เช่น 15"
                {...register('dueDay', { valueAsNumber: true })}
              />
              {errors.dueDay && <p className="text-sm text-red-500">{errors.dueDay.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>หมายเหตุ (ไม่บังคับ)</Label>
            <Input placeholder="เช่น สีเทา รุ่น RT-xxx" {...register('notes')} />
          </div>
        </CardContent>
      </Card>

      {/* Auto-calculate summary */}
      {calc && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-base text-blue-700">สรุปการคำนวณ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">ราคาสินค้า</p>
                <p className="font-semibold">{formatCurrency(principalAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">ดอกเบี้ยรวม</p>
                <p className="font-semibold text-orange-600">{formatCurrency(calc.totalInterest)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">ยอดรวมทั้งหมด</p>
                <p className="font-semibold">{formatCurrency(calc.totalAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {'lastPayment' in calc || 'schedule' in calc
                    ? `งวดที่ 1${totalInstallments > 2 ? '-' + (totalInstallments - 1) : ''}`
                    : 'งวดละ'}
                </p>
                <p className="font-bold text-lg text-blue-600">
                  {formatCurrency(calc.monthlyPayment)}
                </p>
              </div>

              {/* แสดงงวดสุดท้าย ถ้าต่างจากงวดอื่น */}
              {'lastPayment' in calc && (
                <div>
                  <p className="text-xs text-muted-foreground">งวดสุดท้าย</p>
                  <p className="font-bold text-lg text-blue-600">
                    {formatCurrency((calc as { lastPayment: number }).lastPayment)}
                  </p>
                </div>
              )}

              {/* วันเริ่มจ่ายงวดแรก */}
              {shopeeFirstPayDate ? (
                <div>
                  <p className="text-xs text-muted-foreground">งวดแรก</p>
                  <p className="font-semibold">{formatShortDate(shopeeFirstPayDate)}</p>
                </div>
              ) : 'schedule' in calc && (calc as any).schedule?.[0]?.dueDate ? (
                <div>
                  <p className="text-xs text-muted-foreground">งวดแรก</p>
                  <p className="font-semibold">{formatShortDate((calc as any).schedule[0].dueDate)}</p>
                </div>
              ) : startDate && dueDay ? (
                <div>
                  <p className="text-xs text-muted-foreground">งวดแรก</p>
                  <p className="font-semibold">{(() => {
                    const sd = new Date(startDate)
                    let m = sd.getMonth() + 1
                    while (Math.round((new Date(sd.getFullYear(), m, dueDay).getTime() - sd.getTime()) / 86400000) < 25) m++
                    return formatShortDate(new Date(sd.getFullYear(), m, dueDay))
                  })()}</p>
                </div>
              ) : null}
            </div>

            {/* ตารางแต่ละงวด สำหรับ reducing_daily (ไม่ใช่ Shopee manual) */}
            {'schedule' in calc && Boolean((calc as Record<string, unknown>).schedule) && (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-blue-100/50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">งวด</th>
                      <th className="px-3 py-2 text-left font-medium">วันครบกำหนด</th>
                      <th className="px-3 py-2 text-right font-medium">ยอดชำระ</th>
                      <th className="px-3 py-2 text-right font-medium">ดอกเบี้ย</th>
                      <th className="px-3 py-2 text-right font-medium">เงินต้น</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(calc.schedule as { installmentNumber: number; dueDate: Date; totalPayment: number; interest: number; principalPortion: number }[]).map((s) => (
                      <tr key={s.installmentNumber} className="border-t">
                        <td className="px-3 py-1.5">{s.installmentNumber}</td>
                        <td className="px-3 py-1.5">{formatShortDate(s.dueDate)}</td>
                        <td className="px-3 py-1.5 text-right">{formatCurrency(s.totalPayment)}</td>
                        <td className="px-3 py-1.5 text-right text-orange-600">{formatCurrency(s.interest)}</td>
                        <td className="px-3 py-1.5 text-right">{formatCurrency(s.principalPortion)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Split Config */}
      {calc && members.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">การหารค่าผ่อน</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Button
                type="button"
                variant={splitMode === 'solo' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSplitMode('solo')}
              >
                ผ่อนคนเดียว
              </Button>
              <Button
                type="button"
                variant={splitMode === 'shared' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSplitMode('shared')}
              >
                ผ่อนร่วม
              </Button>
            </div>
            {splitMode === 'solo' && (
              <div className="flex items-center gap-3">
                <Label className="text-sm whitespace-nowrap">ผู้รับผิดชอบ</Label>
                <Select value={soloOwner} onValueChange={(v) => v && setSoloOwner(v)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue>
                      {members.find((m) => m.profileId === soloOwner)?.nickname ||
                       members.find((m) => m.profileId === soloOwner)?.displayName}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.profileId} value={m.profileId}>
                        {m.nickname || m.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {splitMode === 'shared' && (
              <SplitConfig
                members={members}
                monthlyPayment={calc.monthlyPayment}
                splits={splits}
                onSplitsChange={setSplits}
              />
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          ยกเลิก
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'กำลังบันทึก...' : 'บันทึกรายการผ่อน'}
        </Button>
      </div>
    </form>
  )
}
