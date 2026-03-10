'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createFamilyGroup, joinFamilyGroup } from '@/actions/auth'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function SetupPrompt({ compact = false }: { compact?: boolean }) {
  const router = useRouter()
  const [groupName, setGroupName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!groupName.trim()) return
    setLoading(true)
    setError(null)
    try {
      await createFamilyGroup(groupName)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!inviteCode.trim()) return
    setLoading(true)
    setError(null)
    try {
      await joinFamilyGroup(inviteCode)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={compact ? '' : 'flex items-center justify-center min-h-[60vh]'}>
      <Card className={compact ? 'border-0 shadow-none' : 'w-full max-w-md'}>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">ยินดีต้อนรับ!</CardTitle>
          <CardDescription>
            สร้างกลุ่มครอบครัวใหม่ หรือเข้าร่วมกลุ่มที่มีอยู่
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}
          <Tabs defaultValue="create">
            <TabsList className="w-full">
              <TabsTrigger value="create" className="flex-1">สร้างกลุ่มใหม่</TabsTrigger>
              <TabsTrigger value="join" className="flex-1">เข้าร่วมกลุ่ม</TabsTrigger>
            </TabsList>
            <TabsContent value="create" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>ชื่อกลุ่มครอบครัว</Label>
                <Input
                  placeholder="เช่น ครอบครัวสุขสันต์"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </div>
              <Button className="w-full" onClick={handleCreate} disabled={loading}>
                {loading ? 'กำลังสร้าง...' : 'สร้างกลุ่ม'}
              </Button>
            </TabsContent>
            <TabsContent value="join" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>รหัสเชิญ</Label>
                <Input
                  placeholder="กรอกรหัสเชิญ 6 หลัก"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  maxLength={6}
                />
              </div>
              <Button className="w-full" onClick={handleJoin} disabled={loading}>
                {loading ? 'กำลังเข้าร่วม...' : 'เข้าร่วมกลุ่ม'}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
