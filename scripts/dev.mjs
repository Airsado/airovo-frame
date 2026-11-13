import { spawn } from 'node:child_process'
import { readdir, readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import prompts from 'prompts'

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const help = `Usage: pnpm dev [app] [options]

  pnpm dev                         Select an app interactively
  pnpm dev my-app                  Start one app by package or directory name
  pnpm dev --app @scope/my-app      Start a scoped package
  pnpm dev playwright --mock        Start an app with the Nitro mock API
  pnpm dev:demo                     Start the demo with the mock API
  pnpm dev:all                      Start all apps (excluding internal tools)

Options:
  --app <name>   Application package name or apps/ directory name
  --mock         Also start apps/mock-api
  --all          Start every app with a dev script
  --list         List available apps without starting them
  --dry-run      Inspect the Turbo task graph without starting any services
  -h, --help     Show this help

To pass Vite options, use: pnpm --filter <package-name> dev --port 5180
`

/** Discover local apps too, including freshly scaffolded and Git-ignored apps. */
export async function discoverApps(root = workspaceRoot) {
    const appsDir = resolve(root, 'apps')
    const entries = await readdir(appsDir, { withFileTypes: true })
    const apps = []
    for (const entry of entries) {
        if (!entry.isDirectory() || entry.name.startsWith('.')) continue
        let manifest
        try {
            manifest = JSON.parse(await readFile(resolve(appsDir, entry.name, 'package.json'), 'utf8'))
        } catch (error) {
            if (error.code === 'ENOENT') continue
            throw new Error(`Cannot read apps/${entry.name}/package.json: ${error.message}`)
        }
        if (typeof manifest.scripts?.dev !== 'string' || !manifest.scripts.dev.trim()) continue
        if (typeof manifest.name !== 'string' || !manifest.name.trim()) {
            throw new Error(`apps/${entry.name}/package.json must have a package name.`)
        }
        apps.push({ directory: entry.name, name: manifest.name, description: manifest.description })
    }
    return apps.sort((a, b) => a.directory.localeCompare(b.directory, 'en'))
}

export function parseOptions(args) {
    const { values, positionals } = parseArgs({
        args,
        allowPositionals: true,
        options: {
            app: { type: 'string' },
            all: { type: 'boolean', default: false },
            mock: { type: 'boolean', default: false },
            list: { type: 'boolean', default: false },
            'dry-run': { type: 'boolean', default: false },
            help: { type: 'boolean', short: 'h', default: false },
        },
    })
    if (positionals.length > 1 || (values.app !== undefined && positionals.length)) {
        throw new Error('Choose one app using its name or --app <name>.')
    }
    const app = values.app ?? positionals[0]
    if (values.all && app !== undefined) throw new Error('--all cannot be combined with an app name.')
    return { ...values, app }
}

/** Directory filters select exact apps, never similarly named workspace tools. */
export function resolveTargets(apps, options) {
    const targets = options.all ? [...apps] : apps.filter((app) => (
        app.name === options.app || app.directory === options.app || `apps/${app.directory}` === options.app
    ))
    if (!targets.length) throw new Error(`Unknown app: ${options.app}. Run "pnpm dev --list" to see available apps.`)
    if (!options.all && targets.length > 1) throw new Error(`Ambiguous app: ${options.app}. Use its apps/ directory path.`)
    if (options.mock) {
        const mock = apps.find((app) => app.directory === 'mock-api')
        if (!mock) throw new Error('apps/mock-api has no dev script; cannot use --mock.')
        if (!targets.includes(mock)) targets.push(mock)
    }
    return targets
}

export function turboArgs(targets, dryRun = false) {
    return ['run', 'dev', ...targets.map((app) => `--filter=./apps/${app.directory}`), ...(dryRun ? ['--dry=json'] : [])]
}

async function runTurbo(args, root) {
    // Use the Node CLI entry instead of a .cmd shim, which can fail on Windows.
    const turboCli = fileURLToPath(import.meta.resolve('turbo'))
    const child = spawn(process.execPath, [turboCli, ...args], { cwd: root, stdio: 'inherit' })
    const interrupt = () => {
        // Ctrl+C already reaches the inherited console/process group. Keep
        // this wrapper alive while Turbo stops its children, especially on Windows.
    }
    const terminate = () => {
        if (!child.killed) child.kill('SIGTERM')
    }
    process.on('SIGINT', interrupt)
    process.on('SIGTERM', terminate)
    try {
        return await new Promise((resolveExit, reject) => {
            child.once('error', reject)
            child.once('exit', (code, signal) => resolveExit(code ?? (signal === 'SIGINT' ? 130 : 1)))
        })
    } finally {
        process.off('SIGINT', interrupt)
        process.off('SIGTERM', terminate)
    }
}

export async function main(args = process.argv.slice(2), {
    root = workspaceRoot,
    interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY),
    prompt = prompts,
    run = runTurbo,
    log = console.log,
} = {}) {
    const options = parseOptions(args)
    if (options.help) {
        log(help)
        return 0
    }
    const apps = await discoverApps(root)
    if (!apps.length) throw new Error('No apps with a dev script found in apps/.')
    if (options.list) {
        for (const app of apps) log(`${app.name}  (apps/${app.directory})`)
        return 0
    }
    if (!options.all && options.app === undefined) {
        if (!interactive) throw new Error('No interactive terminal. Use "pnpm dev <app>", "pnpm dev --list", or "pnpm dev:all".')
        const selection = await prompt({
            type: 'select',
            name: 'app',
            message: '选择要启动的应用',
            choices: apps.map((app) => ({
                title: app.name,
                description: `apps/${app.directory}${app.description ? ` · ${app.description}` : ''}`,
                value: `apps/${app.directory}`,
            })),
        })
        if (!selection.app) {
            log('已取消启动。')
            return 0
        }
        options.app = selection.app
        if (!options.mock && options.app !== 'apps/mock-api' && apps.some((app) => app.directory === 'mock-api')) {
            const mock = await prompt({
                type: 'confirm',
                name: 'enabled',
                message: '同时启动 Mock API？（使用 VITE_NITRO_MOCK 的应用需要，真实后端选否）',
                initial: false,
            })
            if (mock.enabled === undefined) {
                log('已取消启动。')
                return 0
            }
            options.mock = mock.enabled
        }
    }
    const targets = resolveTargets(apps, options)
    if (!options['dry-run']) log(`启动：${targets.map((app) => app.name).join('、')}`)
    return run(turboArgs(targets, options['dry-run']), root)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    main().then((code) => { process.exitCode = code }).catch((error) => {
        console.error(error.message)
        process.exitCode = 1
    })
}
