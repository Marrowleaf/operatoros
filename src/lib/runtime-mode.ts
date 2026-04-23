export type RuntimeMode = 'persistent-sqlite'

export function shouldUseDatabase() {
  return true
}

export function getRuntimeMode(): RuntimeMode {
  return 'persistent-sqlite'
}
