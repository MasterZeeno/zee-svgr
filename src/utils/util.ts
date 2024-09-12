export function chunkArray<T>(arr: T[], size: number = 2): T[][] {
  const results: T[][] = []
  while (arr.length) {
    results.push(arr.splice(0, size))
  }
  return results
}

export function calcValue(val: string | number, base: number): number {
  return typeof val === 'string' && val.endsWith('%')
    ? (Number.parseFloat(val.replace('%', '')) * base) / 100
    : +val
}

interface PathCommand {
  command: string
  values: (string | number)[]
}

export function stringify(path: PathCommand[]): string {
  return path.reduce((acc, next) => {
    return `${acc}${next.command}${next.values.join(' ')}`
  }, '')
}
