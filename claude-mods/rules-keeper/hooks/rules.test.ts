import { expect, test } from 'claude-code/testing'

import { extractRules, mergeRules, parseRules, renderRules, warningOf } from './rules'

test('규칙 말이 든 문장만 골라요', () => {
  const text = '오늘 대본 고마워요. 앞으로 존댓말로 써 줘. 그리고 항상 이모지는 빼 줘!'
  expect(extractRules(text)).toEqual(['앞으로 존댓말로 써 줘.', '그리고 항상 이모지는 빼 줘!'])
  expect(extractRules('대본 하나 써 줘')).toEqual([])
})

test('파일로 쓰고 다시 읽으면 같은 규칙, 중복은 한 번만', () => {
  const rules = mergeRules(['반드시 한국어로'], ['반드시 한국어로', '항상 짧게'])
  expect(parseRules(renderRules(rules))).toEqual(['반드시 한국어로', '항상 짧게'])
})

test('OK면 경고 없음, 위반이면 경고', () => {
  expect(warningOf('OK')).toBeUndefined()
  expect(warningOf('1: 영어로 답함')).toContain('⚠️')
})
