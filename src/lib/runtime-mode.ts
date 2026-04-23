export type RuntimeMode = 'database' | 'demo'

export function shouldUseDatabase() {
  return Boolean(process.env.DATABASE_URL)
}

export function getRuntimeMode(): RuntimeMode {
  return shouldUseDatabase() ? 'database' : 'demo'
}
