import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import type { Shortcut } from '@/composables/useDock'

const mockShortcuts = ref<Shortcut[]>([])
const mockEditMode = ref(false)
const mockAdd = vi.fn()
const mockUpdate = vi.fn()
const mockRemove = vi.fn()
const mockReorder = vi.fn()
const mockEnterEditMode = vi.fn()
const mockExitEditMode = vi.fn()
const mockGetIcon = vi.fn()

vi.mock('@/composables/useDock', () => ({
  useDock: vi.fn(() => ({
    shortcuts: mockShortcuts,
    editMode: mockEditMode,
    add: mockAdd,
    update: mockUpdate,
    remove: mockRemove,
    reorder: mockReorder,
    enterEditMode: mockEnterEditMode,
    exitEditMode: mockExitEditMode,
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
  mockEditMode.value = false
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
    it('shows context menu on right-click', async () => {
      const wrapper = mount(DockBar)
      await wrapper.find('[data-testid="dock-bar"]').trigger('contextmenu', {
        clientX: 300,
        clientY: 400,
      })
      // Reka ContextMenu renders content inline (no Portal)
      expect(wrapper.find('[role="menuitem"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('编辑 Docker 栏')
    })

    it('context menu shows "退出编辑" when editMode is true', async () => {
      mockEditMode.value = true
      const wrapper = mount(DockBar)
      await wrapper.find('[data-testid="dock-bar"]').trigger('contextmenu', {
        clientX: 0,
        clientY: 0,
      })
      expect(wrapper.text()).toContain('退出编辑')
    })

    it('toggle-edit calls enterEditMode when editMode is false', async () => {
      const wrapper = mount(DockBar)
      const ctxMenu = wrapper.findComponent({ name: 'ContextMenu' })
      await ctxMenu.vm.$emit('toggleEdit')
      expect(mockEnterEditMode).toHaveBeenCalled()
    })

    it('toggle-edit calls exitEditMode when editMode is true', async () => {
      mockEditMode.value = true
      const wrapper = mount(DockBar)
      const ctxMenu = wrapper.findComponent({ name: 'ContextMenu' })
      await ctxMenu.vm.$emit('toggleEdit')
      expect(mockExitEditMode).toHaveBeenCalled()
    })
  })

  describe('EditCard', () => {
    it('opens EditCard on AddButton click (create mode)', async () => {
      const wrapper = mount(DockBar)
      await wrapper.find('button').trigger('click')
      expect(wrapper.text()).toContain('添加快捷方式')
    })

    it('opens EditCard on DockItem edit with shortcut pre-filled', async () => {
      mockShortcuts.value = [
        makeShortcut({ id: 'edit-me', name: 'MyApp', url: 'https://myapp.com' }),
      ]
      const wrapper = mount(DockBar)
      const item = wrapper.findComponent({ name: 'DockItem' })
      await item.vm.$emit('edit', 'edit-me')
      await nextTick()
      expect(wrapper.text()).toContain('编辑快捷方式')
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

    it('save in edit mode calls update()', async () => {
      mockShortcuts.value = [
        makeShortcut({ id: 'existing', name: 'Old', url: 'https://old.com' }),
      ]
      const wrapper = mount(DockBar)

      const item = wrapper.findComponent({ name: 'DockItem' })
      await item.vm.$emit('edit', 'existing')
      await nextTick()

      const editCard = wrapper.findComponent({ name: 'EditCard' })
      await editCard.vm.$emit('save', {
        name: 'Updated',
        url: 'https://updated.com',
        iconType: 'online',
      })
      expect(mockUpdate).toHaveBeenCalledWith('existing', {
        name: 'Updated',
        url: 'https://updated.com',
        iconType: 'online',
      }, undefined)
    })

    it('save in edit mode with upload passes iconBlob to update', async () => {
      mockShortcuts.value = [
        makeShortcut({ id: 'existing2', name: 'Old', url: 'https://old.com' }),
      ]
      const wrapper = mount(DockBar)

      const item = wrapper.findComponent({ name: 'DockItem' })
      await item.vm.$emit('edit', 'existing2')
      await nextTick()

      const editCard = wrapper.findComponent({ name: 'EditCard' })
      await editCard.vm.$emit('save', {
        name: 'Old',
        url: 'https://old.com',
        iconType: 'upload',
        uploadDataUrl: 'data:image/png;base64,abc',
      })
      expect(mockUpdate).toHaveBeenCalledWith('existing2',
        { name: 'Old', url: 'https://old.com', iconType: 'upload' },
        'data:image/png;base64,abc',
      )
    })

    it('cancel closes EditCard', async () => {
      const wrapper = mount(DockBar)
      await wrapper.find('button').trigger('click')
      expect(wrapper.text()).toContain('添加快捷方式')

      const editCard = wrapper.findComponent({ name: 'EditCard' })
      await editCard.vm.$emit('cancel')
      await nextTick()
      // After cancel, showEditCard=false, EditCard receives open=false
      expect(editCard.props('open')).toBe(false)
    })
  })

  describe('delete', () => {
    it('calls remove on delete', async () => {
      mockShortcuts.value = [
        makeShortcut({ id: 'del-me', name: 'Del' }),
      ]
      const wrapper = mount(DockBar)

      const item = wrapper.findComponent({ name: 'DockItem' })
      await item.vm.$emit('delete', 'del-me')

      expect(mockRemove).toHaveBeenCalledWith('del-me')
    })
  })

  describe('drag and drop', () => {
    it('reorders on dragover after dragstart', async () => {
      mockShortcuts.value = [
        makeShortcut({ id: 'a', name: 'A' }),
        makeShortcut({ id: 'b', name: 'B' }),
        makeShortcut({ id: 'c', name: 'C' }),
      ]
      const wrapper = mount(DockBar)

      const items = wrapper.findAllComponents({ name: 'DockItem' })

      // Drag start from index 0
      await items[0].vm.$emit('dragstart', 0)
      // Drag over index 2
      await items[2].trigger('dragover')
      expect(mockReorder).toHaveBeenCalledWith(0, 2)

      // Drop
      await items[2].trigger('drop')
    })
  })

  describe('keyboard', () => {
    it('Escape calls exitEditMode when editMode is true', async () => {
      mockEditMode.value = true
      const wrapper = mount(DockBar)

      await wrapper.find('[data-testid="dock-bar"]').trigger('keydown', { key: 'Escape' })
      expect(mockExitEditMode).toHaveBeenCalled()
    })
  })
})
