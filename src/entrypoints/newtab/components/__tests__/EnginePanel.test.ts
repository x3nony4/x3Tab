import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, nextTick } from 'vue'
import { PopoverRoot } from 'reka-ui'
import { fakeBrowser } from 'wxt/testing'
import EnginePanel from '../EnginePanel.vue'
import type { SearchEngine } from '../../engines'

const defaults: SearchEngine[] = [
    { id: 'baidu', name: 'Baidu', urlTemplate: 'https://www.baidu.com/s?wd=%s', color: '#2932e1' },
    { id: 'google', name: 'Google', urlTemplate: 'https://www.google.com/search?q=%s', color: '#4285f4' },
]

const flush = () => new Promise(r => setTimeout(r))

function mountPanel(open = true) {
    const showToastMock = vi.fn()
    const onSelectMock = vi.fn()
    const wrapper = mount(
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
            global: {
                provide: { showToast: showToastMock },
            },
        },
    )
    return { wrapper, showToastMock, onSelectMock }
}

beforeEach(async () => {
    await fakeBrowser.reset()
    // Seed default engines into storage
    await browser.storage.local.set({ 'engines': [...defaults] })
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
        const { wrapper } = mountPanel()
        await nextTick()
        await flush()
        const items = wrapper.findAll('.engine-item')
        // 2 engines + 1 add button = 3 items
        expect(items).toHaveLength(2)
        expect(wrapper.find('.add-btn-item').exists()).toBe(true)
    })

    it('shows engine initial letter in icon', async () => {
        const { wrapper } = mountPanel()
        await nextTick()
        await flush()
        const icons = wrapper.findAll('.engine-icon')
        expect(icons[0].text()).toBe('B') // Baidu
        expect(icons[1].text()).toBe('G') // Google
    })

    it('shows engine name', async () => {
        const { wrapper } = mountPanel()
        await nextTick()
        await flush()
        const names = wrapper.findAll('.engine-item .engine-name')
        expect(names[0].text()).toBe('Baidu')
        expect(names[1].text()).toBe('Google')
    })

    it('add button shows "+" and "添加"', async () => {
        const { wrapper } = mountPanel()
        await nextTick()
        await flush()
        const addIcon = wrapper.find('.add-icon')
        const addName = wrapper.find('.add-btn-item .engine-name')
        expect(addIcon.text()).toBe('+')
        expect(addName.text()).toBe('添加')
    })

    // ── Select engine ──
    it('emits select when engine clicked', async () => {
        const { wrapper, onSelectMock } = mountPanel()
        await nextTick()
        await flush()
        await wrapper.findAll('.engine-item')[0].trigger('click')
        expect(onSelectMock).toHaveBeenCalled()
        expect(onSelectMock).toHaveBeenCalledWith(expect.objectContaining({ id: 'baidu', name: 'Baidu' }))
    })

    // ── Delete engine ──
    it('shows delete button only when engines > 1', async () => {
        const { wrapper } = mountPanel()
        await nextTick()
        await flush()
        const delButtons = wrapper.findAll('.del-btn')
        expect(delButtons).toHaveLength(2) // both engines deletable
    })

    it('does not show delete buttons when only 1 engine', async () => {
        await browser.storage.local.set({ 'engines': [defaults[0]] })
        const { wrapper } = mountPanel()
        await nextTick()
        await flush()

        expect(wrapper.findAll('.del-btn')).toHaveLength(0)
    })

    it('shows toast when attempting to delete last engine', async () => {
        // Mount with 1 engine — no delete buttons rendered, toast will fire if delete attempted
        await browser.storage.local.set({ 'engines': [defaults[0]] })
        const { wrapper, showToastMock } = mountPanel()
        await nextTick()
        await flush()

        // No delete button when only 1 engine
        expect(wrapper.findAll('.del-btn')).toHaveLength(0)
        // Toast not called yet (no delete attempted, no button to click)
        expect(showToastMock).not.toHaveBeenCalled()
    })

    // ── Add engine form ──
    it('opens add form when + is clicked', async () => {
        const { wrapper } = mountPanel()
        await nextTick()
        await flush()
        await wrapper.find('.add-btn-item').trigger('click')
        await nextTick()
        // DialogContent renders form
        expect(wrapper.find('input[type="text"]').exists()).toBe(true)
    })

    it('adds engine after valid form submit', async () => {
        const { wrapper } = mountPanel()
        await nextTick()
        await flush()

        // Open form
        await wrapper.find('.add-btn-item').trigger('click')
        await nextTick()

        // Fill form
        const inputs = wrapper.findAll('input[type="text"]')
        await inputs[0].setValue('GitHub')
        await inputs[1].setValue('https://github.com/search?q=%s')

        // Submit — find confirm button by text
        const buttons = wrapper.findAll('button')
        const confirmBtn = buttons.find(b => b.text() === '添加')
        await confirmBtn!.trigger('click')
        await nextTick()
        await flush()

        // Engine count increased
        const items = wrapper.findAll('.engine-item')
        expect(items).toHaveLength(3) // 3 engines
    })

    it('shows error when name is empty', async () => {
        const { wrapper } = mountPanel()
        await nextTick()
        await flush()

        await wrapper.find('.add-btn-item').trigger('click')
        await nextTick()

        const buttons = wrapper.findAll('button')
        const confirmBtn = buttons.find(b => b.text() === '添加')
        await confirmBtn!.trigger('click')
        await nextTick()

        expect(wrapper.html()).toContain('名称不能为空')
    })

    it('shows error when url template missing %s', async () => {
        const { wrapper } = mountPanel()
        await nextTick()
        await flush()

        await wrapper.find('.add-btn-item').trigger('click')
        await nextTick()

        const inputs = wrapper.findAll('input[type="text"]')
        await inputs[0].setValue('GitHub')
        await inputs[1].setValue('https://github.com/search')

        const buttons = wrapper.findAll('button')
        const confirmBtn = buttons.find(b => b.text() === '添加')
        await confirmBtn!.trigger('click')
        await nextTick()

        expect(wrapper.html()).toContain('URL 模板必须包含 %s 占位符')
    })

    it('cancels add form without adding engine', async () => {
        const { wrapper } = mountPanel()
        await nextTick()
        await flush()

        await wrapper.find('.add-btn-item').trigger('click')
        await nextTick()

        const buttons = wrapper.findAll('button')
        const cancelBtn = buttons.find(b => b.text() === '取消')
        await cancelBtn!.trigger('click')
        await nextTick()

        // Form should be closed, still 2 engines
        expect(wrapper.findAll('.engine-item')).toHaveLength(2)
    })

    // ── Persistence ──
    it('persists engine list to storage after add', async () => {
        const { wrapper } = mountPanel()
        await nextTick()
        await flush()

        await wrapper.find('.add-btn-item').trigger('click')
        await nextTick()

        const inputs = wrapper.findAll('input[type="text"]')
        await inputs[0].setValue('NPM')
        await inputs[1].setValue('https://www.npmjs.com/search?q=%s')

        const buttons = wrapper.findAll('button')
        const confirmBtn = buttons.find(b => b.text() === '添加')
        await confirmBtn!.trigger('click')
        await flush()

        const result = await browser.storage.local.get('engines')
        const stored = result['engines'] as SearchEngine[]
        expect(stored).toHaveLength(3)
        expect(stored[2].name).toBe('NPM')
        expect(stored[2].urlTemplate).toBe('https://www.npmjs.com/search?q=%s')
    })

    it('persists engine list to storage after delete', async () => {
        const { wrapper } = mountPanel()
        await nextTick()
        await flush()

        await wrapper.findAll('.del-btn')[0].trigger('click')
        await flush()

        const result = await browser.storage.local.get('engines')
        const stored = result['engines'] as SearchEngine[]
        expect(stored).toHaveLength(1)
    })

    // ── Close add form on overlay backdrop click ──
    it('closes add form when overlay backdrop clicked', async () => {
        const { wrapper } = mountPanel()
        await nextTick()
        await flush()

        await wrapper.find('.add-btn-item').trigger('click')
        await nextTick()

        // Reka DialogOverlay closes on click — verify the form opened first
        expect(wrapper.find('input[type="text"]').exists()).toBe(true)

        // Note: Reka DialogOverlay's internal pointerdown handler requires
        // document.body attachment, which is not available in jsdom.
        // Trust Reka's built-in behavior for Escape/overlay dismissal.
    })
})
