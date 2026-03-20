import { getCurrentUser } from '@/actions/auth'
import { getAllUserGroups } from '@/actions/family'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { LeaveGroupButton } from '@/components/settings/leave-group-button'
import { CopyInviteButton } from '@/components/settings/copy-invite-button'
import { SetupPrompt } from '@/components/shared/setup-prompt'
import { Users } from 'lucide-react'

export default async function SettingsPage() {
  const [userData, groups] = await Promise.all([getCurrentUser(), getAllUserGroups()])
  const userId = userData?.user?.id

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">ตั้งค่า</h1>

      {/* โปรไฟล์ */}
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
        </CardContent>
      </Card>

      {/* กลุ่มของฉัน */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">กลุ่มของฉัน</h2>
          {groups.length > 0 && (
            <Badge variant="secondary">{groups.length} กลุ่ม</Badge>
          )}
        </div>

        {groups.length === 0 && (
          <p className="text-sm text-muted-foreground">
            คุณยังไม่ได้อยู่ในกลุ่มใดๆ
          </p>
        )}

        {groups.map((group) => {
          const isCreator = group.createdBy === userId
          return (
            <Card key={group.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{group.name}</CardTitle>
                    {isCreator && (
                      <Badge variant="outline" className="mt-1 text-xs">ผู้สร้าง</Badge>
                    )}
                  </div>
                  <LeaveGroupButton
                    groupId={group.id}
                    isCreator={isCreator}
                    memberCount={group.members.length}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Invite code */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">รหัสเชิญ</p>
                    <p className="font-mono font-bold text-primary text-xl tracking-widest">
                      {group.inviteCode}
                    </p>
                  </div>
                  <CopyInviteButton code={group.inviteCode} />
                </div>
                <p className="text-xs text-muted-foreground">
                  แชร์รหัสนี้ให้สมาชิกเพื่อเข้าร่วมกลุ่ม
                </p>

                {/* Members */}
                <div>
                  <h4 className="text-sm font-medium mb-2">
                    สมาชิก ({group.members.length} คน)
                  </h4>
                  <div className="space-y-2">
                    {group.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-2 rounded border"
                      >
                        <div>
                          <p className="font-medium text-sm">{member.profile.displayName}</p>
                          <p className="text-xs text-muted-foreground">
                            เข้าร่วมเมื่อ {formatDate(member.joinedAt)}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {member.profile.id === group.createdBy ? 'ผู้สร้าง' : 'สมาชิก'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {/* สร้าง / เข้าร่วมกลุ่มใหม่ — แสดงเสมอ */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {groups.length === 0 ? 'สร้างหรือเข้าร่วมกลุ่ม' : 'เพิ่มกลุ่มใหม่'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SetupPrompt compact />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
