<script lang="ts" setup>
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    Button,
} from '@airovo/uikit-vue'
import { Icon } from '@airovo/shared/icons'
import { useI18nStore, SUPPORTED_LOCALES, type Locale } from '@airovo/stores'

defineOptions({ name: 'LanguageSwitch' })

const i18nStore = useI18nStore()

const labels: Record<Locale, string> = {
    'zh-CN': '中文',
    'en-US': 'English',
}

function select(l: Locale): void {
    i18nStore.setLocale(l)
}
</script>

<template>
    <DropdownMenu>
        <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="icon" class="cursor-pointer">
                <Icon icon="lucide:languages" class="size-4" />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
            <div
                v-for="l in SUPPORTED_LOCALES"
                :key="l"
                @click="select(l)"
            >
                <DropdownMenuItem>
                    <Icon
                        :icon="i18nStore.locale === l ? 'lucide:check' : 'lucide:blank'"
                        class="mr-2 size-4"
                    />
                    <span>{{ labels[l] }}</span>
                </DropdownMenuItem>
            </div>
        </DropdownMenuContent>
    </DropdownMenu>
</template>
