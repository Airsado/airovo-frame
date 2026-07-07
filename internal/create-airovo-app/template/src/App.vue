<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { BasicLayout, BasicLoadingBar } from '@airovo/layouts'
import { RouterView } from 'vue-router'
import { useAirovo } from '@airovo/app'

const { menus, progress } = useAirovo()
const route = useRoute()

const showLayout = computed(() => {
    return !route.matched.some((record) => record.meta?.ignoreLayout)
})
</script>

<template>
    <BasicLoadingBar :progress="progress" />
    <template v-if="showLayout">
        <BasicLayout :menus="menus">
            <RouterView />
        </BasicLayout>
    </template>
    <RouterView v-else />
</template>
