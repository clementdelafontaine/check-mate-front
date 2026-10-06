import { ref, onBeforeUnmount } from 'vue'

export function useTouchDrag({ getItems, onMove, onDrop, longPressDelay = 350 }) {
  const dragging = ref(null)
  const dragY = ref(0)
  const dragH = ref(0)

  let timer = null
  let startY = 0
  let active = false

  function itemUnderPointer(y, rootSelector = '.draggable-item') {
    const els = document.querySelectorAll(rootSelector)
    for (const el of els) {
      const r = el.getBoundingClientRect()
      if (y >= r.top && y <= r.bottom) {
        const idx = Number(el.dataset.dragIndex)
        const after = y > r.top + r.height / 2
        return { idx, after }
      }
    }
    return null
  }

  function findIdx(itemId) {
    const items = getItems()
    return items.findIndex((i) => i === itemId || i?.id === itemId)
  }

  function onTouchStart(itemId, e) {
    const touch = e.touches[0]
    startY = touch.clientY
    active = true
    timer = setTimeout(() => {
      const idx = findIdx(itemId)
      if (idx === -1) return
      dragging.value = itemId
      dragY.value = startY
      if (navigator.vibrate) navigator.vibrate(10)
      const root = document.querySelector('[data-drag-root]')
      if (root) {
        const els = root.querySelectorAll('.draggable-item')
        dragH.value = els[idx]?.getBoundingClientRect().height ?? 0
      }
    }, longPressDelay)
  }

  function onTouchMove(e) {
    if (!dragging.value || !active) return
    e.preventDefault()
    const touch = e.touches[0]
    dragY.value = touch.clientY
    const target = itemUnderPointer(touch.clientY)
    if (!target) return
    const items = getItems()
    const fromIdx = findIdx(dragging.value)
    if (fromIdx === -1) return
    let toIdx = target.idx + (target.after ? 1 : 0)
    if (fromIdx < toIdx) toIdx -= 1
    if (toIdx !== fromIdx && toIdx >= 0 && toIdx < items.length) {
      onMove(fromIdx, toIdx)
    }
  }

  function onTouchEnd() {
    clearTimeout(timer)
    active = false
    if (dragging.value) {
      const id = dragging.value
      dragging.value = null
      onDrop(id)
    }
  }

  onBeforeUnmount(() => {
    clearTimeout(timer)
    document.removeEventListener('touchmove', onTouchMove)
  })

  return { dragging, dragY, dragH, onTouchStart, onTouchMove, onTouchEnd }
}
