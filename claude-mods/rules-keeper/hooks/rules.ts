export const RULES_FILE = '.claude/my-rules.md'
export const RULE_WORDS = /(앞으로|항상|반드시)/

const HEADER = '# 내가 정한 규칙\n\n"앞으로", "항상", "반드시"라고 말한 문장이 자동으로 모입니다. 직접 고치거나 지워도 돼요.\n'

// 규칙 말이 들어간 문장만 골라요
export const extractRules = (text: string): string[] =>
  text
    .split(/(?<=[.!?。！？])\s+|\n+/)
    .map(line => line.trim())
    .filter(line => line !== '' && RULE_WORDS.test(line))

export const parseRules = (file: string): string[] =>
  file
    .split('\n')
    .filter(line => line.startsWith('- '))
    .map(line => line.slice(2).trim())
    .filter(line => line !== '')

export const renderRules = (rules: readonly string[]): string =>
  `${HEADER}\n${rules.map(rule => `- ${rule}`).join('\n')}\n`

export const mergeRules = (old: readonly string[], add: readonly string[]): string[] => [
  ...old,
  ...add.filter(rule => !old.includes(rule)),
]

export const systemSection = (rules: readonly string[]): string =>
  [
    '사용자가 직접 정한 규칙입니다. 모든 답과 작업에서 반드시 지키세요.',
    ...rules.map((rule, i) => `${i + 1}. ${rule}`),
  ].join('\n')

export const judgePrompt = (rules: readonly string[], answer: string): string =>
  [
    '아래 <rules>는 사용자가 정한 규칙이고 <answer>는 AI의 답입니다.',
    '답이 분명하게 어긴 규칙이 있으면 한 줄에 하나씩 "규칙 번호: 어긴 이유(짧게)"로 쓰세요.',
    '어긴 규칙이 없거나, 이 답과 상관없는 규칙이면 OK 한 단어만 쓰세요.',
    '',
    '<rules>',
    ...rules.map((rule, i) => `${i + 1}. ${rule}`),
    '</rules>',
    '<answer>',
    answer,
    '</answer>',
  ].join('\n')

export const warningOf = (verdict: string): string | undefined => {
  const text = verdict.trim()
  if (text === '' || /^OK\.?$/i.test(text)) return undefined

  return `⚠️ 정하신 규칙과 어긋난 부분이 있어요\n${text}`
}
