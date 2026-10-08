import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export function validateCatalog(labels) {
  if (!Array.isArray(labels) || labels.length === 0) throw new Error('Label catalog must be a non-empty array')
  const names = new Set()
  for (const label of labels) {
    if (typeof label.name !== 'string' || !label.name.trim() || label.name.length > 50) throw new Error('Invalid label name')
    if (!/^[0-9a-f]{6}$/i.test(label.color)) throw new Error(`Invalid color for ${label.name}`)
    if (typeof label.description !== 'string' || label.description.length > 100) throw new Error(`Invalid description for ${label.name}`)
    const key = label.name.toLowerCase()
    if (names.has(key)) throw new Error(`Duplicate label: ${label.name}`)
    names.add(key)
  }
  return labels
}

export function planLabelChanges(catalog, current) {
  validateCatalog(catalog)
  const existing = new Map(current.map(label => [label.name.toLowerCase(), label]))
  // Only catalog entries are managed. Unlisted labels are never deleted.
  return catalog.flatMap(label => {
    const previous = existing.get(label.name.toLowerCase())
    if (!previous) return [{ action: 'create', label }]
    if (previous.name === label.name && previous.color.toLowerCase() === label.color.toLowerCase()
      && (previous.description ?? '') === label.description) return []
    return [{ action: 'update', previousName: previous.name, label }]
  })
}

export async function syncLabels(catalog, api, apply = false) {
  const current = []
  for (let page = 1; ; page++) {
    const batch = await api(`labels?per_page=100&page=${page}`)
    if (!Array.isArray(batch)) throw new Error('Unexpected labels response')
    current.push(...batch)
    if (batch.length < 100) break
  }
  const changes = planLabelChanges(catalog, current)
  if (!apply) return changes
  // Keep writes sequential and use the additive label-definition endpoints.
  for (const change of changes) {
    const { name, color, description } = change.label
    if (change.action === 'create') await api('labels', 'POST', { name, color, description })
    else await api(`labels/${encodeURIComponent(change.previousName)}`, 'PATCH', { new_name: name, color, description })
  }
  return changes
}

function parseArgs(args) {
  const options = { repo: process.env.GITHUB_REPOSITORY, apply: false }
  let mode
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--help') return { help: true }
    if (arg === '--repo') options.repo = args[++i]
    else if (arg === '--check' || arg === '--apply') {
      if (mode) throw new Error('Choose only one of --check or --apply')
      mode = arg
      options.apply = arg === '--apply'
    } else throw new Error(`Unknown option: ${arg}`)
  }
  if (!/^[\w-]+\/[a-z0-9][\w.-]*$/i.test(options.repo ?? '')) throw new Error('Specify --repo OWNER/REPO or GITHUB_REPOSITORY')
  return options
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    console.log('Usage: node scripts/sync-github-labels.mjs --repo OWNER/REPO [--check | --apply]')
    console.log('Provide GITHUB_TOKEN through the environment; --apply requires permission to manage repository labels.')
    return
  }
  const catalog = validateCatalog(JSON.parse(await readFile(new URL('../.github/labels.json', import.meta.url), 'utf8')))
  const token = process.env.GITHUB_TOKEN
  if (!token) throw new Error('Provide GITHUB_TOKEN through the environment; do not put it in command arguments or files')
  const api = async (path, method = 'GET', payload) => {
    const response = await fetch(`https://api.github.com/repos/${options.repo}/${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', 'X-GitHub-Api-Version': '2022-11-28' },
      body: payload === undefined ? undefined : JSON.stringify(payload),
      signal: AbortSignal.timeout(20000),
    })
    if (!response.ok) throw new Error(`GitHub HTTP ${response.status} (${method} ${path})`)
    return response.json()
  }
  const changes = await syncLabels(catalog, api, options.apply)
  for (const change of changes) console.log(`${options.apply ? 'applied' : 'pending'} ${change.action}: ${change.label.name}`)
  console.log(`${options.repo}: ${changes.length} ${options.apply ? 'applied changes' : 'pending changes'}; unlisted labels preserved`)
  if (changes.length && !options.apply) process.exitCode = 1
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch(error => { console.error(error.message); process.exitCode = 1 })
}
