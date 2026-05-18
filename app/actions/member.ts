'use server'

import { createServerClient } from '@/lib/supabase/server'

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b',
]

export async function joinGroup(
  groupId: string,
  name: string,
  deviceId: string
): Promise<{ memberId: string } | { error: string }> {
  const trimmed = name.trim()
  if (!trimmed) return { error: 'REQUIRED' }

  const supabase = createServerClient()

  const { data: existing } = await supabase
    .from('members')
    .select('id')
    .eq('group_id', groupId)
    .eq('device_id', deviceId)
    .maybeSingle()

  if (existing) return { error: 'ALREADY_JOINED' }

  const { count } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', groupId)

  const color = COLORS[(count ?? 0) % COLORS.length]

  const { data, error } = await supabase
    .from('members')
    .insert({ group_id: groupId, name: trimmed, color, device_id: deviceId })
    .select('id')
    .single()

  if (error || !data) {
    console.error('joinGroup error:', error)
    return { error: 'FAILED' }
  }

  return { memberId: data.id }
}
