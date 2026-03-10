import { getCurrentUser } from '@/actions/auth'
import { getFamilyGroup } from '@/actions/family'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { LeaveGroupButton } from '@/components/settings/leave-group-button'
import { SetupPrompt } from '@/components/shared/setup-prompt'

export default async function SettingsPage() {
  const [userData, group] = await Promise.all([getCurrentUser(), getFamilyGroup()])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">ตั้งค่า</h1>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">โปรไฟล์</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">ชื่อ</span>
            <span className="font-medium">
              {userData?.profile?.displayName ?? userData?.user?.email}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">อีเมล</span>
            <span>{userData?.user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">บทบาท</span>
            <Badge variant="outline">
              {userData?.profile?.role === 'admin' ? 'ผู้ดูแล' : 'สมาชิก'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Family Group - ยังไม่มีกลุ่ม */}
      {!group && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">กลุ่มครอบครัว</CardTitle>
          </CardHeader>
          <CardContent>
            <SetupPrompt compact />
          </CardContent>
        </Card>
      )}

      {/* Family Group - มีกลุ่มแล้ว */}
      {group && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">กลุ่มครอบครัว</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">ชื่อกลุ่ม</span>
              <span className="font-medium">{group.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">รหัสเชิญ</span>
              <span className="font-mono font-bold text-primary text-lg tracking-wider">
                {group.inviteCode}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              แชร์รหัสนี้ให้สมาชิกครอบครัวเพื่อเข้าร่วมกลุ่ม
            </p>

            <div className="border-t pt-4 flex items-center justify-between">
              <h4 className="font-medium">สมาชิก ({group.members.length} คน)</h4>
              <LeaveGroupButton
                isAdmin={userData?.profile?.role === 'admin'}
                memberCount={group.members.length}
              />
            </div>
            <div className="pt-2">
              <div className="space-y-2">
                {group.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-2 rounded border">
                    <div>
                      <p className="font-medium text-sm">{member.profile.displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        เข้าร่วมเมื่อ {formatDate(member.joinedAt)}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {member.profile.role === 'admin' ? 'ผู้ดูแล' : 'สมาชิก'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
