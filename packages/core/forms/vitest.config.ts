import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            // ui-kit/shadcn-vue uses `@/lib/utils` — resolve from monorepo root
            '@': resolve(process.cwd(), '../../../packages/ui-kit/shadcn-vue/src'),
        },
    },
    test: {
        environment: 'happy-dom',
        globals: true,
        include: ['src/**/*.test.ts'],
    },
})
