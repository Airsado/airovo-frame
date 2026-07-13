
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
    /**
     * Optional Vite plugins that ship with the framework. Apps opt in
     * per-flag. Each plugin is lazily imported so apps that don't use
     * them don't pay the dep cost.
     */
    vitePlugins?: {
        /** `vite-plugin-mock` for dev JSON endpoints. */
        mock?: boolean | { prefix?: string }
        /** `vite-plugin-compression` for gzip/brotli at build time. */
        compression?: boolean | { algorithm?: 'gzip' | 'brotli' | 'deflate' | 'deflate-raw' }
        /** `rollup-plugin-visualizer` to emit a `stats.html` bundle map. */
        visualizer?: boolean | { template?: 'treemap' | 'sunburst' | 'network' }
    };
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
        vitePlugins,
        plugins: appPlugins = [],
        resolve: appResolve,
        ...restConfig
    } = config;

    // Framework-provided Vite plugins, each gated by an opt-in flag so
    // apps that don't need them don't pay the dep cost (the plugin
    // modules are lazily imported below).
    const frameworkPlugins: NonNullable<ViteConfig['plugins']> = []

    if (vitePlugins?.mock) {
        const opts = typeof vitePlugins.mock === 'object' ? vitePlugins.mock : {}
        const prefix = (opts as { prefix?: string }).prefix ?? '/mock'
        // Synchronous import is fine here — these are dev-only deps and
        // the bundler will tree-shake the unused branches in prod.
        const { default: vitePluginMock } = require('vite-plugin-mock') as {
            default: (config: any) => any
        }
        frameworkPlugins.push(vitePluginMock({
            prefix,
            supportTs: true,
        }))
    }

    if (vitePlugins?.compression) {
        const opts = typeof vitePlugins.compression === 'object' ? vitePlugins.compression : {}
        const algorithm = opts.algorithm ?? 'gzip'
        const { default: vitePluginCompression } = require('vite-plugin-compression') as {
            default: (config: any) => any
        }
        frameworkPlugins.push(vitePluginCompression({ algorithm }))
    }

    if (vitePlugins?.visualizer) {
        const opts = typeof vitePlugins.visualizer === 'object' ? vitePlugins.visualizer : {}
        const template = (opts as { template?: 'treemap' | 'sunburst' | 'network' }).template ?? 'treemap'
        const { visualizer } = require('rollup-plugin-visualizer') as {
            visualizer: (config?: any) => any
        }
        frameworkPlugins.push(visualizer({ template, filename: 'stats.html', gzipSize: true }))
    }


    return {
        resolve: {
            alias: {
                '#': resolve(process.cwd(), 'src'),
                '@': resolve(__dirname, '../../../packages/ui-kit/shadcn-vue/src'),
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
                '@airovo/uikit-shadcnui',
                // New workspace packages (consumed source-direct, no build step).
                '@airovo/forms',
                '@airovo/views',
                '@airovo/app',
                '@airovo/design',
                '@airovo/effects',
                '@airovo/app-ui',
                // Reserved for the new P1 packages (no-ops until they're added).
                '@airovo/request',
                '@airovo/permission',
                '@airovo/tabs',
            ],
        },
        plugins: [
            vue(),
            tailwindcss(),
            ...frameworkPlugins,
            ...appPlugins,
        ],
        ...restConfig,
    };
};
