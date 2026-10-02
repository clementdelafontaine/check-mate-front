import { ref } from 'vue'

const message = ref('')
const visible = ref(false)
const undoPayload = ref(null)

let hideTimer = null

export function useUndoToast() {
  function show(msg, undoFn = null) {
    message.value = msg
    undoPayload.value = undoFn
    visible.value = true
    clearTimeout(hideTimer)
    hideTimer = setTimeout(() => {
      visible.value = false
      undoPayload.value = null
    }, 5000)
  }

  function undo() {
    if (undoPayload.value) undoPayload.value()
    visible.value = false
    undoPayload.value = null
    clearTimeout(hideTimer)
  }

  function close() {
    visible.value = false
    undoPayload.value = null
    clearTimeout(hideTimer)
  }

  return { message, visible, show, undo, close }
}
