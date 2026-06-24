import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import type { Shortcut } from '@/composables/useDock'

const mockGetIcon = vi.fn().mockResolvedValue(null)

import DockItem from '../DockItem.vue'

function makeShortcut(overrides?: Partial<Shortcut>): Shortcut {
  return {
    id: 'test-1',
    name: 'GitHub',
    url: 'https://github.com',
    iconType: 'online',
    ...overrides,
  }
}

function mountItem(props?: Partial<{ shortcut: Shortcut; getIcon: (id: string) => Promise<string | null> }>) {
  return mount(DockItem, {
    props: {
      shortcut: makeShortcut(),
      getIcon: mockGetIcon,
      ...props,
    },
  })
}

describe('DockItem', () => {
  beforeEach(() => {
    mockGetIcon.mockResolvedValue(null)
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
    it('loads upload icon from getIcon prop', async () => {
      mockGetIcon.mockResolvedValue('data:image/png;base64,abc123')
      const wrapper = mountItem({ shortcut: makeShortcut({ iconType: 'upload' }) })
      await nextTick()
      await nextTick()

      const img = wrapper.find('img')
      expect(img.exists()).toBe(true)
      expect(img.attributes('src')).toBe('data:image/png;base64,abc123')
    })

    it('shows solid fallback when upload icon not found', async () => {
      mockGetIcon.mockResolvedValue(null)
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
})
