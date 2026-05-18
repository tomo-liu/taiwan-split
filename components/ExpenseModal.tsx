'use client'

import { useState, useTransition, useEffect } from 'react'
import type { Member, ExpenseWithDetails } from '@/types'
import { i18n } from '@/lib/i18n'
import type { Lang } from '@/lib/i18n'
import { createExpense, updateExpense } from '@/app/actions/expense'

type Props = {
  groupId: string
  members: Member[]
  myMemberId: string | null
  editingExpense: ExpenseWithDetails | null
  lang: Lang
  onSuccess: () => void
  onClose: () => void
}

export default function ExpenseModal({
  groupId,
  members,
  myMemberId,
  editingExpense,
  lang,
  onSuccess,
  onClose,
}: Props) {
  const tx = i18n[lang].expenseModal
  const isEditing = editingExpense !== null

  const [amountStr, setAmountStr] = useState('')
  const [description, setDescription] = useState('')
  const [paidBy, setPaidBy] = useState('')
  const [splitIds, setSplitIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (isEditing) {
      setAmountStr(String(editingExpense.amount))
      setDescription(editingExpense.description)
      setPaidBy(editingExpense.paid_by)
      setSplitIds(new Set(editingExpense.splits.map((s) => s.member_id)))
    } else {
      setAmountStr('')
      setDescription('')
      setPaidBy(myMemberId ?? members[0]?.id ?? '')
      setSplitIds(new Set(members.map((m) => m.id)))
    }
  }, [isEditing, editingExpense, myMemberId, members])

  const toggleSplit = (id: string) => {
    setSplitIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    setSplitIds((prev) =>
      prev.size === members.length ? new Set() : new Set(members.map((m) => m.id))
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const amount = parseInt(amountStr, 10)
    if (!amountStr || !Number.isInteger(amount) || amount <= 0) {
      setError(tx.errorAmount)
      return
    }
    if (!description.trim()) {
      setError(tx.errorDesc)
      return
    }
    if (splitIds.size === 0) {
      setError(tx.errorSplits)
      return
    }

    const splitMemberIds = Array.from(splitIds)

    startTransition(async () => {
      const result = isEditing
        ? await updateExpense(editingExpense.id, amount, description, paidBy, splitMemberIds)
        : await createExpense(groupId, amount, description, paidBy, splitMemberIds)

      if ('error' in result) {
        const { error: code } = result
        if (code === 'REQUIRED_DESC') setError(tx.errorDesc)
        else if (code === 'INVALID_AMOUNT') setError(tx.errorAmount)
        else if (code === 'REQUIRED_SPLITS') setError(tx.errorSplits)
        else setError(tx.errorFailed)
      } else {
        onSuccess()
      }
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-t-3xl bg-white px-6 pb-10 pt-4 shadow-xl sm:rounded-2xl sm:pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="mb-5 flex justify-center sm:hidden">
          <div className="h-1 w-10 rounded-full bg-gray-300" />
        </div>

        <h2 className="mb-5 text-xl font-semibold text-gray-900">
          {isEditing ? tx.titleEdit : tx.titleAdd}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Amount */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">{tx.amountLabel}</label>
            <input
              type="number"
              inputMode="numeric"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder={tx.amountPlaceholder}
              disabled={isPending}
              min={1}
              step={1}
              className="rounded-xl border border-gray-300 px-4 py-3 text-base text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">{tx.descLabel}</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={tx.descPlaceholder}
              disabled={isPending}
              maxLength={50}
              className="rounded-xl border border-gray-300 px-4 py-3 text-base text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50"
            />
          </div>

          {/* Paid by */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">{tx.paidByLabel}</label>
            <select
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              disabled={isPending}
              className="rounded-xl border border-gray-300 px-4 py-3 text-base text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Split with */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">{tx.splitLabel}</label>
              <button
                type="button"
                onClick={toggleAll}
                className="text-xs text-blue-500 hover:text-blue-700"
              >
                {tx.selectAll}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => {
                const checked = splitIds.has(m.id)
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleSplit(m.id)}
                    disabled={isPending}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                      checked
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    } disabled:opacity-50`}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: checked ? 'white' : m.color }}
                    />
                    {m.name}
                  </button>
                )
              })}
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="flex h-12 items-center justify-center rounded-xl bg-blue-500 px-4 text-base font-medium text-white transition-colors hover:bg-blue-600 active:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? tx.saving : tx.saveButton}
          </button>
        </form>
      </div>
    </div>
  )
}
