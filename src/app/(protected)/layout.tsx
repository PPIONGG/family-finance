import { redirect } from 'next/navigation'
import { getCurrentUser, getUserGroups } from '@/actions/auth'
import { getActiveGroupId } from '@/lib/active-group'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { Toaster } from '@/components/ui/sonner'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [userData, groups, activeGroupId] = await Promise.all([
    getCurrentUser(),
    getUserGroups(),
    getActiveGroupId(),
  ])

  if (!userData) {
    redirect('/login')
  }

  const { user, profile } = userData

  // ตรวจสอบว่า activeGroupId ยังอยู่ในกลุ่มที่ user เป็นสมาชิกจริง
  const validActiveGroupId = groups.some((g) => g.id === activeGroupId)
    ? activeGroupId
    : null

  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar groups={groups} activeGroupId={validActiveGroupId} />
      <div className="md:pl-64">
        <Header
          user={{
            email: user.email,
            displayName: profile?.displayName || user.user_metadata?.display_name,
          }}
          groups={groups}
          activeGroupId={validActiveGroupId}
        />
        <main className="p-4 md:p-6 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
      <Toaster position="top-right" richColors />
    </div>
  )
}
