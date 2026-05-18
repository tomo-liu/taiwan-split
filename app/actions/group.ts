'use server'

import { createServerClient } from '@/lib/supabase/server'

export async function createGroup(
  name: string
): Promise<{ groupId: string } | { error: string }> {
  const trimmed = name.trim()
  if (!trimmed) return { error: 'REQUIRED' }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('groups')
    .insert({ name: trimmed })
    .select('id')
    .single()

  if (error || !data) {
    console.error('createGroup error:', error)
    return { error: 'FAILED' }
  }

  return { groupId: data.id }
}
