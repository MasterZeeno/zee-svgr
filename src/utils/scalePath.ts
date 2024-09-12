import { chunkArray, stringify } from './util'
import parse from './parse'

export interface ScaleOptions {
  scaleFactorX?: number
  scaleFactorY?: number
  floatPrecision?: number
}

interface PathCommand {
  command: string
  values: number[]
}

export default (node: any, { scaleFactorX = 1, scaleFactorY, floatPrecision = 3 }: ScaleOptions = {}): string => {
  const path = parse(node)

  const doValue = (val: number): number => (floatPrecision ? +val.toFixed(floatPrecision) : val)
  const _x = scaleFactorX
  const _y = scaleFactorY || scaleFactorX

  const scaled = path.map(({ command, values }: PathCommand) => {
    const c = command.toLowerCase()

    if (c === 'v' || c === 'h') {
      const [val] = values
      return {
        command,
        values: [doValue(val * (c === 'v' ? _y : _x))],
      }
    }

    if (c === 'a') {
      const chunked = chunkArray(values, 7)
      const v = chunked.reduce<number[]>((acc, next) => {
        const [rx, ry, xAxisRotation, largeArcFlag, sweepFLag, x, y] = next
        return [
          ...acc,
          doValue(rx * _x),
          doValue(ry * _y),
          xAxisRotation,
          largeArcFlag,
          sweepFLag,
          doValue(x * _x),
          doValue(y * _y),
        ]
      }, [])

      return {
        command,
        values: v,
      }
    }

    return {
      command,
      values: values.map((val, i) => doValue(val * (i % 2 ? _y : _x))),
    }
  })

  return stringify(scaled)
}