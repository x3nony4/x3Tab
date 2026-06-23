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

function mountItem(props?: Partial<{ shortcut: Shortcut; editMode: boolean; index: number }>) {
  return mount(DockItem, {
    props: {
      shortcut: makeShortcut(),
      editMode: false,
      index: 0,
      ...props,
    },
  })
}

describe('DockItem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIconGet.mockResolvedValue(null)
  })

  describe('icon rendering', () => {
    it('renders online favicon img', () => {
      const wrapper = mountItem({ shortcut: makeShortcut({ iconType: 'online' }) })
      const img = wrapper.find('img')
      expect(img.exists()).toBe(true)
      expect(img.attributes('src')).toContain('google.com/s2/favicons')
      expect(img.attributes('src')).toContain('github.com')
    })

    it('renders solid colored div with first letter', () => {
      const wrapper = mountItem({ shortcut: makeShortcut({ iconType: 'solid', solidColor: '#ff0000', name: 'Red' }) })
      expect(wrapper.find('img').exists()).toBe(false)
      const iconDiv = wrapper.find('[style*="background-color"]')
      expect(iconDiv.exists()).toBe(true)
      expect(iconDiv.text()).toBe('R')
    })

    it('falls back to solid letter when online img errors', async () => {
      const wrapper = mountItem({ shortcut: makeShortcut({ iconType: 'online', name: 'GitHub' }) })
      await wrapper.find('img').trigger('error')
      await nextTick()

      expect(wrapper.find('img').exists()).toBe(false)
      const iconDiv = wrapper.find('[style*="background-color"]')
      expect(iconDiv.exists()).toBe(true)
      expect(iconDiv.text()).toBe('G')
    })
  })

  describe('upload icon', () => {
    it('loads upload icon from iconStore', async () => {
      mockIconGet.mockResolvedValue('data:image/png;base64,abc123')
      const wrapper = mountItem({ shortcut: makeShortcut({ iconType: 'upload' }) })
      await nextTick()
      await nextTick()

      const img = wrapper.find('img')
      expect(img.exists()).toBe(true)
      expect(img.attributes('src')).toBe('data:image/png;base64,abc123')
    })

    it('shows solid fallback when upload icon not found', async () => {
      mockIconGet.mockResolvedValue(null)
      const wrapper = mountItem({ shortcut: makeShortcut({ iconType: 'upload', name: 'X' }) })
      await nextTick()
      await nextTick()

      expect(wrapper.find('img').exists()).toBe(false)
    })
  })

  describe('navigation', () => {
    it('navigates to shortcut URL on click', () => {
      vi.stubGlobal('location', { href: '' })
      const wrapper = mountItem({ shortcut: makeShortcut({ url: 'https://example.com' }) })
      wrapper.trigger('click')
      expect(window.location.href).toBe('https://example.com')
    })

    it('does not navigate when editMode is true', () => {
      vi.stubGlobal('location', { href: '' })
      const wrapper = mountItem({ shortcut: makeShortcut({ url: 'https://example.com' }), editMode: true })
      wrapper.trigger('click')
      expect(window.location.href).toBe('')
    })
  })

  describe('display', () => {
    it('shows shortcut name', () => {
      const wrapper = mountItem({ shortcut: makeShortcut({ name: 'MyApp' }) })
      expect(wrapper.text()).toContain('MyApp')
    })

    it('shows first letter uppercase', () => {
      const wrapper = mountItem({ shortcut: makeShortcut({ name: 'test', iconType: 'solid' }) })
      const iconDiv = wrapper.find('[style*="background-color"]')
      expect(iconDiv.exists()).toBe(true)
      expect(iconDiv.text()).toBe('T')
    })
  })

  describe('edit mode — delete badge', () => {
    it('shows delete badge when editMode is true', () => {
      const wrapper = mountItem({ editMode: true })
      expect(wrapper.find('[class*="deleteBadge"]').exists()).toBe(true)
    })

    it('hides delete badge when editMode is false', () => {
      const wrapper = mountItem({ editMode: false })
      expect(wrapper.find('[class*="deleteBadge"]').exists()).toBe(false)
    })

    it('emits delete on badge click', async () => {
      const wrapper = mountItem({ editMode: true, shortcut: makeShortcut({ id: 'del-1' }) })
      await wrapper.find('[class*="deleteBadge"]').trigger('click')
      expect(wrapper.emitted('delete')).toHaveLength(1)
      expect(wrapper.emitted('delete')![0]).toEqual(['del-1'])
    })
  })

  describe('edit mode — hover mask', () => {
    it('shows hover mask when editMode is true', () => {
      const wrapper = mountItem({ editMode: true })
      expect(wrapper.find('[class*="hoverMask"]').exists()).toBe(true)
    })

    it('hides hover mask when editMode is false', () => {
      const wrapper = mountItem({ editMode: false })
      expect(wrapper.find('[class*="hoverMask"]').exists()).toBe(false)
    })

    it('emits edit on hover mask click', async () => {
      const wrapper = mountItem({ editMode: true, shortcut: makeShortcut({ id: 'edit-1' }) })
      await wrapper.find('[class*="hoverMask"]').trigger('click')
      expect(wrapper.emitted('edit')).toHaveLength(1)
      expect(wrapper.emitted('edit')![0]).toEqual(['edit-1'])
    })
  })

  describe('edit mode — shaking', () => {
    it('adds shaking class when editMode is true', () => {
      const wrapper = mountItem({ editMode: true })
      expect(wrapper.find('[class*="shaking"]').exists()).toBe(true)
    })

    it('does not add shaking class when editMode is false', () => {
      const wrapper = mountItem({ editMode: false })
      expect(wrapper.find('[class*="shaking"]').exists()).toBe(false)
    })

    it('sets animation delay based on index', () => {
      const wrapper = mountItem({ editMode: true, index: 5 })
      const item = wrapper.find('[class*="item"]')
      expect(item.attributes('style')).toContain('animation-delay')
      expect(item.attributes('style')).toContain('0.25s') // 5 * 0.05
    })
  })

  describe('edit mode — drag', () => {
    it('is draggable when editMode is true', () => {
      const wrapper = mountItem({ editMode: true })
      expect(wrapper.attributes('draggable')).toBe('true')
    })

    it('is not draggable when editMode is false', () => {
      const wrapper = mountItem({ editMode: false })
      expect(wrapper.attributes('draggable')).toBe('false')
    })

    it('emits dragstart with index on drag', async () => {
      const wrapper = mountItem({ editMode: true, index: 3 })

      const dtMock = {
        effectAllowed: '',
      } as DataTransfer
      await wrapper.trigger('dragstart', { dataTransfer: dtMock })

      expect(wrapper.emitted('dragstart')).toHaveLength(1)
      expect(wrapper.emitted('dragstart')![0]).toEqual([3])
    })
  })
})
