import type { ShelfFile } from '../types'

export const SHELF_EXT = /\.(png|jpe?g|gif|webp|svg|html?)$/i
export const SKIP_DIR = new Set(['.git', 'node_modules', '.claude', 'dist', 'build'])

export const isShelfFile = (path: string): boolean => SHELF_EXT.test(path)

export const iconOf = (name: string): string => (/\.html?$/i.test(name) ? '🌐' : '🖼️')

// 같은 경로는 한 번만, 가장 최근 것이 위로
export const addFile = (list: readonly ShelfFile[], file: ShelfFile): ShelfFile[] =>
  [file, ...list.filter(one => one.path !== file.path)].slice(0, 100)
