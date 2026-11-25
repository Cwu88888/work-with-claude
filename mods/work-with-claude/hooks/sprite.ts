import type { PetMode } from '../types'

// Pixel grid: 17 x 15. Legend:
// B body  D body shade  E eye/mouth  W eye shine  Y yellow  G green  . empty
export const W = 17
export const H = 15

export const COLORS: Record<string, string> = {
  B: '#D97757', // Claude orange
  D: '#B85C3E',
  E: '#2A1A14',
  W: '#FFFFFF',
  Y: '#F5C542',
  G: '#5BBF6A',
  S: '#16161A', // sunglasses
  P: '#F4EBD6', // book page
  K: '#7A4B2E', // book spine
  N: '#9C8F78', // text lines
}

export function sprite(mode: PetMode, t: number): string[] {
  const g: string[][] = Array.from({ length: H }, () => Array(W).fill('.'))
  const put = (x: number, y: number, c: string) => {
    if (x >= 0 && x < W && y >= 0 && y < H) g[y][x] = c
  }
  const rect = (x: number, y: number, w: number, h: number, c: string, dx = 0) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(x + i + dx, y + j, c)
  }

  const step = t % 2
  const dx = mode === 'asking' ? (step ? 1 : -1) : 0
  const dy = mode === 'working' ? step : mode === 'done' ? (step ? -2 : -1) : 0
  const top = 4 + dy

  // body + shade
  rect(3, top, 11, 6, 'B', dx)
  rect(3, top + 5, 11, 1, 'D', dx)

  // arms: typing when working, raised when done / asking
  let armL = 2
  let armR = 2
  if (mode === 'working') {
    armL = step ? 1 : 3
    armR = step ? 3 : 1
  } else if (mode === 'done') {
    armL = 0
    armR = 0
  } else if (mode === 'asking') {
    armR = 0
  }
  rect(1, top + armL, 2, 2, 'B', dx)
  rect(14, top + armR, 2, 2, 'B', dx)

  // legs (fixed on the ground); walk while working
  const legTops = [10, 10, 10, 10]
  const longA = mode !== 'working' || step === 0
  const legH = (i: number) => (mode === 'working' ? ((i % 2 === 0) === longA ? 2 : 1) : 2)
  ;[4, 6, 10, 12].forEach((x, i) => rect(x, legTops[i], 1, legH(i), 'D', dx))

  // face
  if (mode === 'done') {
    ;[4, 10].forEach(x => {
      put(x, top + 2, 'E')
      put(x + 1, top + 1, 'E')
      put(x + 2, top + 2, 'E')
    })
    rect(7, top + 4, 3, 1, 'E', dx)
  } else if (mode === 'asking') {
    ;[5, 11].forEach(x => {
      rect(x, top + 1, 2, 3, 'E', dx)
      put(x + dx, top + 1, 'W')
    })
  } else if (mode === 'idle') {
    // cool: sunglasses, reading a book
    rect(4, top + 1, 3, 2, 'S', dx)
    rect(10, top + 1, 3, 2, 'S', dx)
    rect(7, top + 1, 3, 1, 'S', dx)
    if (t % 8 < 2) put(4, top + 1, 'W')
    rect(4, top + 3, 4, 3, 'P', dx)
    rect(8, top + 3, 1, 3, 'K', dx)
    rect(9, top + 3, 4, 3, 'P', dx)
    if (t % 8 === 5) rect(9, top + 2, 3, 1, 'P', dx)
    const l = t % 2 === 0
    rect(5, top + 4, l ? 2 : 1, 1, 'N', dx)
    rect(10, top + 4, l ? 1 : 2, 1, 'N', dx)
  } else {
    rect(5, top + 2, 1, 2, 'E', dx)
    rect(11, top + 2, 1, 2, 'E', dx)
  }

  // symbols
  if (mode === 'working') {
    const dots = (t % 3) + 1
    for (let i = 0; i < dots; i++) put(6 + i * 2, 1, 'Y')
  } else if (mode === 'done') {
    const a = step ? 0 : 1
    put(1, 2 + a, 'Y')
    put(15, 3 - a, 'Y')
    put(0, 5, 'G')
    put(16, 6, 'G')
  } else if (mode === 'asking') {
    rect(8, 0, 1, 2, 'Y')
    put(8, 3, 'Y')
  }

  return g.map(r => r.join(''))
}

export function svg(grid: string[], px: number): string {
  let rects = ''
  grid.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const c = row[x]
      if (c === '.') {
        x++
        continue
      }
      let n = 1
      while (x + n < row.length && row[x + n] === c) n++
      rects += `<rect x="${x}" y="${y}" width="${n}" height="1" fill="${COLORS[c]}"/>`
      x += n
    }
  })
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W * px}" height="${H * px}" shape-rendering="crispEdges">${rects}</svg>`
}

export const LABEL: Record<PetMode, string> = {
  idle: 'Clawd 看书中…',
  working: 'Clawd 正在干活…',
  done: 'Clawd：搞定啦！',
  asking: 'Clawd：需要你回复！',
}
export const LABEL_COLOR: Record<PetMode, string> = {
  idle: '#9A9A9A',
  working: '#D97757',
  done: '#5BBF6A',
  asking: '#F5C542',
}
