import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import SearchBar from './SearchBar.vue'

let locHref: string
let _originalLocation: Location

function mountBar(): VueWrapper<InstanceType<typeof SearchBar>> {
  return mount(SearchBar)
}

beforeEach(() => {
  locHref = 'about:blank'
  _originalLocation = window.location
  // window.location.href = X  → getter returns object whose .href setter captures url
  Object.defineProperty(window, 'location', {
    configurable: true,
    enumerable: true,
    get() {
      return {
        get href() { return locHref },
        set href(v: string) { locHref = v },
      }
    },
  })
})

afterEach(() => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    enumerable: true,
    value: _originalLocation,
  })
})

describe('SearchBar', () => {
  it('renders current engine initial letter in icon', () => {
    const wrapper = mountBar()
    expect(wrapper.find('[class*="icon"]').text()).toBe('B')
  })

  it('renders dropdown arrow', () => {
    const wrapper = mountBar()
    expect(wrapper.find('[class*="arrow"]').exists()).toBe(true)
  })

  it('cycles engine on Tab (Baidu → Google → Bing → DuckDuckGo → Baidu)', async () => {
    const wrapper = mountBar()
    const input = wrapper.find('input')
    const icon = wrapper.find('[class*="icon"]')

    expect(icon.text()).toBe('B') // Baidu
    await input.trigger('keydown', { key: 'Tab' })
    expect(icon.text()).toBe('G') // Google
    await input.trigger('keydown', { key: 'Tab' })
    expect(icon.text()).toBe('B') // Bing
    await input.trigger('keydown', { key: 'Tab' })
    expect(icon.text()).toBe('D') // DuckDuckGo
    await input.trigger('keydown', { key: 'Tab' })
    expect(icon.text()).toBe('B') // back to Baidu
  })

  it('does not clear input text on Tab', async () => {
    const wrapper = mountBar()
    const input = wrapper.find('input')
    await input.setValue('hello world')
    await input.trigger('keydown', { key: 'Tab' })
    expect((input.element as HTMLInputElement).value).toBe('hello world')
  })

  it('navigates to Baidu search URL on Enter', async () => {
    const wrapper = mountBar()
    const input = wrapper.find('input')
    await input.setValue('vitest')
    await input.trigger('keydown', { key: 'Enter' })
    expect(locHref).toBe('https://www.baidu.com/s?wd=vitest')
  })

  it('navigates to Google search after Tab switch', async () => {
    const wrapper = mountBar()
    const input = wrapper.find('input')
    await input.setValue('vue')
    await input.trigger('keydown', { key: 'Tab' }) // → Google
    await input.trigger('keydown', { key: 'Enter' })
    expect(locHref).toBe('https://www.google.com/search?q=vue')
  })

  it('URL-encodes search query', async () => {
    const wrapper = mountBar()
    const input = wrapper.find('input')
    await input.setValue('hello world & more')
    await input.trigger('keydown', { key: 'Enter' })
    expect(locHref).toBe('https://www.baidu.com/s?wd=hello%20world%20%26%20more')
  })

  it('adds focused class on input focus', async () => {
    const wrapper = mountBar()
    const bar = wrapper.find('[class*="bar"]')

    // Not focused initially
    expect(bar.classes().some(c => c.includes('focused'))).toBe(false)

    await wrapper.find('input').trigger('focus')
    await wrapper.vm.$nextTick()
    expect(bar.classes().some(c => c.includes('focused'))).toBe(true)

    await wrapper.find('input').trigger('blur')
    await wrapper.vm.$nextTick()
    expect(bar.classes().some(c => c.includes('focused'))).toBe(false)
  })
})
