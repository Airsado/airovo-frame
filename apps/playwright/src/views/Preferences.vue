<script setup lang="ts">
/**
 * Preferences settings — real settings panel demoing all the theme
 *细化 fields (P2-B C4). Each control calls `usePreferencesStore().updatePreferences()`
 * which triggers `manager.applyTheme()` and persists to localStorage.
 */
import { computed } from 'vue'
import { Label, Input, NativeSelect } from '@airovo/uikit-shadcnui'
import { usePreferencesStore } from '@airovo/stores/preferences'
import { Icon } from '@airovo/shared/icons'

defineOptions({ name: 'Preferences' })

const prefs = usePreferencesStore()

const themeMode = computed({
    get: () => prefs.preferences.theme.mode,
    set: (v: 'light' | 'dark' | 'system') => prefs.updatePreferences({ theme: { mode: v } }),
})

const primaryColor = computed({
    get: () => prefs.preferences.theme.primaryColor ?? '',
    set: (v: string) => prefs.updatePreferences({ theme: { primaryColor: v } }),
})

const grayColor = computed({
    get: () => prefs.preferences.theme.grayColor ?? 'slate',
    set: (v: string) => prefs.updatePreferences({ theme: { grayColor: v as any } }),
})

const radius = computed({
    get: () => prefs.preferences.theme.radius ?? 0.5,
    set: (v: number) => prefs.updatePreferences({ theme: { radius: v } }),
})

const density = computed({
    get: () => prefs.preferences.theme.layoutDensity ?? 'default',
    set: (v: string) => prefs.updatePreferences({ theme: { layoutDensity: v as any } }),
})

const animEnabled = computed({
    get: () => prefs.preferences.theme.animationEnabled !== false,
    set: (v: boolean) => prefs.updatePreferences({ theme: { animationEnabled: v } }),
})

const weakMode = computed({
    get: () => prefs.preferences.theme.weakMode === true,
    set: (v: boolean) => prefs.updatePreferences({ theme: { weakMode: v } }),
})

function resetTheme() {
    prefs.updatePreferences({
        theme: {
            mode: 'system',
            primaryColor: '',
            grayColor: 'slate',
            radius: 0.5,
            layoutDensity: 'default',
            animationEnabled: true,
            weakMode: false,
        },
    })
}
</script>

<template>
    <div class="mx-auto max-w-3xl space-y-6 p-6">
        <header class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold tracking-tight">偏好设置</h1>
                <p class="text-sm text-muted-foreground">所有改动会实时生效，并保存到 localStorage</p>
            </div>
            <button
                type="button"
                class="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm hover:bg-accent"
                @click="resetTheme"
            >
                <Icon icon="lucide:rotate-ccw" class="size-3.5" />
                重置
            </button>
        </header>

        <section class="space-y-4 rounded-lg border bg-card p-5 shadow-sm">
            <h2 class="text-base font-semibold">主题</h2>

            <div class="grid gap-3 sm:grid-cols-2">
                <div class="space-y-1.5">
                    <Label>主题模式</Label>
                    <NativeSelect v-model="themeMode">
                        <option value="light">浅色</option>
                        <option value="dark">深色</option>
                        <option value="system">跟随系统</option>
                    </NativeSelect>
                </div>

                <div class="space-y-1.5">
                    <Label>中性色 (Gray)</Label>
                    <NativeSelect v-model="grayColor">
                        <option value="zinc">zinc</option>
                        <option value="slate">slate</option>
                        <option value="gray">gray</option>
                        <option value="neutral">neutral</option>
                        <option value="stone">stone</option>
                    </NativeSelect>
                </div>
            </div>

            <div class="space-y-1.5">
                <Label>主色 (Primary Color)</Label>
                <div class="flex items-center gap-3">
                    <input
                        v-model="primaryColor"
                        type="color"
                        class="h-9 w-12 cursor-pointer rounded-md border border-input"
                    >
                    <Input
                        v-model="primaryColor"
                        placeholder="留空使用默认 (hsl 222.2 47.4% 11.2%)"
                        class="flex-1"
                    />
                </div>
                <p class="text-xs text-muted-foreground">支持 hex (#3461f0)、oklch 或 hsl 字符串</p>
            </div>

            <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                    <Label>圆角 (--radius, rem)</Label>
                    <span class="text-sm font-mono text-muted-foreground">{{ radius }}</span>
                </div>
                <input
                    v-model.number="radius"
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.05"
                    class="w-full"
                >
            </div>
        </section>

        <section class="space-y-4 rounded-lg border bg-card p-5 shadow-sm">
            <h2 class="text-base font-semibold">布局</h2>

            <div class="space-y-1.5">
                <Label>密度</Label>
                <div class="grid grid-cols-3 gap-2">
                    <button
                        v-for="d in (['compact', 'default', 'loose'] as const)"
                        :key="d"
                        type="button"
                        :class="[
                            'rounded-md border px-3 py-2 text-sm',
                            density === d
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-input bg-background hover:bg-accent',
                        ]"
                        @click="density = d"
                    >{{ { compact: '紧凑', default: '默认', loose: '宽松' }[d] }}</button>
                </div>
            </div>

            <div class="flex items-center justify-between rounded-md border border-input px-3 py-2.5">
                <div>
                    <Label>动画</Label>
                    <p class="text-xs text-muted-foreground">关闭后所有过渡与动画静止（无障碍偏好）</p>
                </div>
                <label class="inline-flex h-5 w-9 cursor-pointer items-center rounded-full bg-input transition-colors has-[:checked]:bg-primary">
                    <input
                        :checked="animEnabled"
                        type="checkbox"
                        class="peer sr-only"
                        @change="(e) => animEnabled = (e.target as HTMLInputElement).checked"
                    >
                    <span class="ml-0.5 h-4 w-4 rounded-full bg-background transition-transform peer-checked:translate-x-4" />
                </label>
            </div>

            <div class="flex items-center justify-between rounded-md border border-input px-3 py-2.5">
                <div>
                    <Label>弱色模式</Label>
                    <p class="text-xs text-muted-foreground">对整个应用加灰度滤镜（专注阅读）</p>
                </div>
                <label class="inline-flex h-5 w-9 cursor-pointer items-center rounded-full bg-input transition-colors has-[:checked]:bg-primary">
                    <input
                        :checked="weakMode"
                        type="checkbox"
                        class="peer sr-only"
                        @change="(e) => weakMode = (e.target as HTMLInputElement).checked"
                    >
                    <span class="ml-0.5 h-4 w-4 rounded-full bg-background transition-transform peer-checked:translate-x-4" />
                </label>
            </div>
        </section>
    </div>
</template>
