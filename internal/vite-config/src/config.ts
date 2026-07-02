
import type { UserConfig } from 'vite';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

const __dirname = dirname(fileURLToPath(import.meta.url))

export interface ViteConfig extends UserConfig {
    /**
     * 是否启用Vue Devtools 默认读取VITE_DEVTOOLS环境变量
     */
    devtools?: boolean;
}

/**
 * 框架级 Vite 配置预设
 *
 * 内置：Vue、Tailwind CSS 4、appConfigPlugin、# 路径别名
 * 应用层可传入自定义配置覆盖，不使用也不影响
 *
 * @example
 * ```ts
 * // apps/xxx/vite.config.ts — 最简用法
 * import { defineViteConfig } from '@airovo/vite-config';
 * export default defineViteConfig();
 *
 * // 自定义覆盖
 * export default defineViteConfig({
 *   plugins: [myPlugin()],
 *   server: { port: 3000 },
 * });
 * ```
 */
export const defineViteConfig = (config: ViteConfig = {}): UserConfig => {
    const {
        devtools: _devtools,
        plugins: appPlugins = [],
        resolve: appResolve,
        ...restConfig
    } = config;


    return {
        resolve: {
            alias: {
                '#': resolve(process.cwd(), 'src'),
                '@': resolve(__dirname, '../../../packages/ui-kit/vue-ui/src'),
                ...(appResolve?.alias as Record<string, string>),
            },
            ...appResolve,
        },
        // Workspace source packages are consumed directly from `src/`
        // (no build step) — they don't need dep-pre-bundling. Excluding
        // them also avoids the Vite/rolldown dep-scan trying to resolve
        // a tsconfig adjacent to each `src/index.ts`, which would fail
        // for packages that only have a package-root `tsconfig.json`.
        optimizeDeps: {
            exclude: [
                '@airovo/config',
                '@airovo/layouts',
                '@airovo/router',
                '@airovo/stores',
                '@airovo/uikit-vue',
            ],
        },
        plugins: [
            vue(),
            tailwindcss(),
            ...appPlugins,
        ],
        ...restConfig,
    };
};
