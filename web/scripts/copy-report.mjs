import { cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// Publish the review artifact beside the landing page without adding it to the learning flow.
const root = fileURLToPath(new URL('../..', import.meta.url))
const source = path.join(root, 'docs/redesign-2026-09-08')
const target = path.join(root, 'web/dist/update-report')
await mkdir(target, { recursive: true })
await cp(source, target, { recursive: true })
const html = await readFile(path.join(target, 'index.html'), 'utf8')
const repo = 'https://github.com/dikemanarndellst703-star/sen-3d-resume/blob/v2.0.0/'
await writeFile(path.join(target, 'index.html'), html.replaceAll('href="../../', `href="${repo}`))
console.log('Published comparison report at ./update-report/')
