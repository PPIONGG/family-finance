'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { registerSchema, type RegisterInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true)
    setError(null)

    const { error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          display_name: data.displayName,
        },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <CreditCard className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="text-2xl">สมัครสมาชิก</CardTitle>
        <CardDescription>สร้างบัญชีเพื่อใช้งาน Family Finance</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="displayName">ชื่อที่แสดง</Label>
            <Input
              id="displayName"
              placeholder="เช่น สมชาย"
              {...registerField('displayName')}
            />
            {errors.displayName && (
              <p className="text-sm text-red-500">{errors.displayName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">อีเมล</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              {...registerField('email')}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">รหัสผ่าน</Label>
            <Input
              id="password"
              type="password"
              placeholder="อย่างน้อย 6 ตัวอักษร"
              {...registerField('password')}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">ยืนยันรหัสผ่าน</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="กรอกรหัสผ่านอีกครั้ง"
              {...registerField('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="text-sm text-center">
        <p className="text-muted-foreground w-full">
          มีบัญชีแล้ว?{' '}
          <Link href="/login" className="text-primary hover:underline">
            เข้าสู่ระบบ
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
