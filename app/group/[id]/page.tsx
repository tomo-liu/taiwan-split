import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { createServerClient } from '@/lib/supabase/server'
import type { ExpenseWithDetails } from '@/types'
import GroupPageClient from '@/components/GroupPageClient'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = createServerClient()
  const { data: group } = await supabase.from('groups').select('name').eq('id', id).single()
  return {
    title: group ? `${group.name} | 分帳` : '分帳',
  }
}

export default async function GroupPage(props: PageProps<'/group/[id]'>) {
  const { id } = await props.params
  const supabase = createServerClient()

  const [
    { data: group, error: groupError },
    { data: members },
    { data: expenses },
    { data: settledTransfers },
  ] = await Promise.all([
    supabase.from('groups').select('*').eq('id', id).single(),
    supabase.from('members').select('*').eq('group_id', id).order('created_at'),
    supabase
      .from('expenses')
      .select('*, payer:paid_by(id,name,color), splits:expense_splits(member_id)')
      .eq('group_id', id)
      .order('created_at', { ascending: false }),
    supabase.from('settled_transfers').select('*').eq('group_id', id),
  ])

  if (groupError || !group) notFound()

  const headersList = await headers()
  const host = headersList.get('host') ?? 'localhost:3000'
  const protocol = host.startsWith('localhost') ? 'http' : 'https'
  const shareUrl = `${protocol}://${host}/group/${id}`

  return (
    <GroupPageClient
      group={group}
      initialMembers={members ?? []}
      initialExpenses={(expenses ?? []) as unknown as ExpenseWithDetails[]}
      initialSettledTransfers={settledTransfers ?? []}
      shareUrl={shareUrl}
    />
  )
}
