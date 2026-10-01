<script setup lang="ts">
import { AppShell } from '@airovo/app'
import { handleReauthenticate, logout } from './auth/handlers'
</script>

<template>
    <AppShell :auth="{ reauthenticate: handleReauthenticate, logout }">
        <template #business>
            <span class="text-sm font-medium text-muted-foreground">__APP_TITLE__</span>
        </template>
    </AppShell>
</template>
