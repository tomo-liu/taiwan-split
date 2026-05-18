'use client'

import { useState, useEffect } from 'react'

const KEY = 'ts_device_id'

export function useDeviceId(): string | null {
  const [deviceId, setDeviceId] = useState<string | null>(null)

  useEffect(() => {
    let id = localStorage.getItem(KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(KEY, id)
    }
    setDeviceId(id)
  }, [])

  return deviceId
}
