import { ref } from 'vue'

const THRESHOLD = 80

export function useSwipe(onSwipeLeft) {
  const deltaX = ref(0)
  let startX = null

  function onTouchStart(e) {
    startX = e.touches?.[0]?.clientX ?? null
    deltaX.value = 0
  }

  function onTouchMove(e) {
    if (startX == null) return
    const x = e.touches?.[0]?.clientX
    if (x == null) return
    deltaX.value = Math.min(0, x - startX)
  }

  function onTouchEnd() {
    if (deltaX.value < -THRESHOLD) onSwipeLeft()
    deltaX.value = 0
    startX = null
  }

  return {
    deltaX,
    swipeHandlers: {
      touchstart: onTouchStart,
      touchmove: onTouchMove,
      touchend: onTouchEnd
    }
  }
}
