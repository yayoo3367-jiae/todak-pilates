import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import { FIRST_SENTENCE_LIMIT, formatTime, isScriptFile, measure } from './stats'

const last = atom({ plugin: 'script-meter', key: 'last' } as const, null)

export const register: Register = on => {
  on('tool.call', async ($, e, next) => {
    const ran = await next(e)
    const isSave = e.tool === 'Write' || e.tool === 'Edit'

    if (!isSave || ran.deny !== undefined || ran.isError === true) {
      return ran
    }
    if (!isScriptFile(e.file_path)) {
      return ran
    }

    const text = await $.fs.read(e.file_path).catch(() => undefined)
    if (typeof text === 'string') {
      const stats = measure(e.file_path.split('/').pop() ?? e.file_path, text)
      await update($, last, () => stats)
    }

    return ran
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const stats = await read($, last)

    if (e.props.hasSurvey || stats === null) {
      return next(e)
    }

    const { Box, Text } = $.ui.resolve(e)
    const isTooLong = stats.firstChars > FIRST_SENTENCE_LIMIT

    return (
      <Box flexDirection="column">
        <Text>
          <Text bold>📝 {stats.file}</Text>
          <Text>  글자 수 {stats.chars}자 · 예상 낭독 {formatTime(stats.seconds)}</Text>
        </Text>
        <Text color={isTooLong ? 'red' : 'green'}>
          첫 문장 {stats.firstChars}자 / {FIRST_SENTENCE_LIMIT}자
          {isTooLong ? ' — 조금 길어요. 짧게 끊어 주세요' : ' ✓'}
        </Text>
      </Box>
    )
  })
}
