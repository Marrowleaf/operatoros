export type RuntimeMode = 'persistent-file'

export function shouldUseDatabase() {
  return false
}

export function getRuntimeMode(): RuntimeMode {
  return 'persistent-file'
}
