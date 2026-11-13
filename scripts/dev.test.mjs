import assert from 'node:assert/strict'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { discoverApps, main, parseOptions, resolveTargets, turboArgs } from './dev.mjs'

async function workspace(t) {
    const root = await mkdtemp(join(tmpdir(), 'dev-launcher-'))
    t.after(() => rm(root, { recursive: true, force: true }))
    async function manifest(directory, value) {
        await mkdir(join(root, directory), { recursive: true })
        await writeFile(join(root, directory, 'package.json'), JSON.stringify(value))
    }
    await manifest('apps/demo', { name: '@example/demo', scripts: { dev: 'vite' } })
    await manifest('apps/private-app', { name: 'business', scripts: { dev: 'vite' } })
    await manifest('apps/mock-api', { name: 'mock-api', scripts: { dev: 'nitro dev' } })
    await manifest('apps/no-dev', { name: 'no-dev', scripts: { build: 'vite build' } })
    await manifest('apps/.hidden', { name: 'hidden', scripts: { dev: 'vite' } })
    await manifest('internal/create-app', { name: 'scaffold', scripts: { dev: 'tsup --watch' } })
    await mkdir(join(root, 'apps/empty'), { recursive: true })
    return { root, manifest }
}

test('discovers runnable apps, including local business apps, but excludes tools and non-app directories', async (t) => {
    const { root } = await workspace(t)
    assert.deepEqual((await discoverApps(root)).map((app) => app.name), ['@example/demo', 'mock-api', 'business'])
})

test('reports malformed app manifests instead of silently hiding broken apps', async (t) => {
    const { root } = await workspace(t)
    await writeFile(join(root, 'apps/demo/package.json'), '{')
    await assert.rejects(discoverApps(root), /Cannot read apps\/demo\/package.json/)
})

test('selects exact directory or package names and keeps dependency builds in the Turbo graph', async (t) => {
    const { root } = await workspace(t)
    const apps = await discoverApps(root)
    for (const name of ['demo', '@example/demo', 'apps/demo']) {
        const targets = resolveTargets(apps, parseOptions([name]))
        assert.deepEqual(turboArgs(targets), ['run', 'dev', '--filter=./apps/demo'])
    }
    const targets = resolveTargets(apps, parseOptions(['--app', 'business', '--mock']))
    assert.deepEqual(turboArgs(targets, true), [
        'run', 'dev', '--filter=./apps/private-app', '--filter=./apps/mock-api', '--dry=json',
    ])
    const all = resolveTargets(apps, parseOptions(['--all', '--mock']))
    assert.equal(all.length, 3)
    assert.equal(all.filter((app) => app.directory === 'mock-api').length, 1)
    assert.throws(() => resolveTargets(apps, parseOptions(['dem*'])), /Unknown app/)
    assert.throws(() => parseOptions(['--all', 'demo']), /cannot be combined/)
})

test('non-interactive invocation never falls back to launching every app', async (t) => {
    const { root } = await workspace(t)
    await assert.rejects(main([], {
        root, interactive: false, run: () => assert.fail('must not start a process'),
    }), /No interactive terminal/)
})

test('list mode does not prompt or start any process', async (t) => {
    const { root } = await workspace(t)
    const lines = []
    assert.equal(await main(['--list'], {
        root,
        prompt: () => assert.fail('must not prompt'),
        run: () => assert.fail('must not start a process'),
        log: (line) => lines.push(line),
    }), 0)
    assert.deepEqual(lines, ['@example/demo  (apps/demo)', 'mock-api  (apps/mock-api)', 'business  (apps/private-app)'])
})

test('cancelling either interactive question exits without starting services', async (t) => {
    const { root } = await workspace(t)
    for (const replies of [[{}], [{ app: 'apps/demo' }, {}]]) {
        const messages = []
        assert.equal(await main([], {
            root, interactive: true, prompt: async () => replies.shift(),
            run: () => assert.fail('must not start a process'), log: (message) => messages.push(message),
        }), 0)
        assert.deepEqual(messages, ['已取消启动。'])
    }
})

test('interactive selection starts only the chosen app and optional mock and preserves failure status', async (t) => {
    const { root } = await workspace(t)
    for (const mock of [false, true]) {
        const replies = [{ app: 'apps/demo' }, { enabled: mock }]
        const code = await main([], {
            root, interactive: true, prompt: async () => replies.shift(), log: () => {},
            run: async (args, cwd) => {
                assert.equal(cwd, root)
                assert.deepEqual(args, [
                    'run', 'dev', '--filter=./apps/demo', ...(mock ? ['--filter=./apps/mock-api'] : []),
                ])
                return 7
            },
        })
        assert.equal(code, 7)
    }
})
