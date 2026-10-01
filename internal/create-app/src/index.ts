#!/usr/bin/env node
/**
 * App scaffold CLI — create a new business app.
 *
 * Usage:
 *   pnpm create:app my-app
 *   pnpm create:app
 *
 * Creates `apps/<name>` in this workspace with template placeholders
 * substituted (e.g. `__APP_NAME__`).
 *
 * The template uses workspace and catalog dependencies, so it cannot be
 * installed as a standalone project outside this repository.
 */
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TEMPLATE_DIR = path.resolve(__dirname, '..', 'template')

async function promptName(arg: string | undefined): Promise<string> {
    if (arg) return arg
    process.stdout.write('App name: ')
    return new Promise((resolve) => {
        let input = ''
        process.stdin.setEncoding('utf8')
        process.stdin.on('data', (chunk) => {
            input += chunk
            const value = input.trim()
            if (value) {
                process.stdin.pause()
                resolve(value)
            }
        })
    })
}

async function exists(p: string): Promise<boolean> {
    try {
        await fs.access(p)
        return true
    } catch {
        return false
    }
}

async function findWorkspaceRoot(start: string): Promise<string | null> {
    let current = path.resolve(start)
    for (;;) {
        if (await exists(path.join(current, 'pnpm-workspace.yaml'))
            && await exists(path.join(current, 'internal', 'create-app', 'template', 'package.json'))
            && await exists(path.join(current, 'apps'))) {
            return current
        }
        const parent = path.dirname(current)
        if (parent === current) return null
        current = parent
    }
}

function appName(value: string): string {
    const name = value.replace(/^apps[\\/]/, '')
    if (!/^[a-z][a-z0-9-]*$/.test(name)) {
        throw new Error('App name must start with a lowercase letter and contain only lowercase letters, digits and hyphens.')
    }
    return name
}

async function copyDir(src: string, dest: string, replacements: Record<string, string>) {
    await fs.mkdir(dest, { recursive: true })
    const entries = await fs.readdir(src, { withFileTypes: true })
    for (const entry of entries) {
        const from = path.join(src, entry.name)
        const to = path.join(dest, entry.name)
        if (entry.isDirectory()) {
            await copyDir(from, to, replacements)
        } else {
            let content = await fs.readFile(from, 'utf8')
            for (const [k, v] of Object.entries(replacements)) {
                content = content.split(k).join(v)
            }
            await fs.writeFile(to, content, 'utf8')
        }
    }
}

async function main() {
    const args = process.argv.slice(2)
    const dryRun = args.includes('--dry-run')
    const arg = args.find((value) => !value.startsWith('--'))
    const name = appName(await promptName(arg))
    const workspaceRoot = await findWorkspaceRoot(process.cwd())
    if (!workspaceRoot || ![workspaceRoot, path.join(workspaceRoot, 'apps')].includes(path.resolve(process.cwd()))) {
        throw new Error('Run this CLI from the repository root or its apps/ directory; the template requires workspace dependencies.')
    }
    const target = path.join(workspaceRoot, 'apps', name)

    if (await exists(target)) {
        throw new Error(`Target directory already exists: ${target}`)
    }

    if (!(await exists(TEMPLATE_DIR))) {
        throw new Error(`Template not found: ${TEMPLATE_DIR}`)
    }

    if (dryRun) {
        console.log(`Would create ${target}`)
        return
    }

    const replacements = {
        __APP_NAME__: name,
        __APP_TITLE__: name,
    }

    console.log(`Scaffolding ${name} in ${target}...`)
    await copyDir(TEMPLATE_DIR, target, replacements)

    console.log('\nDone. Next steps:\n')
    console.log(`  cd ${workspaceRoot}`)
    console.log(`  pnpm install`)
    console.log(`  Adjust .env, .env.development, or .env.production for API/title/port if needed`)
    console.log(`  pnpm --filter mock-api dev            # Nitro API at http://127.0.0.1:4174`)
    console.log(`  # In another terminal:`)
    console.log(`  pnpm --filter ${name} dev`)
}

main().catch((err) => {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
})
