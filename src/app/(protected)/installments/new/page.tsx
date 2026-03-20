import { InstallmentForm } from '@/components/installments/installment-form'
import { getUserGroups, getActiveGroup } from '@/actions/auth'
import { getGroupMembers } from '@/actions/family'

export default async function NewInstallmentPage() {
  const [groups, activeGroup] = await Promise.all([getUserGroups(), getActiveGroup()])

  const members = activeGroup
    ? await getGroupMembers(activeGroup.id)
    : []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">เพิ่มรายการผ่อนชำระ</h1>
      <InstallmentForm
        groups={groups}
        activeGroupId={activeGroup?.id ?? null}
        members={members.map((m) => ({
          profileId: m.profileId,
          displayName: m.profile.displayName,
          nickname: m.nickname,
        }))}
      />
    </div>
  )
}
