export type ShelfFile = { path: string; name: string; at: number }

declare module 'claude-code' {
  interface PluginState {
    'file-shelf': { files: ShelfFile[]; startedAt: number }
  }
}
