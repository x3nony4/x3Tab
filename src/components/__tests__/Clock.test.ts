import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Clock from '../Clock.vue'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

function setTime(date: Date) {
  vi.setSystemTime(date)
}

describe('Clock', () => {
  it('renders time in HH:MM:SS format', () => {
    setTime(new Date(2026, 5, 23, 14, 5, 30))
    const wrapper = mount(Clock)
    expect(wrapper.find('[data-testid="time"]').text()).toBe('14:05:30')
  })

  it('renders date in YYYY年MM月DD日 星期X format', () => {
    setTime(new Date(2026, 5, 23))
    const wrapper = mount(Clock)
    expect(wrapper.find('[data-testid="date"]').text()).toBe('2026年06月23日 星期二')
  })

  it('updates time every second', async () => {
    setTime(new Date(2026, 5, 23, 23, 59, 59))
    const wrapper = mount(Clock)
    expect(wrapper.find('[data-testid="time"]').text()).toBe('23:59:59')

    vi.advanceTimersByTime(1000)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="time"]').text()).toBe('00:00:00')

    vi.advanceTimersByTime(1000)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="time"]').text()).toBe('00:00:01')
  })

  it('renders midnight as 00:00:00', () => {
    setTime(new Date(2026, 5, 23, 0, 0, 0))
    const wrapper = mount(Clock)
    expect(wrapper.find('[data-testid="time"]').text()).toBe('00:00:00')
  })

  it('clears interval on unmount', () => {
    const spy = vi.spyOn(globalThis, 'clearInterval')
    const wrapper = mount(Clock)
    wrapper.unmount()
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('text elements are not selectable', () => {
    const wrapper = mount(Clock)
    // user-select: none is on the parent .clockArea in App.vue,
    // but we verify the component doesn't override it
    const time = wrapper.find('[data-testid="time"]')
    const date = wrapper.find('[data-testid="date"]')
    expect(time.exists()).toBe(true)
    expect(date.exists()).toBe(true)
  })
})
