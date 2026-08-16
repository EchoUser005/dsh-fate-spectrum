import { readFile } from 'node:fs/promises'

import { describe, expect, it } from 'vitest'

interface PackageManifest {
  type?: unknown
  packageManager?: unknown
  engines?: {
    node?: unknown
    pnpm?: unknown
  }
}

describe('official DSH foundation baseline', () => {
  it('pins the approved Node.js, pnpm, and ESM settings', async () => {
    const manifestUrl = new URL('../package.json', import.meta.url)
    const nodeVersionUrl = new URL('../.node-version', import.meta.url)
    const manifest = JSON.parse(await readFile(manifestUrl, 'utf8')) as PackageManifest
    const nodeVersion = (await readFile(nodeVersionUrl, 'utf8')).trim()

    expect(nodeVersion).toBe('24.19.0')
    expect(manifest.type).toBe('module')
    expect(manifest.packageManager).toBe('pnpm@11.7.0')
    expect(manifest.engines).toEqual({
      node: '^22.19.0 || >=24.0.0',
      pnpm: '11.7.0',
    })
  })
})
