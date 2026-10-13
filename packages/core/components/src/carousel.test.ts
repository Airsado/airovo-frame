// @vitest-environment happy-dom
import { h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@airovo/uikit-shadcnui'

describe('Carousel public exports', () => {
    it('renders region and slide semantics with previous/next controls', () => {
        const wrapper = mount(Carousel, {
            slots: {
                default: () => [
                    h(CarouselContent, null, () => [h(CarouselItem, null, () => 'One'), h(CarouselItem, null, () => 'Two')]),
                    h(CarouselPrevious),
                    h(CarouselNext),
                ],
            },
        })

        expect(wrapper.attributes('role')).toBe('region')
        expect(wrapper.attributes('aria-roledescription')).toBe('carousel')
        expect(wrapper.findAll('[data-slot="carousel-item"]')).toHaveLength(2)
        expect(wrapper.get('[data-slot="carousel-previous"]').attributes('aria-label')).toBe('Previous slide')
        expect(wrapper.get('[data-slot="carousel-next"]').attributes('aria-label')).toBe('Next slide')
    })

    it('supports vertical orientation', () => {
        const wrapper = mount(Carousel, {
            props: { orientation: 'vertical' },
            slots: { default: () => h(CarouselContent, null, () => h(CarouselItem, null, () => 'One')) },
        })

        expect(wrapper.find('.flex-col').exists()).toBe(true)
    })

    it('keeps navigation controls enabled at loop boundaries', async () => {
        const wrapper = mount(Carousel, {
            props: { loop: true },
            slots: { default: () => [h(CarouselContent, null, () => [h(CarouselItem, null, () => 'One'), h(CarouselItem, null, () => 'Two')]), h(CarouselPrevious), h(CarouselNext)] },
        })
        await nextTick()
        await nextTick()
        expect((wrapper.get('[data-slot="carousel-previous"]').element as HTMLButtonElement).disabled).toBe(false)
        expect((wrapper.get('[data-slot="carousel-next"]').element as HTMLButtonElement).disabled).toBe(false)
    })
})
