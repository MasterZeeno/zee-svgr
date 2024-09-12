import fs from 'node:fs'
import { resolve, basename } from 'node:path'
import scalePath, { ScaleOptions } from '../utils/scalePath'
import cfg from '../config.json'

const { optimize, loadConfig, Config } = SVGO
const { parseSvg } = SVGO.lib.parser
const { stringifySvg } = SVGO.lib.stringifier

const config: Config = await loadConfig(cfg, __dirname)

interface ScaleConfig extends Config {
  customSize?: number
  scaleFactorX?: number
  scaleFactorY?: number
}

const resolveDir = (dirPath: string): string => {
  const absPath = resolve(__dirname, dirPath)
  if (!fs.existsSync(absPath)) {
    fs.mkdirSync(absPath, { recursive: true })
  }
  return absPath
}

const transformObj = (str: string): Record<string, number[]> => {
  return (
    str.match(/\w+\([^\)]+\)/g)?.reduce((acc, match) => {
      const [key, values] = match.split('(')
      acc[key] = values.slice(0, -1).split(' ').map(Number)
      return acc
    }, {} as Record<string, number[]>) || {}
  )
}

const scale = (svgString: string, opts: ScaleConfig): string => {
  const node: SvgNode = parseSvg(svgString)
  const { name, attributes } = node
  const num = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: opts.floatPrecision,
  }).format

  const customSize = opts.customSize || 16

  // Scale SVG elements
  if (name === 'svg' && (attributes.viewBox || attributes.width && attributes.height)) {
    const [w, h] = attributes.viewBox
      ? attributes.viewBox.split(' ').slice(2).map(Number)
      : [parseFloat(attributes.width), parseFloat(attributes.height)]
    const ar = w / h
    opts.scaleFactor = customSize / w

    node.attributes = {
      ...attributes,
      viewBox: `0 0 ${customSize} ${num(customSize / ar)}`,
    }

    if (w <= customSize) return stringifySvg(node, opts)
  }

  // Shapes processing
  const shapes = new Set(['circle', 'ellipse', 'line', 'path', 'polygon', 'polyline', 'rect'])
  if (shapes.has(name)) {
    const scaleAndAddPath = (o: SvgNode, conf: ScaleOptions = opts) => {
      o.attributes = { ...o.attributes, d: scalePath(o, conf) }
      o.name = 'path'
    }

    // Handle 'transform' and 'stroke-width' scaling
    for (const [attr, value] of Object.entries(attributes)) {
      if (attr === 'transform') {
        const transform = transformObj(value)
        if (transform.scale) {
          const [x = 1, y = x] = transform.scale
          scaleAndAddPath(node, { scaleFactor: x, scaleFactorY: y, floatPrecision: opts.floatPrecision })
        }
      }
      if (attr.match(/stroke(-width)?/)) {
        attributes[attr] = num(Number(value) * opts.scaleFactor!)
      }
      if (!/fill|stroke|opacity|d/.test(attr)) {
        delete attributes[attr]
      }
    }

    scaleAndAddPath(node, opts)
  } else if (node.children && Array.isArray(node.children)) {
    node.children = node.children.map((c) => scale(c, opts))
  }

  return stringifySvg(node, opts)
}

const process = (svgString: string, options: ScaleConfig): string => {
  const optimized = optimize(svgString, options).data
  const scaled = scale(optimized, options)
  return optimize(scaled, options).data
}

const processFiles = (files: string[]): string[] => {
  return files.filter((file) => /\.svg$/i.test(file))
}

const processDir = (dir: string): string[] => {
  const files = fs.readdirSync(dir).map((file) => resolve(dir, file))
  return processFiles(files)
}

const zeeSvgr = (svg: string, options?: ScaleConfig): void => {
  const inputPath = resolveDir('../input')
  const outputPath = resolveDir('../output')

  let inputs: string[]

  const stats = fs.statSync(svg)
  if (stats.isDirectory()) {
    inputs = processDir(svg)
  } else if (stats.isFile()) {
    inputs = processFiles([svg])
  } else {
    throw new Error('Invalid input')
  }

  const opts = options || config

  for (const input of inputs) {
    opts.path = input
    const svgString = fs.readFileSync(input, 'utf-8')
    const resultString = process(svgString, opts)
    fs.writeFileSync(resolve(outputPath, basename(input)), resultString, 'utf-8')
  }
}