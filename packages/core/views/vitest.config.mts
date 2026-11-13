import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import formsConfig from '../forms/vitest.config.mts'

// Auth views exercise the same form renderer, so use the existing form test
// toolchain without adding a second set of development dependencies.
const requireFromForms = createRequire(new URL('../forms/package.json', import.meta.url))

export default {
    ...formsConfig,
    root: fileURLToPath(new URL('.', import.meta.url)),
    resolve: {
        ...formsConfig.resolve,
        alias: {
            ...formsConfig.resolve?.alias,
            vitest: join(dirname(requireFromForms.resolve('vitest/package.json')), 'dist/index.js'),
            '@vue/test-utils': requireFromForms.resolve('@vue/test-utils'),
        },
    },
    test: {
        ...formsConfig.test,
        include: ['test/**/*.test.ts'],
    },
}
