'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ArrowLeftRight,
  CreditCard,
  BarChart3,
  Settings,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard },
  { href: '/transactions', label: 'รายรับ-รายจ่าย', icon: ArrowLeftRight },
  { href: '/installments', label: 'การผ่อนชำระ', icon: CreditCard },
  { href: '/reports', label: 'รายงาน', icon: BarChart3 },
  { href: '/settings', label: 'ตั้งค่า', icon: Settings },
]

export function Sidebar({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r bg-card">
      <div className="flex items-center h-16 px-6 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">Family Finance</span>
        </Link>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      {children && <div className="pb-4">{children}</div>}
    </aside>
  )
}
