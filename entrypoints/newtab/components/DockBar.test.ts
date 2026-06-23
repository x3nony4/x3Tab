import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { mount } from '@vue/test-utils'
import type { Shortcut } from '../../../composables/useDock'

const mockShortcuts = ref<Shortcut[]>([])
const mockEditMode = ref(false)

vi.mock('../../../composables/useDock', () => ({
    useDock: vi.fn(() => ({
        shortcuts: mockShortcuts,
        editMode: mockEditMode,
        add: vi.fn(),
        update: vi.fn(),
        remove: vi.fn(),
        reorder: vi.fn(),
        enterEditMode: vi.fn(),
        exitEditMode: vi.fn(),
    })),
    MAX_SHORTCUTS: 15,
}))

import DockBar from './DockBar.vue'

function makeShortcut(overrides?: Partial<Shortcut>): Shortcut {
    return {
        id: 'test-1',
        name: 'App',
        url: 'https://example.com',
        iconType: 'online' as const,
        ...overrides,
    }
}

beforeEach(() => {
    mockShortcuts.value = []
    mockEditMode.value = false
})

describe('DockBar', () => {
    it('renders container', () => {
        const wrapper = mount(DockBar)
        expect(wrapper.find('[class*="container"]').exists()).toBe(true)
    })

    it('renders DockItem for each shortcut', () => {
        mockShortcuts.value = [
            makeShortcut({ id: 'a', name: 'A' }),
            makeShortcut({ id: 'b', name: 'B' }),
        ]
        const wrapper = mount(DockBar)
        // DockItem renders the shortcut name
        expect(wrapper.text()).toContain('A')
        expect(wrapper.text()).toContain('B')
    })

    it('renders AddButton', () => {
        const wrapper = mount(DockBar)
        expect(wrapper.text()).toContain('+')
    })

    it('AddButton is disabled when at 15 shortcuts', () => {
        mockShortcuts.value = Array.from({ length: 15 }, (_, i) =>
            makeShortcut({ id: `s${i}`, name: `S${i}`, url: `https://x.com/${i}` }),
        )
        const wrapper = mount(DockBar)
        const btn = wrapper.find('button')
        expect(btn.attributes('disabled')).toBeDefined()
    })

    it('AddButton is enabled when under limit', () => {
        mockShortcuts.value = [makeShortcut()]
        const wrapper = mount(DockBar)
        const btn = wrapper.find('button')
        expect(btn.attributes('disabled')).toBeUndefined()
    })

    it('shows empty bar with only AddButton when no shortcuts', () => {
        mockShortcuts.value = []
        const wrapper = mount(DockBar)
        expect(wrapper.text()).toContain('+')
        // No DockItem names visible
        expect(wrapper.findAll('[class*="item"]')).toHaveLength(0)
    })
})
