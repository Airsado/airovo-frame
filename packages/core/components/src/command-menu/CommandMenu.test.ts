// @vitest-environment happy-dom
import { defineComponent, nextTick, ref } from 'vue'
import { mount, type MountingOptions } from '@vue/test-utils'
import type { Component } from 'vue'
import { describe, expect, it } from 'vitest'
import { createI18n } from 'vue-i18n'
import CommandMenu from './CommandMenu.vue'
import type { CommandMenuGroup } from './types'

const global = { plugins: [createI18n({ legacy: false, locale: 'zh-CN', messages: { 'zh-CN': { common: { commandTitle: '命令面板', commandDescription: '搜索要执行的命令…', commandPlaceholder: '搜索命令…', commandEmpty: '没有找到结果。' } } } })] }

const groups: CommandMenuGroup[] = [
    {
        id: 'navigation',
        label: '导航',
        items: [
            { id: 'overview', label: '概览', shortcut: 'G O' },
            { id: 'channels', label: '渠道' },
        ],
    },
    {
        id: 'actions',
        label: '操作',
        items: [{ id: 'disabled', label: '禁用操作', disabled: true }],
    },
]

function mountMenu(props: Record<string, unknown> = {}, options: MountingOptions<Component> = {}) {
    return mount(CommandMenu, {
        props: { groups, open: true, ...props },
        attachTo: document.body,
        global,
        ...options,
    })
}

describe('CommandMenu', () => {
    it('uses locale defaults while explicit command copy remains authoritative', async () => {
        const i18n = createI18n({ legacy: false, locale: 'en-US', messages: { 'en-US': { common: { commandTitle: 'Command Palette', commandDescription: 'Search for a command to run...', commandPlaceholder: 'Search commands', commandEmpty: 'No results' } } } })
        const wrapper = mount(CommandMenu, { global: { plugins: [i18n] }, props: { groups, open: true, title: 'Commands', placeholder: 'Type a command' }, attachTo: document.body })
        await nextTick()
        expect(document.body.textContent).toContain('Commands')
        expect(document.body.querySelector('[data-slot="command-input"]')?.getAttribute('placeholder')).toBe('Type a command')
        wrapper.unmount()
    })
    it('renders grouped items, shortcuts, and disabled state', async () => {
        const wrapper = mountMenu()
        await nextTick()

        expect(document.body.querySelectorAll('[data-slot="command-group"]')).toHaveLength(2)
        expect(document.body.textContent).toContain('导航')
        expect(document.body.textContent).toContain('概览')
        expect(document.body.textContent).toContain('G O')
        expect(document.body.querySelector('[data-slot="command-item"][data-disabled]')).toBeTruthy()
        expect(document.body.querySelector('[data-slot="dialog-content"]')?.className).toContain('rounded-xl')
        expect(document.body.querySelector('[data-slot="dialog-content"]')?.className).toContain('top-1/3')
        wrapper.unmount()
    })

    it('exposes the new-api command surface tokens across the palette parts', async () => {
        const wrapper = mountMenu()
        await nextTick()

        const content = document.body.querySelector('[data-slot="dialog-content"]')!
        const command = document.body.querySelector('[data-slot="command"]')!
        const input = document.body.querySelector('[data-slot="command-input"]')!
        const list = document.body.querySelector('[data-slot="command-list"]')!
        const item = document.body.querySelector('[data-slot="command-item"]')!
        const shortcut = document.body.querySelector('[data-slot="command-shortcut"]')!

        expect(content.className).toContain('command-menu-content')
        expect(command.className).toContain('rounded-xl')
        expect(command.className).toContain('p-1')
        expect(input.className).toContain('h-8')
        expect(input.className).toContain('rounded-lg')
        expect(input.className).toContain('bg-input/30')
        expect(input.className).toContain('shadow-none')
        expect(list.className).toContain('max-h-72')
        expect(list.className).toContain('no-scrollbar')
        expect(item.className).toContain('data-[highlighted]:bg-muted')
        expect(item.className).toContain('data-[state=checked]:bg-muted')
        expect(item.className).toContain('focus-visible:ring-2')
        expect(shortcut.className).toContain('tracking-widest')
        wrapper.unmount()
    })

    it('moves focus into the palette and restores the opener after Escape', async () => {
        const Host = defineComponent({
            components: { CommandMenu },
            setup() {
                const open = ref(false)
                return { open, groups }
            },
            template: '<button data-command-opener type="button" @click="open = true">打开</button><CommandMenu v-model:open="open" :groups="groups" />',
        })
        const wrapper = mount(Host, { global, attachTo: document.body })
        try {
            const opener = wrapper.get('[data-command-opener]').element as HTMLButtonElement
            opener.focus()
            await wrapper.get('[data-command-opener]').trigger('click')
            await nextTick()
            await nextTick()

            const input = document.body.querySelector<HTMLInputElement>('[data-slot="command-input"]')!
            expect(document.activeElement).toBe(input)

            input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
            await nextTick()
            await nextTick()
            await new Promise(resolve => setTimeout(resolve, 0))

            expect(document.activeElement).toBe(opener)
        } finally {
            wrapper.unmount()
        }
    })

    it('filters items through the command input', async () => {
        const wrapper = mountMenu()
        await nextTick()
        const input = document.body.querySelector<HTMLInputElement>('[data-slot="command-input"]')!

        input.value = '渠道'
        input.dispatchEvent(new Event('input', { bubbles: true }))
        await nextTick()

        expect(document.body.textContent).toContain('渠道')
        expect(document.body.querySelector('[data-slot="command-item"][data-disabled]')).toBeNull()
        expect(document.body.textContent).not.toContain('概览')
        wrapper.unmount()
    })

    it('emits the selected item and closes uncontrolled menus', async () => {
        const wrapper = mount(CommandMenu, {
            global,
            props: { groups, defaultOpen: true },
            attachTo: document.body,
        })
        await nextTick()
        await nextTick()

        document.body.querySelector<HTMLElement>('[data-slot="command-item"]')!.click()
        await nextTick()

        expect(wrapper.emitted('select')?.[0]).toEqual([groups[0]!.items[0], groups[0]])
        expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
        expect(document.body.querySelector('[data-slot="dialog-content"]')?.getAttribute('data-state')).toBe('closed')
        wrapper.unmount()
    })

    it('supports ArrowDown/Enter selection and Escape dismissal', async () => {
        const wrapper = mountMenu()
        await nextTick()
        const input = document.body.querySelector<HTMLInputElement>('[data-slot="command-input"]')!

        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }))
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
        await nextTick()

        expect(wrapper.emitted('select')?.[0]).toEqual([groups[0]!.items[0], groups[0]])
        wrapper.unmount()

        const escapeWrapper = mountMenu()
        await nextTick()
        const escapeInput = document.body.querySelector<HTMLInputElement>('[data-slot="command-input"]')!
        escapeInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
        await nextTick()
        expect(escapeWrapper.emitted('update:open')?.at(-1)).toEqual([false])
        escapeWrapper.unmount()
    })

    it('allows an item slot and keeps disabled items inert', async () => {
        const select = [] as string[]
        const wrapper = mountMenu({}, {
            attrs: {
                onSelect: (item: { id: string }) => select.push(item.id),
            },
            slots: {
                item: ({ item }: { item: { label: string } }) => `命令：${item.label}`,
            },
        })
        await nextTick()

        expect(select).toEqual([])
        expect(document.body.querySelectorAll('[data-slot="command-item"]')[2]?.getAttribute('data-disabled')).toBeDefined()
        expect(document.body.textContent).toContain('命令：概览')
        wrapper.unmount()
    })
})
