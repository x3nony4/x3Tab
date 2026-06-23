import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ContextMenu from '../ContextMenu.vue'

function mountMenu(editMode = false) {
  return mount(ContextMenu, {
    props: { editMode },
    slots: { default: '<div class="dock-area">Dock content</div>' },
  })
}

/** Right-click the trigger to open the context menu. */
async function openMenu(wrapper: ReturnType<typeof mount>) {
  await wrapper.find('.dock-area').trigger('contextmenu', {
    clientX: 100,
    clientY: 100,
  })
  await nextTick()
}

describe('ContextMenu', () => {
  it('renders trigger slot content', () => {
    const wrapper = mountMenu()
    expect(wrapper.find('.dock-area').exists()).toBe(true)
    expect(wrapper.text()).toContain('Dock content')
  })

  it('shows "编辑 Docker 栏" when editMode is false', async () => {
    const wrapper = mountMenu(false)
    await openMenu(wrapper)
    const item = wrapper.find('[role="menuitem"]')
    expect(item.exists()).toBe(true)
    expect(item.text()).toBe('编辑 Docker 栏')
  })

  it('shows "退出编辑" when editMode is true', async () => {
    const wrapper = mountMenu(true)
    await openMenu(wrapper)
    expect(wrapper.find('[role="menuitem"]').text()).toBe('退出编辑')
  })

  it('emits toggleEdit on menu item click', async () => {
    const wrapper = mountMenu(false)
    await openMenu(wrapper)
    await wrapper.find('[role="menuitem"]').trigger('click')
    expect(wrapper.emitted('toggleEdit')).toHaveLength(1)
  })
})
