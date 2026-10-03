import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('../../ui-kit/shadcn-vue/src', import.meta.url)),
        },
    },
    test: {
        environment: 'happy-dom',
    },
})
