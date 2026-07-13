import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        // No `environment: 'happy-dom'` needed — FormApi tests are
        // pure TypeScript and don't render DOM.
        environment: 'node',
        include: ['src/**/*.test.ts'],
    },
})
