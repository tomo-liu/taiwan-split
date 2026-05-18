'use client'

import { useState, useTransition } from 'react'
import { joinGroup } from '@/app/actions/member'
import { i18n } from '@/lib/i18n'
import type { Lang } from '@/lib/i18n'

type Props = {
  groupId: string
  deviceId: string | null
  lang: Lang
  onSuccess: (memberId: string) => void
  onClose: () => void
}

export default function JoinModal({ groupId, deviceId, lang, onSuccess, onClose }: Props) {
  const tx = i18n[lang].join
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError(tx.errorRequired)
      return
    }
    if (!deviceId) return

    startTransition(async () => {
      const result = await joinGroup(groupId, name, deviceId)
      if ('error' in result) {
        setError(result.error === 'REQUIRED' ? tx.errorRequired : tx.errorFailed)
      } else {
        onSuccess(result.memberId)
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

        <h2 className="mb-5 text-xl font-semibold text-gray-900">{tx.title}</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="member-name" className="text-sm font-medium text-gray-700">
              {tx.label}
            </label>
            <input
              id="member-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={tx.placeholder}
              disabled={isPending}
              maxLength={20}
              autoFocus
              className="rounded-xl border border-gray-300 px-4 py-3 text-base text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={isPending || !deviceId}
            className="flex h-12 items-center justify-center rounded-xl bg-blue-500 px-4 text-base font-medium text-white transition-colors hover:bg-blue-600 active:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? tx.busy : tx.confirm}
          </button>
        </form>
      </div>
    </div>
  )
}
