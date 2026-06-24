import { useDragControls } from 'motion-v'

type DragState = 'idle' | 'pressing' | 'dragging'

const LONG_PRESS_MS = 500
const MOVE_THRESHOLD_PX = 5

export function useLongPressDrag() {
    const dragControls = useDragControls()

    let state: DragState = 'idle'
    let timer: ReturnType<typeof setTimeout> | null = null
    let pointerDownPos: { x: number, y: number } | null = null
    let pointerDownEvent: PointerEvent | null = null

    function clearTimer() {
        if (timer != null) {
            clearTimeout(timer)
            timer = null
        }
    }

    function reset() {
        clearTimer()
        state = 'idle'
        pointerDownPos = null
        pointerDownEvent = null
    }

    function onPointerDown(event: PointerEvent) {
        if (state !== 'idle')
            return
        state = 'pressing'
        pointerDownPos = { x: event.clientX, y: event.clientY }
        pointerDownEvent = event
        timer = setTimeout(() => {
            if (state === 'pressing' && pointerDownEvent) {
                state = 'dragging'
                dragControls.start(pointerDownEvent, { snapToCursor: true })
            }
        }, LONG_PRESS_MS)
    }

    function onPointerMove(event: PointerEvent) {
        if (state !== 'pressing' || !pointerDownPos)
            return
        const dx = event.clientX - pointerDownPos.x
        const dy = event.clientY - pointerDownPos.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > MOVE_THRESHOLD_PX) {
            reset()
        }
    }

    function onPointerUp(_event: PointerEvent) {
        if (state === 'pressing') {
            reset()
        }
    }

    return {
        onPointerDown,
        onPointerMove,
        onPointerUp,
        dragControls
    }
}
