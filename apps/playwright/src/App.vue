<script setup lang="ts">
import { BasicLayout, BasicLoadingBar } from '@airovo/layouts'
import { RouterView } from 'vue-router'
import { appRouter } from './router'

// Destructure so `progress` and `menus` are top-level refs in the
// template — Vue auto-unwraps and tracks them, which it wouldn't do
// if they stayed as `appRouter.progress.value` (the object isn't
// reactive).
const { progress, menus } = appRouter
</script>

<template>
    <BasicLoadingBar :progress="progress" />
    <BasicLayout :menus="menus">
        <RouterView />
    </BasicLayout>
</template>
