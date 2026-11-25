export type PetMode = 'idle' | 'working' | 'done' | 'asking'
export type Pet = { mode: PetMode; tick: number }

declare module 'claude-code' {
  interface PluginState {
    'work-with-claude': { pet: Pet }
  }
}
