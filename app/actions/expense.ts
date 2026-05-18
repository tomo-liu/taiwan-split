'use server'

import { createServerClient } from '@/lib/supabase/server'
import type { ExpenseWithDetails } from '@/types'

export async function createExpense(
  groupId: string,
  amount: number,
  description: string,
  paidBy: string,
  splitMemberIds: string[]
): Promise<{ ok: true } | { error: string }> {
  if (!description.trim()) return { error: 'REQUIRED_DESC' }
  if (!Number.isInteger(amount) || amount <= 0) return { error: 'INVALID_AMOUNT' }
  if (splitMemberIds.length === 0) return { error: 'REQUIRED_SPLITS' }

  const supabase = createServerClient()

  const { data: expense, error: expenseError } = await supabase
    .from('expenses')
    .insert({ group_id: groupId, amount, description: description.trim(), paid_by: paidBy })
    .select('id')
    .single()

  if (expenseError || !expense) {
    console.error('createExpense:', expenseError)
    return { error: 'FAILED' }
  }

  const { error: splitsError } = await supabase.from('expense_splits').insert(
    splitMemberIds.map((member_id) => ({ expense_id: expense.id, member_id }))
  )

  if (splitsError) {
    console.error('createExpense splits:', splitsError)
    await supabase.from('expenses').delete().eq('id', expense.id)
    return { error: 'FAILED' }
  }

  return { ok: true }
}

export async function updateExpense(
  expenseId: string,
  amount: number,
  description: string,
  paidBy: string,
  splitMemberIds: string[]
): Promise<{ ok: true } | { error: string }> {
  if (!description.trim()) return { error: 'REQUIRED_DESC' }
  if (!Number.isInteger(amount) || amount <= 0) return { error: 'INVALID_AMOUNT' }
  if (splitMemberIds.length === 0) return { error: 'REQUIRED_SPLITS' }

  const supabase = createServerClient()

  const { data: updated, error: updateError } = await supabase
    .from('expenses')
    .update({ amount, description: description.trim(), paid_by: paidBy })
    .eq('id', expenseId)
    .select('id')

  if (updateError || !updated || updated.length === 0) {
    console.error('updateExpense: update failed or RLS blocked it', updateError)
    return { error: 'FAILED' }
  }

  await supabase.from('expense_splits').delete().eq('expense_id', expenseId)

  const { error: splitsError } = await supabase.from('expense_splits').insert(
    splitMemberIds.map((member_id) => ({ expense_id: expenseId, member_id }))
  )

  if (splitsError) {
    console.error('updateExpense splits:', splitsError)
    return { error: 'FAILED' }
  }

  return { ok: true }
}

export async function deleteExpense(
  expenseId: string
): Promise<{ ok: true } | { error: string }> {
  const supabase = createServerClient()
  const { error } = await supabase.from('expenses').delete().eq('id', expenseId)

  if (error) {
    console.error('deleteExpense:', error)
    return { error: 'FAILED' }
  }

  return { ok: true }
}

export async function fetchExpensesForGroup(
  groupId: string
): Promise<ExpenseWithDetails[]> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('expenses')
    .select('*, payer:paid_by(id,name,color), splits:expense_splits(member_id)')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })

  return (data ?? []) as unknown as ExpenseWithDetails[]
}
