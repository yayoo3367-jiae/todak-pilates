import { expect, test } from 'claude-code/testing'

import { addFile, isShelfFile } from './shelf'

test('이미지와 HTML만 모아요', () => {
  expect(isShelfFile('a/thumb.PNG')).toBe(true)
  expect(isShelfFile('todak-home.html')).toBe(true)
  expect(isShelfFile('notes.md')).toBe(false)
})

test('같은 파일은 한 번만, 최근 것이 위로', () => {
  const one = { path: 'a.png', name: 'a.png', at: 1 }
  const two = { path: 'b.html', name: 'b.html', at: 2 }
  const list = addFile(addFile(addFile([], one), two), { ...one, at: 3 })
  expect(list.map(f => f.path)).toEqual(['a.png', 'b.html'])
})
