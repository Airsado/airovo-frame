#!/usr/bin/env node
/**
 * create-airovo-app — Scaffold a new Airovo business app.
 *
 * Usage:
 *   pnpm create airovo-app my-app
 *   pnpm create airovo-app
 *
 * Creates a copy of the `template/` directory at the target path with
 * placeholders substituted (e.g. `__APP_NAME__`).
 *
 * Minimal intentional scope: copy a working Vite + Vue 3 + shadcn-vue
 * starter that boots with one `pnpm dev`.
 */
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..')
const TEMPLATE_DIR = path.resolve(__dirname, '..', 'template')

interface CLIOptions {
    name: string
    target: string
    typescript: boolean
}

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
    const arg = process.argv[2]
    const name = await promptName(arg)
    const target = path.resolve(process.cwd(), name)

    if (await exists(target)) {
        console.error(`❌ Target directory already exists: ${target}`)
        process.exit(1)
    }

    if (!(await exists(TEMPLATE_DIR))) {
        console.error(`❌ Template not found: ${TEMPLATE_DIR}`)
        process.exit(1)
    }

    const replacements = {
        __APP_NAME__: name,
        __APP_TITLE__: name,
    }

    console.log(`📦 Scaffolding ${name} from template...`)
    await copyDir(TEMPLATE_DIR, target, replacements)

    console.log(`\n✅ Done! Next steps:\n`)
    console.log(`  cd ${name}`)
    console.log(`  pnpm install`)
    console.log(`  pnpm dev`)
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
