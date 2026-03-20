import { cookies } from 'next/headers'

const COOKIE_NAME = 'payplan_active_group'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

export async function getActiveGroupId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_NAME)?.value ?? null
}

export async function setActiveGroupId(groupId: string | null): Promise<void> {
  const cookieStore = await cookies()
  if (groupId === null) {
    cookieStore.delete(COOKIE_NAME)
  } else {
    cookieStore.set(COOKIE_NAME, groupId, {
      maxAge: COOKIE_MAX_AGE,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
  }
}
