// @vitest-environment happy-dom
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { URL as NodeURL } from 'node:url'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import FrameworkPopover from '../../../components/src/overlay/FrameworkPopover.vue'
import FrameworkTooltip from '../../../components/src/overlay/FrameworkTooltip.vue'
import SelectBox from '../../../components/src/select/SelectBox.vue'
import DateTimeRangePicker from '../../../components/src/date-picker/DateTimeRangePicker.vue'
import type { DateRangeValue } from '../../../components/src/date-picker/date-range'
import {
    NEW_API_DROPDOWN_CONTENT_CLASS,
    NEW_API_POPOVER_CONTENT_CLASS,
    NEW_API_SELECT_CONTENT_CLASS,
} from '../../../components/src/data-table/new-api-compat'
import { useDrawer } from '../drawer/use-drawer'
import { useModal } from '../modal/use-modal'
import { overlayStack } from './overlay-stack'

// Compile with the workspace's actual build toolchain and animation plugin.
// Copying the expected CSS into a fixture would miss changed utility semantics.
const buildRequire = createRequire(new NodeURL('../../../../../internal/vite-config/package.json', import.meta.url))
const animationStyles = new NodeURL('../../../../ui-kit/shadcn-vue/node_modules/tw-animate-css/dist/tw-animate.css', import.meta.url)
let compiler: { build: (candidates: string[]) => string }
const wrappers: VueWrapper[] = []

beforeAll(async () => {
    const { compile } = buildRequire('tailwindcss')
    compiler = await compile([
        readFileSync(buildRequire.resolve('tailwindcss/theme.css'), 'utf8'),
        readFileSync(animationStyles, 'utf8'),
        '@tailwind utilities;',
    ].join('\n'))
})

async function settle() {
    await nextTick()
    await flushPromises()
    await new Promise<void>((resolve) => setTimeout(resolve, 10))
}

afterEach(async () => {
    for (const wrapper of wrappers.splice(0)) wrapper.unmount()
    await settle()
    overlayStack.clear()
    document.body.innerHTML = ''
    document.body.style.overflow = ''
    document.body.style.pointerEvents = ''
    vi.restoreAllMocks()
})

function attach(component: ReturnType<typeof defineComponent>) {
    const wrapper = mount(component, {
        attachTo: document.body,
        global: { plugins: [createI18n({ legacy: false, locale: 'en', messages: {} })] },
    })
    wrappers.push(wrapper)
    return wrapper
}

function classRule(css: string, candidate: string) {
    const index = css.indexOf(`.${CSS.escape(candidate)} {`)
    if (index < 0) return undefined
    const opening = css.indexOf('{', index)
    let depth = 1
    let end = opening + 1
    while (depth > 0 && end < css.length) {
        if (css[end] === '{') depth++
        else if (css[end] === '}') depth--
        end++
    }
    return { index, body: css.slice(opening + 1, end - 1) }
}

// These animation utilities have a class selector plus an optional state
// attribute. Resolve their real generated specificity/order, not class order.
function animationFor(classes: string[], state: string, reduced: boolean): string | undefined {
    const css = compiler.build(classes)
    return classes.flatMap((candidate) => {
        const rule = classRule(css, candidate)
        const animation = rule?.body.match(/(?:^|\n)\s*animation:\s*([^;]+);/)?.[1]
        if (!rule || !animation) return []
        if (rule.body.includes('(prefers-reduced-motion: reduce)') && !reduced) return []
        const stateSelector = rule.body.match(/&\[data-state="([^"]+)"\]/)?.[1]
        if (stateSelector && stateSelector !== state) return []
        return [{ value: animation, specificity: stateSelector ? 2 : 1, index: rule.index }]
    }).sort((a, b) => a.specificity - b.specificity || a.index - b.index).at(-1)?.value
}

function expectReducedAnimations(classes: string[], openState = 'open') {
    expect(animationFor(classes, openState, false)).toMatch(/^enter /)
    expect(animationFor(classes, 'closed', false)).toMatch(/^exit /)
    expect(animationFor(classes, openState, true)).toBe('none')
    expect(animationFor(classes, 'closed', true)).toBe('none')
}

describe('compiled overlay motion contracts', () => {
    it('keeps the modal shell clipped while a range popup restores focus to the scrollable body', async () => {
        let api!: ReturnType<typeof useModal>[1]
        const value = ref<DateRangeValue>([
            new Date(2026, 9, 19, 10), new Date(2026, 9, 20, 11),
        ])
        attach(defineComponent({
            setup() {
                const [Modal, controller] = useModal({ title: 'Long form', description: 'Date range focus recovery' })
                api = controller
                return () => h(Modal, {}, { default: () => [
                    h('div', { style: { height: '900px' } }, 'Other form fields'),
                    h(DateTimeRangePicker, {
                        modelValue: value.value,
                        'onUpdate:modelValue': (range) => { if (range) value.value = range },
                    }),
                ] })
            },
        }))
        api.open()
        await settle()
        const dialog = document.querySelector<HTMLElement>('.framework-modal')!
        const body = dialog.querySelector<HTMLElement>('.modal-body')!
        const footer = dialog.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!
        const header = dialog.firstElementChild as HTMLElement
        // Use actual mounted class names and Tailwind output, so a shell
        // overflow override cannot silently make this assertion pass.
        const stylesheet = document.createElement('style')
        stylesheet.textContent = compiler.build([dialog, body, header, footer].flatMap((node) => [...node.classList]))
        document.head.append(stylesheet)
        try {
            expect(getComputedStyle(dialog).overflow).toBe('clip')
            expect(getComputedStyle(body).overflowY).toBe('auto')
            expect(getComputedStyle(header).flexShrink).toBe('0')
            expect(getComputedStyle(footer).flexShrink).toBe('0')

            const trigger = body.querySelector<HTMLButtonElement>('[data-date-range-trigger]')!
            trigger.focus()
            trigger.click()
            await settle()
            const popup = document.querySelector<HTMLElement>('[data-slot="popover-content"]')!
            expect(popup).toBeTruthy()
            expect(dialog.contains(popup)).toBe(false)
            const time = popup.querySelector<HTMLInputElement>('input[type="time"]')!
            time.value = '09:08:07'
            time.dispatchEvent(new Event('input', { bubbles: true }))
            await settle()
            const confirm = [...popup.querySelectorAll<HTMLButtonElement>('button')]
                .find((button) => button.textContent?.trim() === '确定')!
            expect(confirm.disabled).toBe(false)
            confirm.click()
            await settle()
            expect(value.value[0].getHours()).toBe(9)
            expect(value.value[0].getMinutes()).toBe(8)
            expect(value.value[0].getSeconds()).toBe(7)
            expect(document.activeElement).toBe(trigger)
            expect(api.state.open).toBe(true)
            expect(getComputedStyle(dialog).overflow).toBe('clip')
            expect(getComputedStyle(body).overflowY).toBe('auto')
            // happy-dom has no layout; browser verification must also check
            // shell.scrollTop stays zero and the header/footer stay in place.
        } finally {
            stylesheet.remove()
        }
    })

    it('detects why an unqualified reduced-motion utility loses to state animations', () => {
        const original = [
            'data-[state=open]:animate-in',
            'data-[state=closed]:animate-out',
            'motion-reduce:animate-none',
        ]
        expect(animationFor(original, 'open', true)).toMatch(/^enter /)
        expect(animationFor(original, 'closed', true)).toMatch(/^exit /)
    })

    for (const kind of ['modal', 'right drawer', 'bottom drawer'] as const) {
        it(`disables both ${kind} and backdrop animations while completing lifecycle callbacks`, async () => {
            vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList)
            const onOpened = vi.fn()
            const onClosed = vi.fn()
            let api!: ReturnType<typeof useModal>[1]
            attach(defineComponent({
                setup() {
                    const [Host, controller] = kind === 'modal'
                        ? useModal({ title: 'Motion', description: 'Motion check', onOpened, onClosed })
                        : useDrawer({
                            title: 'Motion', description: 'Motion check', onOpened, onClosed,
                            side: kind === 'right drawer' ? 'right' : 'bottom',
                        })
                    api = controller
                    return () => h(Host, {}, { default: () => h('div', 'Content') })
                },
            }))
            api.open()
            await settle()
            const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!
            const backdrop = document.querySelector<HTMLElement>('.inset-0[data-state="open"]')!
            expect(dialog).toBeTruthy()
            expect(backdrop).toBeTruthy()
            expectReducedAnimations([...dialog.classList])
            expectReducedAnimations([...backdrop.classList])
            expect(onOpened).toHaveBeenCalledOnce()

            if (kind !== 'modal') {
                const css = compiler.build([...dialog.classList])
                const axis = kind === 'right drawer' ? 'x' : 'y'
                // tw-animate-css's numeric `10` also has a percentage meaning.
                // An explicit rem length stays 40px regardless of panel size.
                expect(css).toContain(`--tw-enter-translate-${axis}: 2.5rem;`)
                expect(css).toContain(`--tw-exit-translate-${axis}: 2.5rem;`)
            }

            await api.close()
            await settle()
            expect(onClosed).toHaveBeenCalledOnce()
            expect(document.querySelector('[role="dialog"]')).toBeNull()
            expect(overlayStack.size).toBe(0)
        })
    }

    it.each([
        ['menu', NEW_API_DROPDOWN_CONTENT_CLASS],
        ['filter popover', NEW_API_POPOVER_CONTENT_CLASS],
        ['pagination select', NEW_API_SELECT_CONTENT_CLASS],
    ])('disables the actual generated open/close animation for %s styles', (_, classes) => {
        expectReducedAnimations(classes.split(/\s+/))
    })

    it('preserves the state override after SelectBox primitive class merging', async () => {
        const wrapper = attach(defineComponent({
            setup: () => () => h(SelectBox, { options: [{ label: 'One', value: '1' }] }),
        }))
        await wrapper.get('[role="combobox"]').trigger('keydown', { key: 'ArrowDown' })
        await settle()
        const popup = document.querySelector<HTMLElement>('[data-slot="select-content"]')!
        expect(popup).toBeTruthy()
        expectReducedAnimations([...popup.classList])
    })

    it.each(['popover', 'tooltip'] as const)('preserves reduced motion in the real %s composition', async (kind) => {
        attach(defineComponent({
            setup: () => () => h(kind === 'popover' ? FrameworkPopover : FrameworkTooltip, {
                open: true,
                content: kind === 'tooltip' ? 'Hint' : undefined,
            }, {
                trigger: () => h('button', { type: 'button' }, 'Trigger'),
                default: () => h('div', 'Content'),
            }),
        }))
        await settle()
        const popup = document.querySelector<HTMLElement>(`[data-slot="framework-${kind}-content"]`)!
        expect(popup).toBeTruthy()
        const openState = popup.getAttribute('data-state') ?? 'open'
        expectReducedAnimations([...popup.classList], openState)
    })
})
