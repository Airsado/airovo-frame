
import type { Plugin, UserConfig } from 'vite';
import { resolve } from 'node:path';
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

/** 自动在 CSS 入口注入 @import "@airovo/uikit-vue/style.css" */
function autoTailwindImport(): Plugin {
    return {
        name: 'airovo:auto-tailwind-import',
        enforce: 'pre',
        transform(code, id) {
            if (id.endsWith('.css') && !id.includes('node_modules')) {
                if (!code.includes('@import "@airovo/uikit-vue/style.css"') && !code.includes('@import "@airovo/uikit-vue/style.css"')) {
                    return { code: `@import "@airovo/uikit-vue/style.css";\n${code}`, map: null };
                }
            }
        },
    };
}

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
                ...(appResolve?.alias as Record<string, string>),
            },
            ...appResolve,
        },
        plugins: [
            autoTailwindImport(),
            vue(),
            tailwindcss(),
            // appConfigPlugin({ envPrefixes: ['VITE_'] }),
            ...appPlugins,
        ],
        ...restConfig,
    };
};
