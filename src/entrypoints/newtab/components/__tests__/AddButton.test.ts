import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AddButton from '../AddButton.vue'

describe('AddButton', () => {
    it('renders "+" button', () => {
        const wrapper = mount(AddButton, { props: { disabled: false } })
        expect(wrapper.text()).toBe('+')
    })

    it('is enabled when not disabled', () => {
        const wrapper = mount(AddButton, { props: { disabled: false } })
        expect(wrapper.find('button').attributes('disabled')).toBeUndefined()
    })

    it('is disabled when disabled prop is true', () => {
        const wrapper = mount(AddButton, { props: { disabled: true } })
        const btn = wrapper.find('button')
        expect(btn.attributes('disabled')).toBeDefined()
    })

    it('shows limit tooltip when disabled', () => {
        const wrapper = mount(AddButton, { props: { disabled: true } })
        expect(wrapper.find('button').attributes('title')).toBe('已达到 15 个快捷方式上限')
    })

    it('shows add tooltip when enabled', () => {
        const wrapper = mount(AddButton, { props: { disabled: false } })
        expect(wrapper.find('button').attributes('title')).toBe('添加快捷方式')
    })

    it('emits click when clicked', async () => {
        const wrapper = mount(AddButton, { props: { disabled: false } })
        await wrapper.find('button').trigger('click')
        expect(wrapper.emitted('click')).toHaveLength(1)
    })

    it('does not emit click when disabled', async () => {
        const wrapper = mount(AddButton, { props: { disabled: true } })
        await wrapper.find('button').trigger('click')
        expect(wrapper.emitted('click')).toBeUndefined()
    })
})
