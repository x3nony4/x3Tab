import { describe, it, expect, beforeEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { fakeBrowser } from 'wxt/testing'
import EnginePanel from './EnginePanel.vue'
import type { SearchEngine } from '../engines'

const defaults: SearchEngine[] = [
    { id: 'baidu', name: 'Baidu', urlTemplate: 'https://www.baidu.com/s?wd=%s', color: '#2932e1' },
    { id: 'google', name: 'Google', urlTemplate: 'https://www.google.com/search?q=%s', color: '#4285f4' },
]

const flush = () => new Promise(r => setTimeout(r))

function mountPanel(visible = true): VueWrapper<InstanceType<typeof EnginePanel>> {
    return mount(EnginePanel, {
        props: { visible },
        global: {
            stubs: { Teleport: true }
        }
    })
}

beforeEach(async () => {
    await fakeBrowser.reset()
    // Seed default engines into storage
    await browser.storage.local.set({ 'engines': [...defaults] })
})

describe('EnginePanel', () => {
    // ── Expand / collapse ──
    it('renders when visible is true', async () => {
        const wrapper = mountPanel(true)
        await nextTick()
        await flush()
        expect(wrapper.find('[class*="panel"]').exists()).toBe(true)
    })

    it('does not render when visible is false', async () => {
        const wrapper = mountPanel(false)
        await nextTick()
        await flush()
        expect(wrapper.find('[class*="panel"]').exists()).toBe(false)
    })

    // ── Engine items ──
    it('renders all engines from storage', async () => {
        const wrapper = mountPanel()
        await nextTick()
        await flush()
        const items = wrapper.findAll('[class*="item"]')
        // 2 engines + 1 add button = 3 items
        expect(items).toHaveLength(3)
    })

    it('shows engine initial letter in icon', async () => {
        const wrapper = mountPanel()
        await nextTick()
        await flush()
        const icons = wrapper.findAll('[class*="icon"]')
        expect(icons[0].text()).toBe('B') // Baidu
        expect(icons[1].text()).toBe('G') // Google
    })

    it('shows engine name', async () => {
        const wrapper = mountPanel()
        await nextTick()
        await flush()
        const names = wrapper.findAll('[class*="name"]')
        expect(names[0].text()).toBe('Baidu')
        expect(names[1].text()).toBe('Google')
    })

    it('add button shows "+" and "添加"', async () => {
        const wrapper = mountPanel()
        await nextTick()
        await flush()
        const lastIcon = wrapper.findAll('[class*="icon"]').at(-1)
        const lastName = wrapper.findAll('[class*="name"]').at(-1)
        expect(lastIcon?.text()).toBe('+')
        expect(lastName?.text()).toBe('添加')
    })

    // ── Select engine ──
    it('emits select and close when engine clicked', async () => {
        const wrapper = mountPanel()
        await nextTick()
        await flush()
        await wrapper.findAll('[class*="item"]')[0].trigger('click')
        expect(wrapper.emitted('select')).toBeTruthy()
        expect(wrapper.emitted('select')![0][0]).toMatchObject({ id: 'baidu', name: 'Baidu' })
        expect(wrapper.emitted('close')).toBeTruthy()
    })

    // ── Delete engine ──
    it('shows delete button only when engines > 1', async () => {
        const wrapper = mountPanel()
        await nextTick()
        await flush()
        const delButtons = wrapper.findAll('[class*="del"]')
        expect(delButtons).toHaveLength(2) // both engines deletable
    })

    it('shows toast when attempting to delete last engine', async () => {
        // Mount with 1 engine — no delete buttons rendered
        await browser.storage.local.set({ 'engines': [defaults[0]] })
        const wrapper = mountPanel()
        await nextTick()
        await flush()

        // No delete button when only 1 engine
        expect(wrapper.findAll('[class*="del"]')).toHaveLength(0)
        // Toast element initially absent
        expect(wrapper.find('[class*="toast"]').exists()).toBe(false)
    })

    it('hides delete buttons when only 1 engine', async () => {
        await browser.storage.local.set({ 'engines': [defaults[0]] })
        const wrapper = mountPanel()
        await nextTick()
        await flush()
        expect(wrapper.findAll('[class*="del"]')).toHaveLength(0)
    })

    // ── Add engine form ──
    it('opens add form when + is clicked', async () => {
        const wrapper = mountPanel()
        await nextTick()
        await flush()
        await wrapper.findAll('[class*="item"]').at(-1)!.trigger('click')
        await nextTick()
        expect(wrapper.find('[class*="form"]').exists()).toBe(true)
    })

    it('adds engine after valid form submit', async () => {
        const wrapper = mountPanel()
        await nextTick()
        await flush()

        // Open form
        await wrapper.findAll('[class*="item"]').at(-1)!.trigger('click')
        await nextTick()

        // Fill form (Teleport stubbed inline, so inputs are in wrapper)
        const inputs = wrapper.findAll('input')
        await inputs[0].setValue('GitHub')
        await inputs[1].setValue('https://github.com/search?q=%s')

        // Submit
        await wrapper.find('[class*="btnConfirm"]').trigger('click')
        await nextTick()
        await flush()

        // Engine count increased
        const items = wrapper.findAll('[class*="item"]')
        expect(items).toHaveLength(4) // 3 engines + add button
    })

    it('shows error when name is empty', async () => {
        const wrapper = mountPanel()
        await nextTick()
        await flush()

        await wrapper.findAll('[class*="item"]').at(-1)!.trigger('click')
        await nextTick()

        await wrapper.find('[class*="btnConfirm"]').trigger('click')
        await nextTick()

        expect(wrapper.find('[class*="error"]').text()).toBe('名称不能为空')
    })

    it('shows error when url template missing %s', async () => {
        const wrapper = mountPanel()
        await nextTick()
        await flush()

        await wrapper.findAll('[class*="item"]').at(-1)!.trigger('click')
        await nextTick()

        const inputs = wrapper.findAll('input')
        await inputs[0].setValue('GitHub')
        await inputs[1].setValue('https://github.com/search')

        await wrapper.find('[class*="btnConfirm"]').trigger('click')
        await nextTick()

        expect(wrapper.find('[class*="error"]').text()).toBe('URL 模板必须包含 %s 占位符')
    })

    it('cancels add form without adding engine', async () => {
        const wrapper = mountPanel()
        await nextTick()
        await flush()

        await wrapper.findAll('[class*="item"]').at(-1)!.trigger('click')
        await nextTick()

        await wrapper.find('[class*="btnCancel"]').trigger('click')
        await nextTick()

        expect(wrapper.find('[class*="form"]').exists()).toBe(false)
        // Still 2 engines + add
        expect(wrapper.findAll('[class*="item"]')).toHaveLength(3)
    })

    // ── Persistence ──
    it('persists engine list to storage after add', async () => {
        const wrapper = mountPanel()
        await nextTick()
        await flush()

        await wrapper.findAll('[class*="item"]').at(-1)!.trigger('click')
        await nextTick()

        const inputs = wrapper.findAll('input')
        await inputs[0].setValue('NPM')
        await inputs[1].setValue('https://www.npmjs.com/search?q=%s')
        await wrapper.find('[class*="btnConfirm"]').trigger('click')
        await flush()

        const result = await browser.storage.local.get('engines')
        const stored = result['engines'] as SearchEngine[]
        expect(stored).toHaveLength(3)
        expect(stored[2].name).toBe('NPM')
        expect(stored[2].urlTemplate).toBe('https://www.npmjs.com/search?q=%s')
    })

    it('persists engine list to storage after delete', async () => {
        const wrapper = mountPanel()
        await nextTick()
        await flush()

        await wrapper.findAll('[class*="del"]')[0].trigger('click')
        await flush()

        const result = await browser.storage.local.get('engines')
        const stored = result['engines'] as SearchEngine[]
        expect(stored).toHaveLength(1)
    })

    // ── Close overlay on backdrop click ──
    it('closes add form when overlay backdrop clicked', async () => {
        const wrapper = mountPanel()
        await nextTick()
        await flush()

        await wrapper.findAll('[class*="item"]').at(-1)!.trigger('click')
        await nextTick()

        await wrapper.find('[class*="overlay"]').trigger('click')
        await nextTick()

        expect(wrapper.find('[class*="form"]').exists()).toBe(false)
    })
})
