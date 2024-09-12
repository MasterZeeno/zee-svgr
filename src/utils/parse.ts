import toPath from './toPath'

const paramCounts: Record<string, number> = {
  a: 7,
  c: 6,
  h: 1,
  l: 2,
  m: 2,
  r: 4,
  q: 4,
  s: 4,
  t: 2,
  v: 1,
  z: 0,
}

function checkValues(command: string, values: string[]): boolean {
  const c = command.toLowerCase()
  return Object.prototype.hasOwnProperty.call(paramCounts, c)
    ? values.length === paramCounts[c] || values.length % paramCounts[c] === 0
    : false
}

export default (node: any): Array<{ command: string, values: number[] }> => {
  const path: string = toPath(node)
  const re = /([MLSQHVCTAZ])([^MLSQHVCTAZ]*)/gi
  const num = /-?\d*\.?\d+/g
  const results: Array<{ command: string, values: number[] }> = []

  path.replace(re, (match: string, command: string, params: string) => {
    const values = params.match(num) || []
    if (checkValues(command, values)) {
      results.push({ command, values: values.map((v) => +v) })
    }
    return match // Return the original match
  })

  return results
}
