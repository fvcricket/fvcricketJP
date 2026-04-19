import { createClient } from '@libsql/client'

const tursoUrl = import.meta.env.VITE_TURSO_DB_URL
const tursoToken = import.meta.env.VITE_TURSO_DB_AUTH_TOKEN

export const turso = createClient({
  url: tursoUrl,
  authToken: tursoToken,
})