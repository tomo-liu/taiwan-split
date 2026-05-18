'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Group, Member, ExpenseWithDetails, SettledTransfer } from '@/types'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { fetchExpensesForGroup } from '@/app/actions/expense'
import { useLanguage } from '@/lib/hooks/useLanguage'
import { useDeviceId } from '@/lib/hooks/useDeviceId'
import { i18n } from '@/lib/i18n'
import JoinModal from './JoinModal'
import ExpenseSection from './ExpenseSection'
import SettlementSection from './SettlementSection'

const memberKey = (groupId: string) => `ts_member_${groupId}`

type Props = {
  group: Group
  initialMembers: Member[]
  initialExpenses: ExpenseWithDetails[]
  initialSettledTransfers: SettledTransfer[]
  shareUrl: string
}

export default function GroupPageClient({
  group,
  initialMembers,
  initialExpenses,
  initialSettledTransfers,
  shareUrl,
}: Props) {
  const { lang, toggle } = useLanguage()
  const tx = i18n[lang].group
  const common = i18n[lang].common
  const deviceId = useDeviceId()

  const [members, setMembers] = useState<Member[]>(initialMembers)
  const [expenses, setExpenses] = useState<ExpenseWithDetails[]>(initialExpenses)
  const [groupStatus, setGroupStatus] = useState(group.status)
  const [copied, setCopied] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [myMemberId, setMyMemberId] = useState<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem(memberKey(group.id))
    if (saved) setMyMemberId(saved)
  }, [group.id])

  const refreshExpenses = useCallback(async () => {
    const data = await fetchExpensesForGroup(group.id)
    setExpenses(data)
  }, [group.id])

  // Real-time: members
  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    const channel = supabase
      .channel(`members:${group.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'members', filter: `group_id=eq.${group.id}` },
        (payload) => {
          const incoming = payload.new as Member
          setMembers((prev) =>
            prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]
          )
        }
      )
      .subscribe()
    return () => { channel.unsubscribe() }
  }, [group.id])

  // Real-time: expenses
  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    const channel = supabase
      .channel(`expenses:${group.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses', filter: `group_id=eq.${group.id}` },
        () => refreshExpenses()
      )
      .subscribe()
    return () => { channel.unsubscribe() }
  }, [group.id, refreshExpenses])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable (non-HTTPS)
    }
  }

  const handleJoinSuccess = useCallback(
    (memberId: string) => {
      localStorage.setItem(memberKey(group.id), memberId)
      setMyMemberId(memberId)
      setIsModalOpen(false)
    },
    [group.id]
  )

  const myMember = members.find((m) => m.id === myMemberId)

  return (
    <>
      <div className="flex min-h-screen flex-col items-center bg-gray-50">
        <div className="w-full max-w-sm px-4 pt-10 pb-20 space-y-4">
          {/* Top bar */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-400">{common.appName}</span>
            <button
              type="button"
              onClick={toggle}
              className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50 active:bg-gray-100"
            >
              {common.langSwitch}
            </button>
          </div>

          {/* Group name */}
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">{group.name}</h1>

          {/* Share URL */}
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
              {tx.shareTitle}
            </p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={shareUrl}
                className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-600 outline-none"
              />
              <button
                type="button"
                onClick={handleCopy}
                className={`shrink-0 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  copied
                    ? 'bg-green-500 text-white'
                    : 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700'
                }`}
              >
                {copied ? tx.copied : tx.copy}
              </button>
            </div>
          </div>

          {/* Join / Already-joined */}
          {myMember ? (
            <div className="flex items-center gap-2.5 rounded-xl bg-green-50 px-4 py-3 ring-1 ring-green-200">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: myMember.color }}
              />
              <span className="text-sm font-medium text-green-800">
                {tx.alreadyJoined} — {myMember.name}
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-blue-500 text-base font-medium text-white transition-colors hover:bg-blue-600 active:bg-blue-700"
            >
              {tx.joinButton}
            </button>
          )}

          {/* Members list */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {tx.membersTitle}
              </p>
              {members.length > 0 && (
                <span className="text-xs text-gray-400">{tx.membersCount(members.length)}</span>
              )}
            </div>
            {members.length === 0 ? (
              <p className="text-sm text-gray-400">{tx.noMembers}</p>
            ) : (
              <ul className="space-y-2.5">
                {members.map((m) => (
                  <li key={m.id} className="flex items-center gap-2.5">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: m.color }}
                    />
                    <span
                      className="text-sm font-medium"
                      style={{ color: m.color }}
                    >
                      {m.name}
                    </span>
                    {m.id === myMemberId && (
                      <span className="ml-auto text-xs text-gray-400">{tx.me}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Expenses */}
          <ExpenseSection
            groupId={group.id}
            members={members}
            myMemberId={myMemberId}
            expenses={expenses}
            onRefresh={refreshExpenses}
            lang={lang}
          />

          {/* Settlement */}
          <SettlementSection
            groupId={group.id}
            groupStatus={groupStatus}
            members={members}
            expenses={expenses}
            myMemberId={myMemberId}
            initialSettledTransfers={initialSettledTransfers}
            lang={lang}
            onGroupStatusChange={setGroupStatus}
          />
        </div>
      </div>

      {isModalOpen && (
        <JoinModal
          groupId={group.id}
          deviceId={deviceId}
          lang={lang}
          onSuccess={handleJoinSuccess}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  )
}
