import { calcValue, chunkArray } from './util'

interface Attributes {
  width?: string | number
  height?: string | number
  x?: string | number
  y?: string | number
  rx?: string | number
  ry?: string | number
  cx?: string | number
  cy?: string | number
  r?: string | number
  points?: string
  x1?: string | number
  y1?: string | number
  x2?: string | number
  y2?: string | number
  d?: string
}

function rect(attrs: Attributes): string[] {
  const w = +attrs.width!
  const h = +attrs.height!
  const x = attrs.x ? +attrs.x : 0
  const y = attrs.y ? +attrs.y : 0
  let rx: string | number = attrs.rx || 'auto'
  let ry: string | number = attrs.ry || 'auto'

  if (rx === 'auto' && ry === 'auto') {
    rx = ry = 0
  } else if (rx !== 'auto' && ry === 'auto') {
    rx = ry = calcValue(rx, w)
  } else if (ry !== 'auto' && rx === 'auto') {
    ry = rx = calcValue(ry, h)
  } else {
    rx = calcValue(rx, w)
    ry = calcValue(ry, h)
  }

  if (rx > w / 2) {
    rx = w / 2
  }
  if (ry > h / 2) {
    ry = h / 2
  }

  const hasCurves = rx > 0 && ry > 0

  return [
    `M${x + rx} ${y}`,
    `H${x + w - rx}`,
    ...(hasCurves ? [`A${rx} ${ry} 0 0 1 ${x + w} ${y + ry}`] : []),
    `V${y + h - ry}`,
    ...(hasCurves ? [`A${rx} ${ry} 0 0 1 ${x + w - rx} ${y + h}`] : []),
    `H${x + rx}`,
    ...(hasCurves ? [`A${rx} ${ry} 0 0 1 ${x} ${y + h - ry}`] : []),
    `V${y + ry}`,
    ...(hasCurves ? [`A${rx} ${ry} 0 0 1 ${x + rx} ${y}`] : []),
    'z',
  ]
}

function ellipse(attrs: Attributes): string[] {
  const cx = +attrs.cx!
  const cy = +attrs.cy!
  const rx = attrs.rx ? +attrs.rx : +attrs.r!
  const ry = attrs.ry ? +attrs.ry : +attrs.r!
  return [
    `M${cx + rx} ${cy}`,
    `A${rx} ${ry} 0 0 1 ${cx} ${cy + ry}`,
    `A${rx} ${ry} 0 0 1 ${cx - rx} ${cy}`,
    `A${rx} ${ry} 0 0 1 ${cx + rx} ${cy}`,
    'z',
  ]
}

function line({ x1, y1, x2, y2 }: Attributes): string[] {
  return [`M${+x1!} ${+y1!}`, `L${+x2!} ${+y2!}`]
}

function poly(attrs: Attributes): string[] {
  const { points } = attrs
  const pointsArray = points!
    .trim()
    .split(' ')
    .reduce<string[]>((arr, point) => {
      return [...arr, ...(point.includes(',') ? point.split(',') : [point])]
    }, [])

  const pairs = chunkArray(pointsArray, 2)
  return pairs.map(([x, y], i) => {
    return `${i === 0 ? 'M' : 'L'}${x} ${y}`
  })
}

function toPathString(d: string[] | undefined): string {
  return Array.isArray(d) ? d.join(' ') : ''
}

interface Node {
  name?: string
  attributes?: Attributes
  [key: string]: any
}

export default (
  node: Node,
  { nodeName = 'name', nodeAttrs = 'attributes' }: { nodeName?: string, nodeAttrs?: string } = {},
): string => {
  const name = node[nodeName]
  const attributes = node[nodeAttrs]
  let d: string[] | undefined

  if (name === 'rect') {
    d = rect(attributes!)
  }

  if (name === 'circle' || name === 'ellipse') {
    d = ellipse(attributes!)
  }

  if (name === 'line') {
    d = line(attributes!)
  }

  if (name === 'polyline') {
    d = poly(attributes!)
  }

  if (name === 'polygon') {
    d = [...poly(attributes!), 'Z']
  }

  if (name === 'path') {
    return attributes!.d!
  }

  return toPathString(d)
}
