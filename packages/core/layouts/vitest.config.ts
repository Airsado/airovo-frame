import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig(async () => {
    // Layouts is also consumed by CommonJS tooling; load the ESM-only Vue
    // compiler plugin without changing the package's module contract.
    const { default: vue } = await import('@vitejs/plugin-vue')
    return {
        plugins: [vue()],
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('../../ui-kit/shadcn-vue/src', import.meta.url)),
            },
        },
        test: {
            environment: 'happy-dom',
        },
    }
})
