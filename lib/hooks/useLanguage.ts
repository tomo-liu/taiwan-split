'use client'

import { useState, useEffect } from 'react'
import type { Lang } from '@/lib/i18n'

export type { Lang }

const STORAGE_KEY = 'ts_lang'

export function useLanguage() {
  const [lang, setLang] = useState<Lang>('zh')

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'zh' || saved === 'en') setLang(saved)
  }, [])

  const toggle = () => {
    const next: Lang = lang === 'zh' ? 'en' : 'zh'
    setLang(next)
    localStorage.setItem(STORAGE_KEY, next)
  }

  return { lang, toggle }
}
