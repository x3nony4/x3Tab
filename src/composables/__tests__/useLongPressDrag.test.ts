import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useLongPressDrag } from '../useLongPressDrag'

const mockStart = vi.fn()

vi.mock('motion-v', () => ({
    useDragControls: vi.fn(() => ({
        start: mockStart,
    })),
}))

function makePointerEvent(type: string, overrides?: Partial<PointerEvent>): PointerEvent {
    return new PointerEvent(type, {
        clientX: 100,
        clientY: 200,
        ...overrides,
    })
}

beforeEach(() => {
    vi.useFakeTimers()
    mockStart.mockClear()
})

afterEach(() => {
    vi.useRealTimers()
})

describe('useLongPressDrag', () => {
    describe('idle state', () => {
        it('returns handlers and dragControls', () => {
            const result = useLongPressDrag()
            expect(result.onPointerDown).toBeDefined()
            expect(result.onPointerMove).toBeDefined()
            expect(result.onPointerUp).toBeDefined()
            expect(result.dragControls).toBeDefined()
        })
    })

    describe('pressing state', () => {
        it('transitions to dragging after 500ms without movement', () => {
            const { onPointerDown } = useLongPressDrag()
            const event = makePointerEvent('pointerdown')

            onPointerDown(event)
            expect(mockStart).not.toHaveBeenCalled()

            vi.advanceTimersByTime(499)
            expect(mockStart).not.toHaveBeenCalled()

            vi.advanceTimersByTime(1)
            expect(mockStart).toHaveBeenCalledWith(event, { snapToCursor: true })
        })

        it('cancels on pointer move > 5px before timer expires', () => {
            const { onPointerDown, onPointerMove } = useLongPressDrag()

            onPointerDown(makePointerEvent('pointerdown', { clientX: 100, clientY: 100 }))
            onPointerMove(makePointerEvent('pointermove', { clientX: 106, clientY: 100 }))

            vi.advanceTimersByTime(500)
            expect(mockStart).not.toHaveBeenCalled()
        })

        it('does not cancel on pointer move < 5px', () => {
            const { onPointerDown, onPointerMove } = useLongPressDrag()
            const event = makePointerEvent('pointerdown', { clientX: 100, clientY: 100 })

            onPointerDown(event)
            onPointerMove(makePointerEvent('pointermove', { clientX: 104, clientY: 100 }))

            vi.advanceTimersByTime(500)
            expect(mockStart).toHaveBeenCalled()
        })

        it('cancels on pointer up before timer expires', () => {
            const { onPointerDown, onPointerUp } = useLongPressDrag()

            onPointerDown(makePointerEvent('pointerdown'))
            onPointerUp(makePointerEvent('pointerup'))

            vi.advanceTimersByTime(500)
            expect(mockStart).not.toHaveBeenCalled()
        })

        it('cancels on diagonal move > 5px', () => {
            const { onPointerDown, onPointerMove } = useLongPressDrag()

            onPointerDown(makePointerEvent('pointerdown', { clientX: 100, clientY: 100 }))
            // dx=4, dy=4 → diagonal ≈ 5.65 > 5
            onPointerMove(makePointerEvent('pointermove', { clientX: 104, clientY: 104 }))

            vi.advanceTimersByTime(500)
            expect(mockStart).not.toHaveBeenCalled()
        })
    })

    describe('dragging state', () => {
        it('does not restart timer on pointer events after drag starts', () => {
            const { onPointerDown, onPointerUp } = useLongPressDrag()

            onPointerDown(makePointerEvent('pointerdown'))
            vi.advanceTimersByTime(500)
            expect(mockStart).toHaveBeenCalledTimes(1)

            // pointer up after drag started should be no-op
            onPointerUp(makePointerEvent('pointerup'))
            expect(mockStart).toHaveBeenCalledTimes(1)
        })
    })

    describe('consecutive interactions', () => {
        it('resets to idle after cancelled press, allows new press', () => {
            const { onPointerDown, onPointerUp } = useLongPressDrag()

            // First attempt: cancelled
            onPointerDown(makePointerEvent('pointerdown', { clientX: 100, clientY: 100 }))
            onPointerUp(makePointerEvent('pointerup'))

            // Second attempt: succeeds
            const event2 = makePointerEvent('pointerdown', { clientX: 200, clientY: 300 })
            onPointerDown(event2)
            vi.advanceTimersByTime(500)
            expect(mockStart).toHaveBeenCalledTimes(1)
            expect(mockStart).toHaveBeenCalledWith(event2, { snapToCursor: true })
        })

        it('ignores pointerdown when already pressing', () => {
            const { onPointerDown } = useLongPressDrag()

            const event1 = makePointerEvent('pointerdown')
            onPointerDown(event1)
            onPointerDown(makePointerEvent('pointerdown', { clientX: 999, clientY: 999 }))

            vi.advanceTimersByTime(500)
            expect(mockStart).toHaveBeenCalledWith(event1, { snapToCursor: true })
        })
    })
})
