export type ScriptStats = {
  file: string
  chars: number
  seconds: number
  firstSentence: string
  firstChars: number
}

declare module 'claude-code' {
  interface PluginState {
    'script-meter': { last: ScriptStats | null }
  }
}
