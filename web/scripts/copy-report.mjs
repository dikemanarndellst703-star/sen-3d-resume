import { cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// Each version keeps a separate, shareable comparison report and its own source tag.
const root = fileURLToPath(new URL('../..', import.meta.url))
for (const [folder, route, version] of [
  ['redesign-2026-09-08', 'update-report', 'v2.0.0'],
  ['redesign-v3-2026-09-08', 'update-report-v3', 'v3.0.0'],
  ['redesign-v4-clay-2026-09-08', 'update-report-v4', 'v4.0.0'],
]) {
  const source = path.join(root, 'docs', folder)
  const target = path.join(root, 'web/dist', route)
  await mkdir(target, { recursive: true })
  await cp(source, target, { recursive: true })
  const html = await readFile(path.join(target, 'index.html'), 'utf8')
  const repo = `https://github.com/dikemanarndellst703-star/sen-3d-resume/blob/${version}/`
  await writeFile(path.join(target, 'index.html'), html.replaceAll('href="../../', `href="${repo}`))
  console.log(`Published ${version} comparison report at ./${route}/`)
}
