// @vitest-environment happy-dom
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import SelectBox from '../../../components/src/select/SelectBox.vue'
import { useForm, type FormApi } from '../../../forms/src'
import { useDrawer } from '../drawer/use-drawer'
import { useModal } from '../modal/use-modal'
import { overlayStack } from './overlay-stack'

const wrappers: VueWrapper[] = []
const options = [{ label: 'First', value: 'first' }, { label: 'Second', value: 'second' }]

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
})

function attach(component: ReturnType<typeof defineComponent>) {
    const wrapper = mount(component, { attachTo: document.body })
    wrappers.push(wrapper)
    return wrapper
}

async function openSelect(selector = '[role="combobox"]') {
    const trigger = document.querySelector<HTMLButtonElement>(selector)
    expect(trigger).toBeTruthy()
    trigger!.focus()
    trigger!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    await settle()
    const popup = document.querySelector<HTMLElement>('[role="listbox"]')
    expect(popup).toBeTruthy()
    return { trigger: trigger!, popup: popup! }
}

function escape() {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
}

describe('Select popups in framework overlay hosts', () => {
    it('keeps a standalone Select on the primitive layer and restores its trigger focus', async () => {
        const wrapper = attach(defineComponent({ setup: () => () => h(SelectBox, { options }) }))
        await settle()
        const { popup, trigger } = await openSelect()
        expect(popup.style.zIndex).toBe('')
        expect(overlayStack.size).toBe(0)
        escape()
        await settle()
        expect(trigger.getAttribute('aria-expanded')).toBe('false')
        expect(document.activeElement).toBe(trigger)
        expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('inherits the owner layer through an external useForm child and returns its selected value', async () => {
        let modalApi!: ReturnType<typeof useModal>[1]
        let formApi!: FormApi
        const ChildForm = defineComponent({
            setup() {
                const [Form, api] = useForm({
                    showDefaultActions: false,
                    schema: [{ fieldName: 'choice', label: 'Choice', component: 'Select', array: true, componentProps: { options } }],
                    initialValues: { choice: [{ value: 'first' }] },
                })
                formApi = api
                return () => h(Form)
            },
        })
        attach(defineComponent({
            setup() {
                const [Modal, api] = useModal({ title: 'Form modal', description: 'Select ownership' })
                modalApi = api
                return () => h(Modal, {}, { default: () => h(ChildForm) })
            },
        }))
        modalApi.open()
        await settle()
        const { popup, trigger } = await openSelect()
        const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!

        // The listbox is a body portal, so DOM containment cannot supply its layer.
        expect(dialog.contains(popup)).toBe(false)
        expect(Number(popup.style.zIndex)).toBeGreaterThan(Number(dialog.style.zIndex))
        const second = [...popup.querySelectorAll<HTMLElement>('[role="option"]')].find((option) => option.textContent?.includes('Second'))!
        second.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: 'touch' }))
        await vi.waitFor(() => expect(formApi.values.value.choice).toEqual([{ value: 'second' }]))
        await settle()
        expect(modalApi.state.open).toBe(true)
        expect(trigger.getAttribute('aria-expanded')).toBe('false')
        expect(document.activeElement).toBe(trigger)
    })

    it('closes Select, then Modal, then Drawer on separate Escape presses', async () => {
        let drawerApi!: ReturnType<typeof useDrawer>[1]
        let modalApi!: ReturnType<typeof useModal>[1]
        const Child = defineComponent({ setup: () => () => h(SelectBox, { options }) })
        attach(defineComponent({
            setup() {
                const [Drawer, drawer] = useDrawer({ title: 'Parent drawer', description: 'Drawer' })
                const [Modal, modal] = useModal({ title: 'Nested modal', description: 'Modal' })
                drawerApi = drawer
                modalApi = modal
                return () => h(Drawer, {}, { default: () => h(Modal, {}, { default: () => h(Child) }) })
            },
        }))
        drawerApi.open()
        await settle()
        modalApi.open()
        await settle()
        const { popup } = await openSelect()
        const dialogs = [...document.querySelectorAll<HTMLElement>('[role="dialog"]')]
        expect(Number(popup.style.zIndex)).toBeGreaterThan(Math.max(...dialogs.map((dialog) => Number(dialog.style.zIndex))))

        escape()
        await settle()
        expect(document.querySelector('[role="combobox"]')?.getAttribute('aria-expanded')).toBe('false')
        expect(modalApi.state.open).toBe(true)
        expect(drawerApi.state.open).toBe(true)
        escape()
        await settle()
        expect(modalApi.state.open).toBe(false)
        expect(drawerApi.state.open).toBe(true)
        escape()
        await settle()
        expect(drawerApi.state.open).toBe(false)
        expect(overlayStack.bodyLockCount).toBe(0)
        expect(document.body.style.overflow).toBe('')
        expect(document.body.style.pointerEvents).toBe('')
    })

    it('closes an owner popup when a newer main layer opens without stealing the new layer focus', async () => {
        let parentApi!: ReturnType<typeof useModal>[1]
        let childApi!: ReturnType<typeof useModal>[1]
        attach(defineComponent({
            setup() {
                const [Parent, parent] = useModal({ title: 'Parent', description: 'Parent modal' })
                const [Child, child] = useModal({ title: 'Child', description: 'Child modal' })
                parentApi = parent
                childApi = child
                return () => h('div', [
                    h(Parent, {}, { default: () => h(SelectBox, { options }) }),
                    h(Child, {}, { default: () => h('button', { 'data-child-focus': '' }, 'Child action') }),
                ])
            },
        }))
        parentApi.open()
        await settle()
        const { trigger } = await openSelect()
        childApi.open()
        await settle()
        expect(trigger.getAttribute('aria-expanded')).toBe('false')
        expect(document.activeElement).not.toBe(trigger)
        expect(childApi.state.open).toBe(true)
        expect(parentApi.state.open).toBe(true)
        escape()
        await settle()
        expect(childApi.state.open).toBe(false)
        expect(parentApi.state.open).toBe(true)
    })

    it('dismisses a Select on an outside interaction inside its Modal without closing the owner', async () => {
        let api!: ReturnType<typeof useModal>[1]
        attach(defineComponent({
            setup() {
                const [Modal, modal] = useModal({ title: 'Outside test', description: 'Popup only' })
                api = modal
                return () => h(Modal, {}, { default: () => [
                    h(SelectBox, { options }), h('button', { 'data-outside-select': '' }, 'Other field'),
                ] })
            },
        }))
        api.open()
        await settle()
        const { trigger } = await openSelect()
        document.querySelector('[data-outside-select]')!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }))
        await settle()
        expect(trigger.getAttribute('aria-expanded')).toBe('false')
        expect(api.state.open).toBe(true)
        expect(overlayStack.size).toBe(1)
    })

    it('closes the owner popup on an API close and gives a reopened host its new layer', async () => {
        let api!: ReturnType<typeof useModal>[1]
        attach(defineComponent({
            setup() {
                const [Modal, modal] = useModal({ title: 'Reopen test', description: 'Owner lifecycle' })
                api = modal
                return () => h(Modal, {}, { default: () => h(SelectBox, { options }) })
            },
        }))
        api.open()
        await settle()
        const { popup } = await openSelect()
        const previousZIndex = Number(popup.style.zIndex)
        await api.close('api')
        await settle()
        expect(document.querySelector('[role="listbox"]')).toBeNull()
        expect(overlayStack.size).toBe(0)
        api.open()
        await settle()
        const reopened = await openSelect()
        expect(Number(reopened.popup.style.zIndex)).toBeGreaterThan(previousZIndex)
        expect(Number(reopened.popup.style.zIndex)).toBeGreaterThan(Number(document.querySelector<HTMLElement>('[role="dialog"]')!.style.zIndex))
    })

    it.each(['modal', 'drawer'] as const)('preserves the primitive right-click outside behavior in a %s', async (kind) => {
        let api!: ReturnType<typeof useModal>[1]
        attach(defineComponent({
            setup() {
                const [Overlay, controller] = (kind === 'modal' ? useModal : useDrawer)({ title: 'Context menu', description: 'Right click' })
                api = controller
                return () => h(Overlay, {}, { default: () => h('button', 'Inside') })
            },
        }))
        api.open()
        await settle()
        document.body.dispatchEvent(new PointerEvent('pointerdown', { button: 2, bubbles: true, cancelable: true }))
        await settle()
        expect(api.state.open).toBe(true)
    })

    it.each(['modal', 'drawer'] as const)('honors disabled Escape and outside dismissal in a %s', async (kind) => {
        let api!: ReturnType<typeof useModal>[1]
        attach(defineComponent({
            setup() {
                const [Overlay, controller] = (kind === 'modal' ? useModal : useDrawer)({
                    title: 'Locked host', description: 'No dismissal', closeOnEscape: false, closeOnOutside: false,
                })
                api = controller
                return () => h(Overlay, {}, { default: () => h('button', 'Inside') })
            },
        }))
        api.open()
        await settle()
        escape()
        await settle()
        expect(api.state.open).toBe(true)
        document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
        await settle()
        expect(api.state.open).toBe(true)
    })

    it.each(['modal', 'drawer'] as const)('does not turn an Escape or outside event into an api close while a %s is loading', async (kind) => {
        let api!: ReturnType<typeof useModal>[1]
        attach(defineComponent({
            setup() {
                const [Overlay, controller] = (kind === 'modal' ? useModal : useDrawer)({ title: 'Busy host', description: 'Loading' })
                api = controller
                return () => h(Overlay, {}, { default: () => h('button', 'Inside') })
            },
        }))
        api.open()
        await settle()
        api.lock()
        escape()
        await settle()
        expect(api.state.open).toBe(true)
        document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
        await settle()
        expect(api.state.open).toBe(true)
        await api.close('api')
        expect(api.state.open).toBe(false)
    })
})
