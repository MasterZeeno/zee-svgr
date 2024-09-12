/// <reference types="vitest" />
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import webfontDownload from 'vite-plugin-webfont-dl'
import camelCase from 'camelcase'
import packageJson from './package.json'

const packageName = packageJson.name.split('/').pop() || packageJson.name

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src', 'lib', `${packageName}.ts`),
      formats: ['es', 'cjs', 'umd', 'iife'],
      name: camelCase(packageName, {
        pascalCase: true
      }),
      fileName: packageName
    }
  },
  rollupOptions: {
    external: ['svgo'],
    output: {
      globals: {
        svgo: 'SVGO'
      }
    }
  },
  plugins: [
    dts({
      rollupTypes: true
    }),
    webfontDownload([
      "https://fonts.googleapis.com/css2?family=Tilt+Warp&display=swap"
    ])
  ],
  test: {},
})