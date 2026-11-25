import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Pet, PetMode } from '../types'
import { COLORS, LABEL, LABEL_COLOR, sprite, svg } from './sprite'

const PANE = 'clawd'
const pet = atom({ plugin: 'work-with-claude', key: 'pet' } as const, {
  mode: 'idle',
  tick: 0,
} as Pet)

let seq = 0
let reply = ''
let home = ''
function share($: any, mode: PetMode) {
  seq += 1
  void $.fs
    .write(`${home}/.claude/clawd-state.json`, JSON.stringify({ mode, seq, reply }))
    .catch(() => {})
}

function setMode($: any, mode: PetMode) {
  share($, mode)
  return update($, pet, (p: Pet) => ({ mode, tick: p.tick }))
}

function draw($: any, e: any, p: Pet, px: number) {
  const { Box, Text, Svg } = $.ui.resolve(e)
  const grid = sprite(p.mode, p.tick)

  if (e.surface === 'terminal') {
    // Half-block pixels: one text row = two pixel rows, two columns per pixel.
    const rows = []
    for (let y = 0; y < grid.length; y += 2) {
      const cells = []
      for (let x = 0; x < grid[y].length; x++) {
        const top = COLORS[grid[y][x]]
        const bot = COLORS[grid[y + 1]?.[x] ?? '.']
        cells.push(
          top || bot ? (
            <Text color={top ?? bot} backgroundColor={top ? bot : undefined}>
              {top ? '▀▀' : '▄▄'}
            </Text>
          ) : (
            <Text>{'  '}</Text>
          ),
        )
      }
      rows.push(<Box>{cells}</Box>)
    }
    return <Box flexDirection="column">{rows}</Box>
  }

  return <Svg source={svg(grid, px)} alt={LABEL[p.mode as PetMode]} />
}


export const register: Register = on => {
  let doneAt = 0
  let lastInbox = 0

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'clawd',
      description: 'Open the big Clawd pet pane',
    })
    home = (await $.env.get('HOME')) ?? ''
    // Bring the desktop pet up with the session (once: pgrep guards a second).
    void $.process
      .run([
        '/bin/sh',
        '-c',
        'pgrep -x ClawdDesk >/dev/null || [ ! -x "$HOME/ClawdDesk/ClawdDesk" ] || (nohup "$HOME/ClawdDesk/ClawdDesk" >/dev/null 2>&1 &)',
      ])
      .catch(() => {})

    // Messages typed into the pet's chat box arrive in this file.
    const inbox = `${home}/.claude/clawd-inbox.json`
    try {
      lastInbox = JSON.parse(await $.fs.read(inbox)).seq ?? 0
    } catch {
      lastInbox = 0
    }
    $.clock.every(800, async () => {
      try {
        const m = JSON.parse(await $.fs.read(inbox))
        if (m.seq > lastInbox && typeof m.text === 'string' && m.text.trim()) {
          lastInbox = m.seq
          await $.prompt.submit({ text: m.text })
        }
      } catch {}
    })

    $.clock.every(450, async () => {
      const p = await read($, pet)
      if (p.mode === 'done' && (await $.clock.now()) - doneAt > 8000) {
        share($, 'idle')
        await update($, pet, () => ({ mode: 'idle', tick: 0 }))
        return
      }
      // idle only redraws for the occasional blink
      if (p.mode === 'idle' && p.tick % 8 !== 6) {
        await update($, pet, q => ({ ...q, tick: q.tick + 1 }))
        return
      }
      await update($, pet, q => ({ ...q, tick: q.tick + 1 }))
    })
    return next(e)
  })

  on('command.run', { command: 'clawd' }, async $ => {
    await $.ui.open({ id: PANE, title: 'Clawd' })
    return { text: 'Clawd 出来啦。' }
  })

  on('turn.start', async ($, e, next) => {
    await setMode($, 'working')
    return next(e)
  })

  on('prompt.submit', async ($, e, next) => {
    await setMode($, 'working')
    return next(e)
  })

  // The model asks you a question: Clawd waves a "!" until you answer.
  on('tool.call', { tool: 'AskUserQuestion' }, async ($, e, next) => {
    await setMode($, 'asking')
    $.ui.toast('Clawd：需要你回复！')
    void $.ui.notify('Claude 需要你回复', { title: 'Clawd' })
    const ran = await next(e)
    await setMode($, 'working')
    return ran
  })

  // Permission prompts and idle-waiting notifications from Claude Code itself.
  on('classic.Notification', async ($, e, next) => {
    // Only a real ask (permission or a question dialog) waves the "!";
    // idle-waiting and other pings leave Clawd reading.
    const kind = String(e.notification_type ?? '')
    if (!/permission|elicitation/i.test(kind)) return next(e)
    await setMode($, 'asking')
    $.ui.toast(`Clawd：${e.message || '需要你回复！'}`)
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    doneAt = await $.clock.now()
    if (e.reason === 'answer') {
      reply = String(e.text ?? '').replace(/\s+/g, ' ').trim().slice(0, 60)
      await setMode($, 'done')
      $.ui.toast('Clawd：搞定啦！')
      void $.ui.notify('Claude 完成了任务', { title: 'Clawd' })
    } else {
      await setMode($, 'idle')
    }
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const p = await read($, pet)
    const { Box, Text } = $.ui.resolve(e)
    return (
      <Box alignItems="center" gap={1}>
        {draw($, e, p, 3)}
        <Text color={LABEL_COLOR[p.mode]} weight="bold">
          {LABEL[p.mode]}
        </Text>
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const p = await read($, pet)
    const { Box, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="column" alignItems="center" gap={1}>
        {draw($, e, p, 10)}
        <Text color={LABEL_COLOR[p.mode]} weight="bold">
          {LABEL[p.mode]}
        </Text>
      </Box>
    )
  })
}
