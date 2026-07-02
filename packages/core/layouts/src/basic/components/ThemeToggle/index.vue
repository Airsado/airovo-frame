<script setup lang="ts">
import { Button } from '@airovo/uikit-vue'
import { Icon } from '@airovo/shared/icons'
import { computed } from 'vue'
import { useThemeStore } from '@airovo/stores'

defineOptions({ name: 'ThemeToggle' })

const themeStore = useThemeStore()

const icon = computed(() => {
    if (themeStore.theme === 'system') return 'lucide:monitor'
    return themeStore.isDark ? 'lucide:moon' : 'lucide:sun'
})

function toggle(): void {
    themeStore.toggle()
}
</script>

<template>
    <div class="cursor-pointer" @click="toggle">
        <Button variant="ghost" size="icon">
            <Icon :icon="icon" class="size-4" />
        </Button>
    </div>
</template>
