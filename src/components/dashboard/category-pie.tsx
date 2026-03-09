'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface CategoryPieProps {
  data: { name: string; value: number; color: string; icon: string }[]
}

export function CategoryPie({ data }: CategoryPieProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ค่าใช้จ่ายตามหมวดหมู่</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            ยังไม่มีข้อมูลค่าใช้จ่ายเดือนนี้
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">ค่าใช้จ่ายตามหมวดหมู่</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] flex items-center">
          <ResponsiveContainer width="60%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1 space-y-2">
            {data.slice(0, 5).map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-sm">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate">{item.icon} {item.name}</span>
                <span className="ml-auto text-muted-foreground font-medium">
                  {formatCurrency(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
