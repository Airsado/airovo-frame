import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

export type Locale = 'zh-CN' | 'en-US'

export const SUPPORTED_LOCALES: Locale[] = ['zh-CN', 'en-US']

export const useI18nStore = defineStore(
    'i18n',
    () => {
        const locale = ref<Locale>('zh-CN')
        const externalLocale = ref<{ value: Locale } | null>(null)

        const isZh = computed(() => locale.value === 'zh-CN')

        function setLocale(l: Locale): void {
            locale.value = l
        }

        function bindExternal(ref: { value: Locale }): void {
            externalLocale.value = ref
            watch(
                () => ref.value,
                (v) => {
                    if (v && v !== locale.value) locale.value = v
                },
                { immediate: true },
            )
        }

        watch(locale, (l) => {
            if (typeof document !== 'undefined') {
                document.documentElement.lang = l
            }
            if (externalLocale.value && externalLocale.value.value !== l) {
                externalLocale.value.value = l
            }
        })

        return { locale, isZh, setLocale, bindExternal }
    },
    {
        persist: {
            key: 'airovo-locale',
            storage: localStorage,
        },
    },
)
