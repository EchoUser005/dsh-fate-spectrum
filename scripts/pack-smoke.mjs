import { execFileSync } from 'node:child_process'
import { mkdir, readFile, rm } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const packageJson = JSON.parse(await readFile(resolve(repositoryRoot, 'package.json'), 'utf8'))
const packDirectory = resolve(repositoryRoot, '.local/pack')
const tarballName = `${packageJson.name}-${packageJson.version}.tgz`
const tarballPath = resolve(packDirectory, tarballName)

await mkdir(packDirectory, { recursive: true })
await rm(tarballPath, { force: true })

runPnpm(['pack', '--pack-destination', packDirectory])

const tarEnvironment = { ...process.env, LC_ALL: 'C' }
const entries = execFileSync('tar', ['-tzf', tarballPath], {
  encoding: 'utf8',
  env: tarEnvironment,
})
  .trim()
  .split('\n')
  .filter(Boolean)

const requiredEntries = [
  'package/package.json',
  'package/cordis.patch.yml',
  'package/lib/index.js',
  'package/lib/index.d.ts',
  'package/README.md',
  'package/LICENSE',
  'package/THIRD_PARTY_NOTICES.md',
]

for (const entry of requiredEntries) {
  if (!entries.includes(entry)) throw new Error(`发布包缺少 ${entry}`)
}

const forbiddenPrefixes = [
  'package/src/',
  'package/tests/',
  'package/.local/',
  'package/docs/develop/',
]
for (const entry of entries) {
  if (forbiddenPrefixes.some((prefix) => entry.startsWith(prefix))) {
    throw new Error(`发布包包含不应分发的路径：${entry}`)
  }
}

const packedManifest = JSON.parse(
  execFileSync('tar', ['-xOf', tarballPath, 'package/package.json'], {
    encoding: 'utf8',
    env: tarEnvironment,
  }),
)

if (packedManifest.name !== packageJson.name || packedManifest.version !== packageJson.version) {
  throw new Error(`发布包名称或版本不是 ${packageJson.name}@${packageJson.version}`)
}
if (packedManifest.private === true) throw new Error('发布包仍被标记为 private')
if (packedManifest.dsh?.bundle?.patch !== './cordis.patch.yml') {
  throw new Error('发布包缺少正确的 dsh.bundle.patch')
}

const packedPatch = execFileSync('tar', ['-xOf', tarballPath, 'package/cordis.patch.yml'], {
  encoding: 'utf8',
  env: tarEnvironment,
})
if (
  !packedPatch.includes('id: fate-spectrum') ||
  !packedPatch.includes(`name: ${packageJson.name}`)
) {
  throw new Error('发布包的 Cordis patch 没有注册 dsh-fate-spectrum')
}

console.log(`发布包检查通过：${tarballPath}`)
console.log(`文件数：${entries.length}`)

function runPnpm(args) {
  const pnpmScript = process.env.npm_execpath
  if (pnpmScript) {
    execFileSync(process.execPath, [pnpmScript, ...args], {
      cwd: repositoryRoot,
      stdio: 'inherit',
    })
    return
  }

  execFileSync('pnpm', args, { cwd: repositoryRoot, stdio: 'inherit' })
}
