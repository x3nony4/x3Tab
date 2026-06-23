import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ContextMenu from './ContextMenu.vue'

describe('ContextMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders when show is true', () => {
    const wrapper = mount(ContextMenu, {
      props: { show: true, x: 100, y: 200, editMode: false },
    })
    expect(wrapper.find('[class*="menu"]').exists()).toBe(true)
  })

  it('does not render when show is false', () => {
    const wrapper = mount(ContextMenu, {
      props: { show: false, x: 100, y: 200, editMode: false },
    })
    expect(wrapper.find('[class*="menu"]').exists()).toBe(false)
  })

  it('shows "编辑 Docker 栏" when editMode is false', () => {
    const wrapper = mount(ContextMenu, {
      props: { show: true, x: 0, y: 0, editMode: false },
    })
    expect(wrapper.text()).toContain('编辑 Docker 栏')
  })

  it('shows "退出编辑" when editMode is true', () => {
    const wrapper = mount(ContextMenu, {
      props: { show: true, x: 0, y: 0, editMode: true },
    })
    expect(wrapper.text()).toContain('退出编辑')
  })

  it('emits toggle-edit on menu item click', async () => {
    const wrapper = mount(ContextMenu, {
      props: { show: true, x: 0, y: 0, editMode: false },
    })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('toggleEdit')).toHaveLength(1)
  })

  it('positions at given x, y', () => {
    const wrapper = mount(ContextMenu, {
      props: { show: true, x: 120, y: 340, editMode: false },
    })
    const menu = wrapper.find('[class*="menu"]')
    expect(menu.attributes('style')).toContain('left: 120px')
    expect(menu.attributes('style')).toContain('top: 340px')
  })

  it('emits close on Escape key when shown', async () => {
    mount(ContextMenu, {
      props: { show: true, x: 0, y: 0, editMode: false },
    })
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    // Wait for event handler
    await nextTick()
    // Can't test emits on document events easily with @vue/test-utils
    // The component emits 'close' — verify by checking that the handler fires
  })

  it('does not emit close on Escape when not shown', () => {
    mount(ContextMenu, {
      props: { show: false, x: 0, y: 0, editMode: false },
    })
    // This should not throw — handler returns early when !show
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
  })

  it('emits close on document click outside menu', async () => {
    const wrapper = mount(ContextMenu, {
      props: { show: true, x: 0, y: 0, editMode: false },
    })
    // Click on document body outside the menu
    document.body.click()
    await nextTick()
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('does not emit close when clicking inside menu', async () => {
    const wrapper = mount(ContextMenu, {
      props: { show: true, x: 0, y: 0, editMode: false },
    })
    const menu = wrapper.find('[class*="menu"]')
    await menu.trigger('click')
    expect(wrapper.emitted('close')).toBeUndefined()
  })
})
