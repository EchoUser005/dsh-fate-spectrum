import { spawn, spawnSync } from 'node:child_process'
import { createServer } from 'node:net'
import { access, readFile, rm } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const packageJson = JSON.parse(await readFile(resolve(repositoryRoot, 'package.json'), 'utf8'))
const tarballPath = resolve(
  repositoryRoot,
  `.local/pack/${packageJson.name}-${packageJson.version}.tgz`,
)
const dshHome = resolve(repositoryRoot, '.local/dsh-home-package-smoke')

await access(tarballPath)
await rm(dshHome, { recursive: true, force: true })

const environment = { ...process.env, DSH_HOME: dshHome }
runPnpm(['exec', 'dsh', 'plugin', '--profile', 'web', 'add', tarballPath], environment)

const profileManifestPath = resolve(dshHome, 'profiles/web/package.json')
const profileManifest = JSON.parse(await readFile(profileManifestPath, 'utf8'))
if (profileManifest.dependencies?.[packageJson.name] === undefined) {
  throw new Error(`干净 Profile 没有记录 ${packageJson.name} 依赖`)
}
if (!profileManifest.dsh?.profile?.bundles?.includes(packageJson.name)) {
  throw new Error(`${packageJson.name} 没有自动加入 dsh.profile.bundles`)
}

const dump = runPnpm(['exec', 'dsh', '--profile', 'web', '--dump-config'], environment, 'pipe')
if (!dump.includes(`# == ${packageJson.name}`) || !dump.includes('id: fate-spectrum')) {
  throw new Error(`组合配置中没有出现 ${packageJson.name} Bundle 层`)
}

const port = await getAvailablePort()
await smokeWebProfile(environment, port)

console.log(`DSH tarball smoke 通过：${packageJson.name}@${packageJson.version}`)
console.log(`Profile：${profileManifestPath}`)
console.log(`Web：http://127.0.0.1:${port}`)

function pnpmCommand(args) {
  const pnpmScript = process.env.npm_execpath
  return pnpmScript
    ? { command: process.execPath, args: [pnpmScript, ...args] }
    : { command: 'pnpm', args }
}

function runPnpm(args, env, stdio = 'inherit') {
  const command = pnpmCommand(args)
  const result = spawnSync(command.command, command.args, {
    cwd: repositoryRoot,
    env,
    encoding: 'utf8',
    stdio,
  })

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `pnpm ${args.join(' ')} 执行失败`)
  }
  return stdio === 'pipe' ? result.stdout : ''
}

async function getAvailablePort() {
  const server = createServer()
  await new Promise((resolvePromise, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolvePromise)
  })
  const address = server.address()
  if (address === null || typeof address === 'string') throw new Error('无法分配本地测试端口')
  await new Promise((resolvePromise) => server.close(resolvePromise))
  return address.port
}

async function smokeWebProfile(env, port) {
  const command = pnpmCommand(['exec', 'dsh', '--profile', 'web', '--port', String(port)])
  const child = spawn(command.command, command.args, {
    cwd: repositoryRoot,
    env,
    detached: process.platform !== 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  let output = ''
  child.stdout.on('data', (chunk) => (output += chunk.toString()))
  child.stderr.on('data', (chunk) => (output += chunk.toString()))

  try {
    const deadline = Date.now() + 30_000
    while (Date.now() < deadline) {
      if (child.exitCode !== null) throw new Error(`DSH Web 提前退出：\n${output}`)
      try {
        const response = await fetch(`http://127.0.0.1:${port}`)
        if (response.ok) return
      } catch {
        // 等待 Web Profile 完成启动。
      }
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 250))
    }
    throw new Error(`DSH Web 未在 30 秒内就绪：\n${output}`)
  } finally {
    if (child.exitCode === null) {
      if (process.platform === 'win32') child.kill('SIGTERM')
      else process.kill(-child.pid, 'SIGTERM')
    }
    await Promise.race([
      new Promise((resolvePromise) => child.once('exit', resolvePromise)),
      new Promise((resolvePromise) => setTimeout(resolvePromise, 5_000)),
    ])
  }
}
