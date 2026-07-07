<script lang="ts" setup>
import { watch } from 'vue'
import NProgress from 'nprogress'

/**
 * NProgress Loading Bar
 *
 * 基于 nprogress 实现的页面加载进度条
 */
defineOptions({ name: 'BasicLoadingBar' })

const props = withDefaults(
    defineProps<{
        /** 进度值 0-100 */
        progress?: number
    }>(),
    {
        progress: 0,
    },
)

// nprogress 默认配置
NProgress.configure({ showSpinner: false })

// 监听进度变化
watch(
    () => props.progress,
    (value) => {
        if (value <= 0) {
            NProgress.done(true)
        } else if (value >= 100) {
            NProgress.done()
        } else {
            NProgress.set(value / 100)
        }
    },
    { immediate: true },
)

// 暴露 nprogress 配置方法
defineExpose({
    configure: NProgress.configure,
    start: NProgress.start,
    done: NProgress.done,
    remove: NProgress.remove,
    set: (n: number) => NProgress.set(n),
})
</script>

<template>
    <div class="nprogress-container" />
</template>
