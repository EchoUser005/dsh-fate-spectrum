import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outputPath = resolve(repositoryRoot, '.local/dsh/cordis.dev.yml')
const entryPath = resolve(repositoryRoot, 'lib/index.js').replaceAll("'", "''")
const contents = `- insert:\n    - id: fate-spectrum\n      name: '${entryPath}'\n`

await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, contents, 'utf8')
console.log(outputPath)
