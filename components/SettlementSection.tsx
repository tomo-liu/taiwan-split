'use client'

import { useState, useTransition, useMemo } from 'react'
import type { Member, ExpenseWithDetails, SettledTransfer } from '@/types'
import { i18n } from '@/lib/i18n'
import type { Lang } from '@/lib/i18n'
import {
  calculateBalances,
  calculateSettlements,
  type SettlementTransfer,
} from '@/lib/utils/settlement'
import {
  markTransferSettled,
  unmarkTransferSettled,
  markGroupCompleted,
  markGroupActive,
} from '@/app/actions/settlement'

type Props = {
  groupId: string
  groupStatus: 'active' | 'completed'
  members: Member[]
  expenses: ExpenseWithDetails[]
  myMemberId: string | null
  initialSettledTransfers: SettledTransfer[]
  lang: Lang
  onGroupStatusChange: (status: 'active' | 'completed') => void
}

export default function SettlementSection({
  groupId,
  groupStatus,
  members,
  expenses,
  myMemberId,
  initialSettledTransfers,
  lang,
  onGroupStatusChange,
}: Props) {
  const tx = i18n[lang].settlement

  const [settledTransfers, setSettledTransfers] =
    useState<SettledTransfer[]>(initialSettledTransfers)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const balances = useMemo(() => calculateBalances(members, expenses), [members, expenses])
  const transfers = useMemo(() => calculateSettlements(balances), [balances])

  const isSettled = (transfer: SettlementTransfer) =>
    settledTransfers.some(
      (s) => s.from_member_id === transfer.from.id && s.to_member_id === transfer.to.id
    )

  const allTransfersSettled = transfers.length > 0 && transfers.every((t) => isSettled(t))

  const handleToggleSettled = (transfer: SettlementTransfer) => {
    setActionError(null)
    const settled = isSettled(transfer)

    startTransition(async () => {
      const result = settled
        ? await unmarkTransferSettled(groupId, transfer.from.id, transfer.to.id)
        : await markTransferSettled(groupId, transfer.from.id, transfer.to.id, transfer.amount)

      if ('error' in result) {
        setActionError(tx.errorFailed)
        return
      }

      if (settled) {
        setSettledTransfers((prev) =>
          prev.filter(
            (s) =>
              !(s.from_member_id === transfer.from.id && s.to_member_id === transfer.to.id)
          )
        )
      } else {
        setSettledTransfers((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            group_id: groupId,
            from_member_id: transfer.from.id,
            to_member_id: transfer.to.id,
            amount: transfer.amount,
            created_at: new Date().toISOString(),
          },
        ])
      }
    })
  }

  const handleGroupStatusToggle = () => {
    setActionError(null)
    startTransition(async () => {
      const result =
        groupStatus === 'active'
          ? await markGroupCompleted(groupId)
          : await markGroupActive(groupId)

      if ('error' in result) {
        setActionError(tx.errorFailed)
        return
      }
      onGroupStatusChange(groupStatus === 'active' ? 'completed' : 'active')
    })
  }

  if (expenses.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
          {tx.sectionTitle}
        </p>
        <p className="text-sm text-gray-400">{tx.noExpenses}</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
      <div className="px-5 pt-5 pb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          {tx.sectionTitle}
        </p>
      </div>

      {/* Completed banner */}
      {groupStatus === 'completed' && (
        <div className="mx-5 mb-4 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700 ring-1 ring-green-200">
          {tx.completedBanner}
        </div>
      )}

      {actionError && (
        <p className="mx-5 mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {actionError}
        </p>
      )}

      {/* Balances */}
      <div className="px-5 pb-4">
        <p className="mb-2 text-xs font-medium text-gray-400">{tx.balancesTitle}</p>
        <ul className="space-y-2">
          {balances.map(({ member, balance }) => {
            const isMe = member.id === myMemberId
            return (
              <li key={member.id} className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: member.color }}
                />
                <span
                  className={`text-sm ${isMe ? 'font-semibold' : 'font-medium'}`}
                  style={{ color: member.color }}
                >
                  {member.name}
                </span>
                {isMe && (
                  <span className="text-xs text-gray-400">{tx.myLabel}</span>
                )}
                <span
                  className={`ml-auto text-sm font-semibold tabular-nums ${
                    balance > 0
                      ? 'text-blue-600'
                      : balance < 0
                      ? 'text-red-500'
                      : 'text-gray-400'
                  }`}
                >
                  {balance > 0
                    ? `+NT$${balance.toLocaleString()}`
                    : balance < 0
                    ? `-NT$${(-balance).toLocaleString()}`
                    : tx.balanced}
                </span>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Divider */}
      <div className="mx-5 border-t border-gray-100" />

      {/* Transfers */}
      <div className="px-5 py-4">
        {transfers.length === 0 ? (
          <p className="text-center text-sm font-medium text-green-600">{tx.allSettled}</p>
        ) : (
          <>
            <p className="mb-3 text-xs font-medium text-gray-400">{tx.settlementsTitle}</p>
            <ul className="space-y-2.5">
              {transfers.map((transfer) => {
                const settled = isSettled(transfer)
                const involvesMe =
                  transfer.from.id === myMemberId || transfer.to.id === myMemberId

                return (
                  <li
                    key={`${transfer.from.id}-${transfer.to.id}`}
                    className={`flex items-center gap-2 rounded-xl px-3 py-3 text-sm transition-opacity ${
                      settled ? 'opacity-40' : involvesMe ? 'bg-blue-50 ring-1 ring-blue-100' : 'bg-gray-50'
                    }`}
                  >
                    {/* From */}
                    <span
                      className="font-medium"
                      style={{ color: transfer.from.color }}
                    >
                      {transfer.from.name}
                    </span>

                    <span className="shrink-0 text-gray-400">→</span>

                    {/* To */}
                    <span
                      className="font-medium"
                      style={{ color: transfer.to.color }}
                    >
                      {transfer.to.name}
                    </span>

                    <span className="ml-auto flex items-center gap-2">
                      <span className="font-semibold tabular-nums text-gray-800">
                        NT${transfer.amount.toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleSettled(transfer)}
                        disabled={isPending}
                        className={`min-h-[32px] rounded-lg px-2.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                          settled
                            ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                      >
                        {isPending ? tx.completing : settled ? tx.unmark : tx.markDone}
                      </button>
                    </span>
                  </li>
                )
              })}
            </ul>

            {/* Mark group complete button */}
            {allTransfersSettled && (
              <button
                type="button"
                onClick={handleGroupStatusToggle}
                disabled={isPending}
                className={`mt-4 flex h-12 w-full items-center justify-center rounded-xl text-sm font-medium transition-colors disabled:opacity-60 ${
                  groupStatus === 'completed'
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {isPending
                  ? tx.completing
                  : groupStatus === 'completed'
                  ? tx.reopenGroup
                  : tx.markGroupDone}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
