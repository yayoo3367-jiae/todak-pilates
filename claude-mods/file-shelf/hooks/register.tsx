import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { addFile, iconOf, isShelfFile, SKIP_DIR } from './shelf'

const PANE = 'file-shelf'
const files = atom({ plugin: 'file-shelf', key: 'files' } as const, [])
const startedAt = atom({ plugin: 'file-shelf', key: 'startedAt' } as const, 0)

const remember = async ($: EngineInterface, path: string) => {
  const name = path.split('/').pop() ?? path
  const at = await $.clock.now()
  await update($, files, list => addFile(list, { path, name, at }))
}

// 명령어(Bash)나 다른 도구로 만든 파일도 놓치지 않도록, 대화가 시작된 뒤 생긴 파일을 훑어요
const scan = async ($: EngineInterface, dir: string, since: number, depth: number) => {
  const entries = await $.fs.list(dir).catch(() => [])
  for (const entry of entries) {
    const path = `${dir}/${entry.name}`
    if (entry.kind === 'dir' && depth > 0 && !SKIP_DIR.has(entry.name)) {
      await scan($, path, since, depth - 1)
    } else if (entry.kind === 'file' && entry.mtimeMs >= since && isShelfFile(entry.name)) {
      const known = (await read($, files)).some(one => one.path === path)
      if (!known) await remember($, path)
    }
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    if ((await read($, startedAt)) === 0) {
      const now = await $.clock.now()
      await update($, startedAt, () => now)
    }
    await $.command.register({
      name: 'files',
      description: '이번 대화에서 만든 이미지·HTML 파일 패널 열기',
    })
    void $.ui.open({ id: PANE, title: '만든 파일' })

    return next(e)
  })

  on('command.run', { command: 'files' }, async $ => {
    await $.ui.open({ id: PANE, title: '만든 파일' })

    return { text: '만든 파일 패널을 열었어요.' }
  })

  on('tool.call', async ($, e, next) => {
    const ran = await next(e)
    const isSave = e.tool === 'Write' || e.tool === 'Edit'

    if (isSave && ran.deny === undefined && ran.isError !== true && isShelfFile(e.file_path)) {
      await remember($, e.file_path)
    }

    return ran
  })

  on('turn.complete', async ($, e, next) => {
    const since = await read($, startedAt)
    if (e.agentId === undefined && since > 0) {
      await scan($, await $.session.cwd(), since, 3)
    }

    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Button, Text } = $.ui.resolve(e)
    const list = await read($, files)

    const open = (path: string) =>
      $.tool.call({ tool: 'SendUserFile', files: [path], status: 'normal', display: 'render' })

    return (
      <Box flexDirection="column">
        {list.length === 0 && (
          <Text dimColor>아직 만든 이미지·HTML 파일이 없어요.</Text>
        )}
        {list.map(file => (
          <Button
            key={file.path}
            label={`${iconOf(file.name)} ${file.name}`}
            onPress={() => open(file.path)}
          />
        ))}
      </Box>
    )
  })
}
