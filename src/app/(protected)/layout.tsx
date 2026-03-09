import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/actions/auth'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { Toaster } from '@/components/ui/sonner'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const userData = await getCurrentUser()

  if (!userData) {
    redirect('/login')
  }

  const { user, profile } = userData

  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar />
      <div className="md:pl-64">
        <Header
          user={{
            email: user.email,
            displayName: profile?.displayName || user.user_metadata?.display_name,
          }}
        />
        <main className="p-4 md:p-6 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
      <Toaster position="top-right" richColors />
    </div>
  )
}
