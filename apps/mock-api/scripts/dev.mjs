import { existsSync, readFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

function loadDotEnv(file) {
    if (!existsSync(file)) return
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
        const value = line.trim()
        if (!value || value.startsWith('#')) continue
        const separator = value.indexOf('=')
        if (separator < 1) continue
        const key = value.slice(0, separator).trim()
        let raw = value.slice(separator + 1).trim()
        if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
            raw = raw.slice(1, -1)
        }
        if (key && process.env[key] == null) process.env[key] = raw
    }
}

loadDotEnv(resolve(process.cwd(), '.env'))
loadDotEnv(resolve(process.cwd(), '.env.local'))

const forwarded = process.argv.slice(2)
const hasPort = forwarded.includes('--port') || forwarded.includes('-p')
const hasHost = forwarded.includes('--host')
const args = ['dev']
if (!hasHost) args.push('--host', process.env.NITRO_HOST || '127.0.0.1')
if (!hasPort) args.push('--port', process.env.NITRO_PORT || '4174')
args.push(...forwarded)

// Invoke Nitro through the current Node executable instead of the pnpm
// `.cmd` shim. Recent Node versions can throw `EINVAL` when spawning a
// Windows command shim, while the local CLI entry is cross-platform.
const nitroCli = fileURLToPath(import.meta.resolve('nitropack/cli'))
const child = spawn(process.execPath, [nitroCli, ...args], {
    stdio: 'inherit',
    env: process.env,
})
child.on('exit', (code, signal) => {
    if (signal) process.kill(process.pid, signal)
    else process.exit(code ?? 0)
})
child.on('error', (error) => {
    console.error(error)
    process.exit(1)
})
