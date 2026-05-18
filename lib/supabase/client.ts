import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

let client: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseBrowserClient() {
  if (!client) {
    client = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return client
}
