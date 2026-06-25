import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import FormDialog from '../FormDialog.vue'

let wrapper: VueWrapper<unknown>

afterEach(() => {
  if (wrapper) wrapper.unmount()
})

function mountDialog(props: {
  open?: boolean
  title?: string
  width?: number
  confirmLabel?: string
  cancelLabel?: string
}) {
  wrapper = mount(FormDialog, {
    props: {
      open: props.open ?? true,
      title: props.title ?? '测试标题',
      width: props.width,
      confirmLabel: props.confirmLabel,
      cancelLabel: props.cancelLabel,
    },
    slots: {
      default: '<div class="form-content">表单内容</div>',
    },
    attachTo: document.body,
  })
  return wrapper
}

function dialogEl() {
  return document.body.querySelector('[role="dialog"]')
}

describe('FormDialog', () => {
  // ── Rendering ──
  it('renders overlay and title when open', async () => {
    mountDialog({ open: true })
    await nextTick()
    expect(dialogEl()).toBeTruthy()
    expect(dialogEl()?.getAttribute('data-state')).toBe('open')
    expect(document.body.textContent).toContain('测试标题')
  })

  it('renders slot content', async () => {
    mountDialog({ open: true })
    await nextTick()
    expect(document.body.querySelector('.form-content')).toBeTruthy()
    expect(document.body.textContent).toContain('表单内容')
  })

  it('does not render dialog element when closed', async () => {
    mountDialog({ open: false })
    await nextTick()
    expect(dialogEl()).toBeNull()
  })

  // ── Actions ──
  it('renders default confirm and cancel buttons', async () => {
    mountDialog({ open: true })
    await nextTick()
    expect(document.body.textContent).toContain('保存')
    expect(document.body.textContent).toContain('取消')
  })

  it('emits confirm when confirm button clicked', async () => {
    mountDialog({ open: true })
    await nextTick()
    const buttons = document.body.querySelectorAll('button')
    const confirmBtn = Array.from(buttons).find(b => b.textContent?.includes('保存'))
    confirmBtn?.click()
    await nextTick()
    expect(wrapper.emitted('confirm')).toHaveLength(1)
  })

  it('emits cancel when cancel button clicked', async () => {
    mountDialog({ open: true })
    await nextTick()
    const buttons = document.body.querySelectorAll('button')
    const cancelBtn = Array.from(buttons).find(b => b.textContent?.includes('取消'))
    cancelBtn?.click()
    await nextTick()
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })

  // ── Labels ──
  it('renders custom confirmLabel', async () => {
    mountDialog({ open: true, confirmLabel: '添加' })
    await nextTick()
    expect(document.body.textContent).toContain('添加')
  })

  it('renders custom cancelLabel', async () => {
    mountDialog({ open: true, cancelLabel: '返回' })
    await nextTick()
    expect(document.body.textContent).toContain('返回')
  })

  // ── Width ──
  it('applies default width 360px when width not provided', async () => {
    mountDialog({ open: true })
    await nextTick()
    const el = dialogEl() as HTMLElement | null
    expect(el?.style.width).toBe('360px')
  })

  it('applies custom width when width provided', async () => {
    mountDialog({ open: true, width: 400 })
    await nextTick()
    const el = dialogEl() as HTMLElement | null
    expect(el?.style.width).toBe('400px')
  })

  // ── Custom actions slot ──
  it('renders custom actions slot when provided', async () => {
    wrapper = mount(FormDialog, {
      props: { open: true, title: '自定义按钮' },
      slots: {
        default: '<div>内容</div>',
        actions: '<button class="custom-btn">自定义确认</button>',
      },
      attachTo: document.body,
    })
    await nextTick()
    expect(document.body.textContent).toContain('自定义确认')
    expect(document.body.textContent).not.toContain('保存')
  })
})
