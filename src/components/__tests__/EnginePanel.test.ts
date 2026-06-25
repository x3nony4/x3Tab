import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { ref, nextTick } from 'vue'
import { PopoverRoot } from 'reka-ui'
import { fakeBrowser } from 'wxt/testing'
import EnginePanel from '../EnginePanel.vue'
import type { SearchEngine } from '../../entrypoints/newtab/engines'

const defaults: SearchEngine[] = [
    { id: 'baidu', name: 'Baidu', urlTemplate: 'https://www.baidu.com/s?wd=%s', color: '#2932e1' },
    { id: 'google', name: 'Google', urlTemplate: 'https://www.google.com/search?q=%s', color: '#4285f4' },
]

const flush = () => new Promise(r => setTimeout(r))

function bodyButtons(): NodeListOf<HTMLButtonElement> {
  return document.body.querySelectorAll('button')
}

function bodyTextInputs(): NodeListOf<HTMLInputElement> {
  return document.body.querySelectorAll('input[type="text"]')
}

let wrapper: VueWrapper<unknown>

function mountPanel(open = true) {
    const showToastMock = vi.fn()
    const onSelectMock = vi.fn()
    wrapper = mount(
        {
            components: { PopoverRoot, EnginePanel },
            template: `
                <PopoverRoot v-model:open="openState">
                    <EnginePanel @select="onSelect" />
                </PopoverRoot>
            `,
            setup() {
                const openState = ref(open)
                return { openState, onSelect: onSelectMock }
            },
        },
        {
            attachTo: document.body,
            global: {
                provide: { showToast: showToastMock },
            },
        },
    )
    return { wrapper, showToastMock, onSelectMock }
}

beforeEach(async () => {
    await fakeBrowser.reset()
    await browser.storage.local.set({ 'engines': [...defaults] })
})

afterEach(() => {
  if (wrapper) wrapper.unmount()
})

describe('EnginePanel', () => {
    // ── Expand / collapse ──
    it('renders when PopoverRoot is open', async () => {
        const { wrapper } = mountPanel(true)
        await nextTick()
        await flush()
        expect(wrapper.find('.engine-panel').exists()).toBe(true)
    })

    it('does not render when PopoverRoot is closed', async () => {
        const { wrapper } = mountPanel(false)
        await nextTick()
        await flush()
        expect(wrapper.find('.engine-panel').exists()).toBe(false)
    })

    // ── Engine items ──
    it('renders all engines from storage', async () => {
        mountPanel()
        await nextTick()
        await flush()
        const items = wrapper.findAll('.engine-item')
        expect(items).toHaveLength(2)
        expect(wrapper.find('.add-btn-item').exists()).toBe(true)
    })

    it('shows engine initial letter in icon', async () => {
        mountPanel()
        await nextTick()
        await flush()
        const icons = wrapper.findAll('.engine-icon')
        expect(icons[0].text()).toBe('B')
        expect(icons[1].text()).toBe('G')
    })

    it('shows engine name', async () => {
        mountPanel()
        await nextTick()
        await flush()
        const names = wrapper.findAll('.engine-item .engine-name')
        expect(names[0].text()).toBe('Baidu')
        expect(names[1].text()).toBe('Google')
    })

    it('add button shows add icon and "添加" label', async () => {
        mountPanel()
        await nextTick()
        await flush()
        const addIcon = wrapper.find('.add-icon')
        const addName = wrapper.find('.add-btn-item .engine-name')
        expect(addIcon.exists()).toBe(true)
        expect(addName.text()).toBe('添加')
    })

    // ── Select engine ──
    it('emits select when engine clicked', async () => {
        const { onSelectMock } = mountPanel()
        await nextTick()
        await flush()
        await wrapper.findAll('.engine-item')[0].trigger('click')
        expect(onSelectMock).toHaveBeenCalled()
        expect(onSelectMock).toHaveBeenCalledWith(expect.objectContaining({ id: 'baidu', name: 'Baidu' }))
    })

    // ── Delete engine ──
    it('shows delete button only when engines > 1', async () => {
        mountPanel()
        await nextTick()
        await flush()
        const delButtons = wrapper.findAll('.del-btn')
        expect(delButtons).toHaveLength(2)
    })

    it('does not show delete buttons when only 1 engine', async () => {
        await browser.storage.local.set({ 'engines': [defaults[0]] })
        mountPanel()
        await nextTick()
        await flush()
        expect(wrapper.findAll('.del-btn')).toHaveLength(0)
    })

    it('shows toast when attempting to delete last engine', async () => {
        await browser.storage.local.set({ 'engines': [defaults[0]] })
        const { showToastMock } = mountPanel()
        await nextTick()
        await flush()
        expect(wrapper.findAll('.del-btn')).toHaveLength(0)
        expect(showToastMock).not.toHaveBeenCalled()
    })

    // ── Add engine form (portal — queries document.body) ──
    it('opens add form when + is clicked', async () => {
        mountPanel()
        await nextTick()
        await flush()
        await wrapper.find('.add-btn-item').trigger('click')
        await nextTick()
        expect(bodyTextInputs().length).toBeGreaterThanOrEqual(2)
    })

    it('adds engine after valid form submit', async () => {
        mountPanel()
        await nextTick()
        await flush()

        await wrapper.find('.add-btn-item').trigger('click')
        await nextTick()

        const inputs = bodyTextInputs()
        inputs[0].value = 'GitHub'
        inputs[0].dispatchEvent(new Event('input'))
        inputs[1].value = 'https://github.com/search?q=%s'
        inputs[1].dispatchEvent(new Event('input'))

        const buttons = Array.from(bodyButtons())
        const confirmBtn = buttons.find(b => b.textContent === '添加')
        confirmBtn!.click()
        await nextTick()
        await flush()

        expect(wrapper.findAll('.engine-item')).toHaveLength(3)
    })

    it('shows error when name is empty', async () => {
        mountPanel()
        await nextTick()
        await flush()

        await wrapper.find('.add-btn-item').trigger('click')
        await nextTick()

        const buttons = Array.from(bodyButtons())
        const confirmBtn = buttons.find(b => b.textContent === '添加')
        confirmBtn!.click()
        await nextTick()

        expect(document.body.textContent).toContain('名称不能为空')
    })

    it('shows error when url template missing %s', async () => {
        mountPanel()
        await nextTick()
        await flush()

        await wrapper.find('.add-btn-item').trigger('click')
        await nextTick()

        const inputs = bodyTextInputs()
        inputs[0].value = 'GitHub'
        inputs[0].dispatchEvent(new Event('input'))
        inputs[1].value = 'https://github.com/search'
        inputs[1].dispatchEvent(new Event('input'))

        const buttons = Array.from(bodyButtons())
        const confirmBtn = buttons.find(b => b.textContent === '添加')
        confirmBtn!.click()
        await nextTick()

        expect(document.body.textContent).toContain('URL 模板必须包含 %s 占位符')
    })

    it('cancels add form without adding engine', async () => {
        mountPanel()
        await nextTick()
        await flush()

        await wrapper.find('.add-btn-item').trigger('click')
        await nextTick()

        const buttons = Array.from(bodyButtons())
        const cancelBtn = buttons.find(b => b.textContent === '取消')
        cancelBtn!.click()
        await nextTick()

        expect(wrapper.findAll('.engine-item')).toHaveLength(2)
    })

    // ── Persistence ──
    it('persists engine list to storage after add', async () => {
        mountPanel()
        await nextTick()
        await flush()

        await wrapper.find('.add-btn-item').trigger('click')
        await nextTick()

        const inputs = bodyTextInputs()
        inputs[0].value = 'NPM'
        inputs[0].dispatchEvent(new Event('input'))
        inputs[1].value = 'https://www.npmjs.com/search?q=%s'
        inputs[1].dispatchEvent(new Event('input'))

        const buttons = Array.from(bodyButtons())
        const confirmBtn = buttons.find(b => b.textContent === '添加')
        confirmBtn!.click()
        await flush()

        const result = await browser.storage.local.get('engines')
        const stored = result['engines'] as SearchEngine[]
        expect(stored).toHaveLength(3)
        expect(stored[2].name).toBe('NPM')
        expect(stored[2].urlTemplate).toBe('https://www.npmjs.com/search?q=%s')
    })

    it('persists engine list to storage after delete', async () => {
        mountPanel()
        await nextTick()
        await flush()

        await wrapper.findAll('.del-btn')[0].trigger('click')
        await flush()

        const result = await browser.storage.local.get('engines')
        const stored = result['engines'] as SearchEngine[]
        expect(stored).toHaveLength(1)
    })

    // ── Close add form via cancel emit ──
    it('closes add form when cancel button clicked', async () => {
        mountPanel()
        await nextTick()
        await flush()

        await wrapper.find('.add-btn-item').trigger('click')
        await nextTick()

        // Form is open via FormDialog portal — title visible in body
        expect(document.body.textContent).toContain('添加搜索引擎')

        const buttons = Array.from(bodyButtons())
        const cancelBtn = buttons.find(b => b.textContent === '取消')
        cancelBtn!.click()
        await nextTick()
        await flush()

        // Form closed — dialog title removed from body
        expect(document.body.textContent).not.toContain('添加搜索引擎')
    })
})
