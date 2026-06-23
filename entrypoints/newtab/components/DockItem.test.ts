import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import type { Shortcut } from '../../../composables/useDock'

const mockIconGet = vi.fn().mockResolvedValue(null)

vi.mock('../../../composables/useIconStore', () => ({
    useIconStore: vi.fn(() => ({
        get: mockIconGet,
        set: vi.fn(),
        remove: vi.fn(),
    })),
}))

import DockItem from './DockItem.vue'

function makeShortcut(overrides?: Partial<Shortcut>): Shortcut {
    return {
        id: 'test-1',
        name: 'GitHub',
        url: 'https://github.com',
        iconType: 'online',
        ...overrides,
    }
}

describe('DockItem', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockIconGet.mockResolvedValue(null)
    })

    describe('icon rendering', () => {
        it('renders online favicon img', () => {
            const wrapper = mount(DockItem, {
                props: { shortcut: makeShortcut({ iconType: 'online' }), editMode: false },
            })
            const img = wrapper.find('img')
            expect(img.exists()).toBe(true)
            expect(img.attributes('src')).toContain('google.com/s2/favicons')
            expect(img.attributes('src')).toContain('github.com')
        })

        it('renders solid colored div with first letter', () => {
            const wrapper = mount(DockItem, {
                props: { shortcut: makeShortcut({ iconType: 'solid', solidColor: '#ff0000', name: 'Red' }), editMode: false },
            })
            expect(wrapper.find('img').exists()).toBe(false)
            const iconDiv = wrapper.findAll('[class*="icon"]')[0]
            expect(iconDiv.attributes('style')).toContain('background-color')
            expect(iconDiv.text()).toBe('R')
        })

        it('falls back to solid letter when online img errors', async () => {
            const wrapper = mount(DockItem, {
                props: { shortcut: makeShortcut({ iconType: 'online', name: 'GitHub' }), editMode: false },
            })
            // Simulate img error event
            await wrapper.find('img').trigger('error')
            await nextTick()

            // After error, img should be gone, solid div shown
            expect(wrapper.find('img').exists()).toBe(false)
            const iconDiv = wrapper.findAll('[class*="icon"]')[0]
            expect(iconDiv.text()).toBe('G')
        })
    })

    describe('upload icon', () => {
        it('loads upload icon from iconStore', async () => {
            mockIconGet.mockResolvedValue('data:image/png;base64,abc123')
            const wrapper = mount(DockItem, {
                props: { shortcut: makeShortcut({ iconType: 'upload' }), editMode: false },
            })
            // Wait for onMounted async
            await nextTick()
            await nextTick()

            const img = wrapper.find('img')
            expect(img.exists()).toBe(true)
            expect(img.attributes('src')).toBe('data:image/png;base64,abc123')
        })

        it('shows solid fallback when upload icon not found', async () => {
            mockIconGet.mockResolvedValue(null)
            const wrapper = mount(DockItem, {
                props: { shortcut: makeShortcut({ iconType: 'upload', name: 'X' }), editMode: false },
            })
            await nextTick()
            await nextTick()

            expect(wrapper.find('img').exists()).toBe(false)
        })
    })

    describe('navigation', () => {
        it('navigates to shortcut URL on click', () => {
            vi.stubGlobal('location', { href: '' })
            const wrapper = mount(DockItem, {
                props: { shortcut: makeShortcut({ url: 'https://example.com' }), editMode: false },
            })
            wrapper.trigger('click')
            expect(window.location.href).toBe('https://example.com')
        })

        it('does not navigate when editMode is true', () => {
            vi.stubGlobal('location', { href: '' })
            const wrapper = mount(DockItem, {
                props: { shortcut: makeShortcut({ url: 'https://example.com' }), editMode: true },
            })
            wrapper.trigger('click')
            expect(window.location.href).toBe('')
        })
    })

    describe('display', () => {
        it('shows shortcut name', () => {
            const wrapper = mount(DockItem, {
                props: { shortcut: makeShortcut({ name: 'MyApp' }), editMode: false },
            })
            expect(wrapper.text()).toContain('MyApp')
        })

        it('shows first letter uppercase', () => {
            const wrapper = mount(DockItem, {
                props: { shortcut: makeShortcut({ name: 'test', iconType: 'solid' }), editMode: false },
            })
            const iconDiv = wrapper.findAll('[class*="icon"]')[0]
            expect(iconDiv.text()).toBe('T')
        })
    })
})
