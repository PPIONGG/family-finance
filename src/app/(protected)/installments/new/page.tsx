import { InstallmentForm } from '@/components/installments/installment-form'
import { getFamilyMembers } from '@/actions/family'

export default async function NewInstallmentPage() {
  const members = await getFamilyMembers()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">เพิ่มรายการผ่อนชำระ</h1>
      <InstallmentForm
        members={members.map((m) => ({
          profileId: m.profileId,
          displayName: m.profile.displayName,
          nickname: m.nickname,
        }))}
      />
    </div>
  )
}
