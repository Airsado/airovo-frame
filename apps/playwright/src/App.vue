<script setup lang="ts">
import { BasicLayout } from '@airovo/layouts'
import { RouterView } from 'vue-router'
import { appRouter } from './router'
</script>

<template>
    <BasicLayout :menus="appRouter.menus.value">
        <RouterView />
    </BasicLayout>
</template>
