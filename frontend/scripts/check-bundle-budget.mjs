import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const distAssetsDir = join(process.cwd(), 'dist', 'assets')
const maxGzipKb = Number(process.env.BUNDLE_MAX_GZIP_KB ?? 250)

function kb(bytes) {
  return bytes / 1024
}

const jsFiles = readdirSync(distAssetsDir).filter((name) => name.endsWith('.js'))
if (jsFiles.length === 0) {
  console.error('No JS assets found in dist/assets. Run npm run build first.')
  process.exit(1)
}

const entryCandidate = jsFiles.find((name) => /^index-.*\.js$/.test(name))
const targetFile =
  entryCandidate ??
  jsFiles
    .map((name) => ({ name, size: statSync(join(distAssetsDir, name)).size }))
    .sort((a, b) => b.size - a.size)[0]?.name

if (!targetFile) {
  console.error('Unable to determine target JS bundle for budget check.')
  process.exit(1)
}

const filePath = join(distAssetsDir, targetFile)
const content = readFileSync(filePath)
const rawBytes = content.byteLength
const gzipBytes = gzipSync(content).byteLength
const gzipKb = kb(gzipBytes)

console.log(
  `Bundle budget check: ${targetFile} raw=${kb(rawBytes).toFixed(1)}KB gzip=${gzipKb.toFixed(1)}KB limit=${maxGzipKb.toFixed(1)}KB`,
)

if (gzipKb > maxGzipKb) {
  console.error(`Bundle budget exceeded by ${(gzipKb - maxGzipKb).toFixed(1)}KB.`)
  process.exit(1)
}
