import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-6xl font-bold">404</h1>
      <h2 className="text-xl font-semibold">ไม่พบหน้าที่ต้องการ</h2>
      <p className="text-muted-foreground">หน้าที่คุณกำลังมองหาไม่มีอยู่หรือถูกย้ายแล้ว</p>
      <Button render={<Link href="/installments" />}>
        กลับหน้าหลัก
      </Button>
    </div>
  );
}
