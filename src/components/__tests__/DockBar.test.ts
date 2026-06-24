import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import type { Shortcut } from '@/composables/useDock'

const mockShortcuts = ref<Shortcut[]>([])
const mockAdd = vi.fn()
const mockUpdate = vi.fn()
const mockRemove = vi.fn()
const mockGetIcon = vi.fn()

vi.mock('@/composables/useDock', () => ({
  useDock: vi.fn(() => ({
    shortcuts: mockShortcuts,
    add: mockAdd,
    update: mockUpdate,
    remove: mockRemove,
    getIcon: mockGetIcon,
  })),
  MAX_SHORTCUTS: 15,
}))

import DockBar from '../DockBar.vue'

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
  mockAdd.mockClear()
  mockUpdate.mockClear()
  mockRemove.mockClear()
})

describe('DockBar', () => {
  describe('rendering', () => {
    it('renders container', () => {
      const wrapper = mount(DockBar)
      expect(wrapper.find('[data-testid="dock-bar"]').exists()).toBe(true)
    })

    it('renders DockItem for each shortcut', () => {
      mockShortcuts.value = [
        makeShortcut({ id: 'a', name: 'A' }),
        makeShortcut({ id: 'b', name: 'B' }),
      ]
      const wrapper = mount(DockBar)
      expect(wrapper.text()).toContain('A')
      expect(wrapper.text()).toContain('B')
    })

    it('renders AddButton', () => {
      const wrapper = mount(DockBar)
      expect(wrapper.find('button').exists()).toBe(true)
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
      expect(wrapper.find('button').exists()).toBe(true)
      expect(wrapper.findAll('[data-testid="dock-item"]')).toHaveLength(0)
    })
  })

  describe('context menu', () => {
    it('shows edit and delete items on right-click', async () => {
      mockShortcuts.value = [makeShortcut({ id: 'a', name: 'A' })]
      const wrapper = mount(DockBar)
      await nextTick()

      const dockItem = wrapper.find('[data-testid="dock-item"]')
      await dockItem.trigger('contextmenu', { button: 2 })
      await nextTick()

      const menuItems = wrapper.findAll('[role="menuitem"]')
      expect(menuItems).toHaveLength(2)
      expect(menuItems[0].text()).toBe('编辑')
      expect(menuItems[1].text()).toBe('删除')
    })

    it('click edit opens EditCard with shortcut pre-filled', async () => {
      mockShortcuts.value = [
        makeShortcut({ id: 'edit-me', name: 'MyApp', url: 'https://myapp.com' }),
      ]
      const wrapper = mount(DockBar)
      await nextTick()

      const dockItem = wrapper.find('[data-testid="dock-item"]')
      await dockItem.trigger('contextmenu', { button: 2 })
      await nextTick()

      const editItem = wrapper.find('[data-testid="menu-edit"]')
      await editItem.trigger('click')
      await nextTick()

      expect(wrapper.text()).toContain('编辑快捷方式')
      expect(wrapper.text()).toContain('MyApp')
    })

    it('click delete calls remove()', async () => {
      mockShortcuts.value = [makeShortcut({ id: 'del-me', name: 'Del' })]
      const wrapper = mount(DockBar)
      await nextTick()

      const dockItem = wrapper.find('[data-testid="dock-item"]')
      await dockItem.trigger('contextmenu', { button: 2 })
      await nextTick()

      const deleteItem = wrapper.find('[data-testid="menu-delete"]')
      await deleteItem.trigger('click')
      await nextTick()

      expect(mockRemove).toHaveBeenCalledWith('del-me')
    })
  })

  describe('EditCard', () => {
    it('opens EditCard on AddButton click (create mode)', async () => {
      const wrapper = mount(DockBar)
      await wrapper.find('button').trigger('click')
      expect(wrapper.text()).toContain('添加快捷方式')
    })

    it('save in create mode calls add()', async () => {
      const wrapper = mount(DockBar)
      await wrapper.find('button').trigger('click')

      const editCard = wrapper.findComponent({ name: 'EditCard' })
      await editCard.vm.$emit('save', {
        name: 'NewApp',
        url: 'https://newapp.com',
        iconType: 'online',
      })
      expect(mockAdd).toHaveBeenCalledWith({
        name: 'NewApp',
        url: 'https://newapp.com',
        iconType: 'online',
      }, undefined)
    })

    it('save in create mode with upload passes iconBlob to add', async () => {
      const wrapper = mount(DockBar)
      await wrapper.find('button').trigger('click')

      const editCard = wrapper.findComponent({ name: 'EditCard' })
      await editCard.vm.$emit('save', {
        name: 'Up',
        url: 'https://up.com',
        iconType: 'upload',
        uploadDataUrl: 'data:image/png;base64,xyz',
      })
      expect(mockAdd).toHaveBeenCalledWith(
        { name: 'Up', url: 'https://up.com', iconType: 'upload' },
        'data:image/png;base64,xyz',
      )
    })

    it('cancel closes EditCard', async () => {
      const wrapper = mount(DockBar)
      await wrapper.find('button').trigger('click')
      expect(wrapper.text()).toContain('添加快捷方式')

      const editCard = wrapper.findComponent({ name: 'EditCard' })
      await editCard.vm.$emit('cancel')
      await nextTick()
      expect(editCard.props('open')).toBe(false)
    })
  })
})
