'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface MonthlyChartProps {
  data: { month: string; income: number; expense: number }[]
}

const MONTH_NAMES: Record<string, string> = {
  '01': 'ม.ค.', '02': 'ก.พ.', '03': 'มี.ค.', '04': 'เม.ย.',
  '05': 'พ.ค.', '06': 'มิ.ย.', '07': 'ก.ค.', '08': 'ส.ค.',
  '09': 'ก.ย.', '10': 'ต.ค.', '11': 'พ.ย.', '12': 'ธ.ค.',
}

function formatMonth(month: string) {
  const parts = month.split('-')
  return MONTH_NAMES[parts[1]] || month
}

export function MonthlyChart({ data }: MonthlyChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    name: formatMonth(d.month),
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">รายรับ-รายจ่ายรายเดือน</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] min-w-0">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value))}
                labelStyle={{ color: '#333' }}
              />
              <Legend />
              <Bar dataKey="income" name="รายรับ" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="รายจ่าย" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
