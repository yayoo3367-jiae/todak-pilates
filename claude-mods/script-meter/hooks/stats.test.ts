import { expect, test } from 'claude-code/testing'

import { firstSentenceOf, isScriptFile, measure } from './stats'

test('대본 파일만 잡아요', () => {
  expect(isScriptFile('릴스대본/어깨.md')).toBe(true)
  expect(isScriptFile('scripts/neck.txt')).toBe(true)
  expect(isScriptFile('todak-home.html')).toBe(false)
  expect(isScriptFile('notes/memo.md')).toBe(false)
})

test('첫 문장은 제목을 건너뛰고 마침표까지', () => {
  expect(firstSentenceOf('# 제목\n\n거북목, 오늘 3분이면 돼요. 같이 해 봐요.')).toBe(
    '거북목, 오늘 3분이면 돼요.',
  )
})

test('공백 제외 글자 수와 초당 7자 낭독 시간', () => {
  const s = measure('a.md', '어깨를 내려 주세요. 천천히 숨을 쉬어요.')
  expect(s.chars).toBe(18)
  expect(s.seconds).toBe(3)
  expect(s.firstChars).toBe(9)
})
