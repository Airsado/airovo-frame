<script setup lang="ts">
/**
 * PasswordStrength — real-time strength meter.
 * TODO(v5): replace the naive scoring with zxcvbn or entropy.
 */
import { computed } from 'vue'

defineOptions({ name: 'AirovoPasswordStrength' })
const props = withDefaults(defineProps<{
    password: string
    minLength?: number
}>(), { minLength: 8 })

const score = computed(() => {
    const p = props.password
    if (!p) return 0
    let s = 0
    if (p.length >= props.minLength) s++
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++
    if (/\d/.test(p)) s++
    if (/[^A-Za-z0-9]/.test(p)) s++
    if (p.length >= 12) s++
    return s // 0..5
})

const label = computed(() => ['—', '很弱', '弱', '一般', '强', '很强', '极强'][score.value])
const color = computed(() => [
    'bg-muted',
    'bg-destructive',
    'bg-destructive',
    'bg-amber-500',
    'bg-amber-500',
    'bg-emerald-500',
    'bg-emerald-500',
][score.value])
</script>
<template>
    <div class="space-y-1.5">
        <div class="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
                class="h-full transition-all"
                :class="color"
                :style="{ width: `${(score / 5) * 100}%` }"
            />
        </div>
        <p class="text-xs text-muted-foreground">{{ label }}</p>
    </div>
</template>
