'use server'

import { createServerClient } from '@/lib/supabase/server'
import type { SettledTransfer } from '@/types'

export async function fetchSettledTransfers(groupId: string): Promise<SettledTransfer[]> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('settled_transfers')
    .select('*')
    .eq('group_id', groupId)
  return data ?? []
}

export async function markTransferSettled(
  groupId: string,
  fromMemberId: string,
  toMemberId: string,
  amount: number
): Promise<{ ok: true } | { error: string }> {
  const supabase = createServerClient()
  const { error } = await supabase.from('settled_transfers').upsert(
    { group_id: groupId, from_member_id: fromMemberId, to_member_id: toMemberId, amount },
    { onConflict: 'group_id,from_member_id,to_member_id' }
  )
  if (error) {
    console.error('markTransferSettled:', error)
    return { error: 'FAILED' }
  }
  return { ok: true }
}

export async function unmarkTransferSettled(
  groupId: string,
  fromMemberId: string,
  toMemberId: string
): Promise<{ ok: true } | { error: string }> {
  const supabase = createServerClient()
  const { error } = await supabase
    .from('settled_transfers')
    .delete()
    .eq('group_id', groupId)
    .eq('from_member_id', fromMemberId)
    .eq('to_member_id', toMemberId)
  if (error) {
    console.error('unmarkTransferSettled:', error)
    return { error: 'FAILED' }
  }
  return { ok: true }
}

export async function markGroupCompleted(
  groupId: string
): Promise<{ ok: true } | { error: string }> {
  const supabase = createServerClient()
  const { error } = await supabase
    .from('groups')
    .update({ status: 'completed' })
    .eq('id', groupId)
  if (error) {
    console.error('markGroupCompleted:', error)
    return { error: 'FAILED' }
  }
  return { ok: true }
}

export async function markGroupActive(
  groupId: string
): Promise<{ ok: true } | { error: string }> {
  const supabase = createServerClient()
  const { error } = await supabase
    .from('groups')
    .update({ status: 'active' })
    .eq('id', groupId)
  if (error) {
    console.error('markGroupActive:', error)
    return { error: 'FAILED' }
  }
  return { ok: true }
}
