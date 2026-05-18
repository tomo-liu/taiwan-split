'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createGroup } from '@/app/actions/group'
import { useLanguage } from '@/lib/hooks/useLanguage'
import { i18n } from '@/lib/i18n'

export default function CreateGroupForm() {
  const { lang, toggle } = useLanguage()
  const tx = i18n[lang].createGroup
  const common = i18n[lang].common
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError(tx.errorRequired)
      return
    }

    startTransition(async () => {
      const result = await createGroup(name)
      if ('error' in result) {
        setError(result.error === 'REQUIRED' ? tx.errorRequired : tx.errorFailed)
      } else {
        router.push(`/group/${result.groupId}`)
      }
    })
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
        {/* Language toggle */}
        <div className="mb-6 flex justify-end">
          <button
            type="button"
            onClick={toggle}
            className="rounded-full border border-gray-200 px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50 active:bg-gray-100"
          >
            {common.langSwitch}
          </button>
        </div>

        <h1 className="mb-1 text-3xl font-bold text-gray-900">{tx.title}</h1>
        <p className="mb-8 text-sm text-gray-500">{tx.subtitle}</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="group-name" className="text-sm font-medium text-gray-700">
              {tx.label}
            </label>
            <input
              id="group-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={tx.placeholder}
              disabled={isPending}
              maxLength={50}
              className="rounded-xl border border-gray-300 px-4 py-3 text-base text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="flex h-12 items-center justify-center rounded-xl bg-blue-500 px-4 text-base font-medium text-white transition-colors hover:bg-blue-600 active:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Spinner />
                {tx.busy}
              </span>
            ) : (
              tx.button
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}
