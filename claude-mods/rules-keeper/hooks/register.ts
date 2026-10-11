import type { EngineInterface, Register } from 'claude-code'

import {
  extractRules,
  judgePrompt,
  mergeRules,
  parseRules,
  renderRules,
  RULES_FILE,
  systemSection,
  warningOf,
} from './rules'

const loadRules = async ($: EngineInterface): Promise<string[]> => {
  const file = await $.fs.read(RULES_FILE).catch(() => '')

  return typeof file === 'string' ? parseRules(file) : []
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'rules', description: '내가 정한 규칙 목록 보기' })

    return next(e)
  })

  on('command.run', { command: 'rules' }, async $ => {
    const rules = await loadRules($)
    const list = rules.map((rule, i) => `${i + 1}. ${rule}`).join('\n')

    return {
      text:
        rules.length === 0
          ? '아직 정한 규칙이 없어요.'
          : `정하신 규칙 (${RULES_FILE})\n${list}`,
    }
  })

  // 1) "앞으로/항상/반드시"가 들어간 문장을 규칙 파일에 모아요
  on('prompt.submit', async ($, e, next) => {
    const found = extractRules(e.text)
    if (found.length > 0) {
      const old = await loadRules($)
      const merged = mergeRules(old, found)
      if (merged.length > old.length) {
        await $.fs.write(RULES_FILE, renderRules(merged))
        $.ui.toast(`규칙 ${merged.length - old.length}개를 기억해 둘게요`)
      }
    }

    return next(e)
  })

  // 2) 매 대화의 시스템 안내에 규칙을 넣어요
  on('prompt.compose', async ($, e, next) => {
    const composed = await next(e)
    const rules = await loadRules($)
    if (rules.length === 0) return composed

    const section = { id: 'rules-keeper:rules', text: systemSection(rules), scope: 'session' } as const

    return { ...composed, sections: [...composed.sections, section] }
  })

  // 3) 답이 끝나면 규칙을 어겼는지 살펴보고, 어겼으면 답 아래에 경고를 띄워요
  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    if (e.agentId !== undefined || e.reason !== 'answer' || e.answer.trim() === '') {
      return done
    }

    const rules = await loadRules($)
    if (rules.length === 0) return done

    const verdict = await $.model.complete({
      model: 'haiku',
      prompt: judgePrompt(rules, e.answer),
      maxTokens: 300,
      effort: 'low',
      timeoutMs: 20000,
    })
    const warning = verdict.isAnswered ? warningOf(verdict.text) : undefined

    return warning === undefined ? done : { ...done, text: warning }
  })
}
