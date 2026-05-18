'use client'

import { useState, useTransition } from 'react'
import type { Member, ExpenseWithDetails } from '@/types'
import { i18n } from '@/lib/i18n'
import type { Lang } from '@/lib/i18n'
import { deleteExpense } from '@/app/actions/expense'
import ExpenseModal from './ExpenseModal'

type Props = {
  groupId: string
  members: Member[]
  myMemberId: string | null
  expenses: ExpenseWithDetails[]
  onRefresh: () => void
  lang: Lang
}

export default function ExpenseSection({
  groupId,
  members,
  myMemberId,
  expenses,
  onRefresh,
  lang,
}: Props) {
  const tx = i18n[lang].expense

  const [modalOpen, setModalOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<ExpenseWithDetails | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isPendingDelete, startDeleteTransition] = useTransition()

  const handleDeleteClick = (expenseId: string) => {
    if (!window.confirm(tx.deleteConfirm)) return
    setDeleteError(null)

    startDeleteTransition(async () => {
      const result = await deleteExpense(expenseId)
      if ('error' in result) {
        setDeleteError(tx.errorDelete)
      } else {
        onRefresh()
      }
    })
  }

  const handleModalSuccess = () => {
    setModalOpen(false)
    setEditingExpense(null)
    onRefresh()
  }

  return (
    <>
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            {tx.sectionTitle}
          </p>
          <button
            type="button"
            onClick={() => { setEditingExpense(null); setModalOpen(true) }}
            disabled={!myMemberId || isPendingDelete}
            title={!myMemberId ? tx.addButtonHint : undefined}
            className="flex h-8 items-center gap-1 rounded-full bg-blue-500 px-3 text-xs font-medium text-white transition-colors hover:bg-blue-600 active:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
          >
            <span className="text-base leading-none">+</span>
            {tx.addButton}
          </button>
        </div>

        {deleteError && (
          <p className="mx-5 mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {deleteError}
          </p>
        )}

        {/* Empty state */}
        {expenses.length === 0 ? (
          <div className="px-5 pb-6 text-center">
            <p className="text-sm font-medium text-gray-500">{tx.noExpenses}</p>
            {myMemberId && (
              <p className="mt-1 text-xs text-gray-400">{tx.noExpensesHint}</p>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 px-5 pb-2">
            {expenses.map((exp) => (
              <li key={exp.id} className="py-3.5">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-semibold text-gray-900">
                        NT${exp.amount.toLocaleString()}
                      </span>
                      <span className="truncate text-sm text-gray-600">{exp.description}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: exp.payer.color }}
                        />
                        {tx.paidBy}: {exp.payer.name}
                      </span>
                      <span>{tx.splitWith}: {tx.people(exp.splits.length)}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => { setEditingExpense(exp); setModalOpen(true) }}
                      disabled={isPendingDelete}
                      className="min-h-[36px] rounded-lg px-2.5 text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40"
                    >
                      {tx.edit}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(exp.id)}
                      disabled={isPendingDelete}
                      className="min-h-[36px] rounded-lg px-2.5 text-xs text-red-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                    >
                      {tx.delete}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {modalOpen && (
        <ExpenseModal
          groupId={groupId}
          members={members}
          myMemberId={myMemberId}
          editingExpense={editingExpense}
          lang={lang}
          onSuccess={handleModalSuccess}
          onClose={() => { setModalOpen(false); setEditingExpense(null) }}
        />
      )}
    </>
  )
}
