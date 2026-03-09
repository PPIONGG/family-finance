'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard } from 'lucide-react'

const schema = z.object({
  email: z.string().email('กรุณากรอกอีเมลที่ถูกต้อง'),
})

type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError(null)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/login`,
    })

    if (resetError) {
      setError(resetError.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <CreditCard className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="text-2xl">ลืมรหัสผ่าน</CardTitle>
        <CardDescription>กรอกอีเมลเพื่อรับลิงก์รีเซ็ตรหัสผ่าน</CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <div className="p-4 rounded-lg bg-green-50 text-green-700 text-sm text-center">
            ส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลของคุณแล้ว กรุณาตรวจสอบอีเมล
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">อีเมล</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'กำลังส่ง...' : 'ส่งลิงก์รีเซ็ต'}
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="text-sm text-center">
        <p className="text-muted-foreground w-full">
          <Link href="/login" className="text-primary hover:underline">
            กลับไปหน้าเข้าสู่ระบบ
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
