import { computed, ref } from 'vue'

const activeId = ref(null)
let seq = 0

export function useExclusiveMenu() {
  const id = ++seq
  const isOpen = computed(() => activeId.value === id)
  function open() {
    activeId.value = id
  }
  function close() {
    if (activeId.value === id) activeId.value = null
  }
  function toggle() {
    activeId.value === id ? close() : open()
  }
  return { isOpen, open, close, toggle }
}
