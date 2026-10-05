<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useFriendsStore } from '../stores/friends'
import { Users } from 'lucide-vue-next'

const props = defineProps({
  modelValue: { type: Array, default: () => [] }
})
const emit = defineEmits(['update:modelValue'])

const friends = useFriendsStore()
const ready = ref(false)

onMounted(async () => {
  await friends.refresh().catch(() => {})
  ready.value = true
})

const accepted = computed(() => friends.accepted)

function toggle(userId) {
  const current = [...props.modelValue]
  const i = current.indexOf(userId)
  if (i === -1) current.push(userId)
  else current.splice(i, 1)
  emit('update:modelValue', current)
}
</script>

<template>
  <div class="friend-picker">
    <span class="picker-label font-mono">
      <Users :size="12" /> Partager avec
    </span>
    <p v-if="ready && !accepted.length" class="picker-empty">
      Aucun ami — ajoutez-en depuis la page Amis.
    </p>
    <div v-else class="chips">
      <button
        v-for="friend in accepted"
        :key="friend.userId"
        type="button"
        class="friend-chip"
        :class="{ active: modelValue.includes(friend.userId) }"
        @click="toggle(friend.userId)"
      >
        {{ friend.username }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.friend-picker {
  margin-bottom: 0.75rem;
}
.picker-label {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--ink-faint);
  margin-bottom: 0.45rem;
}
.picker-empty {
  margin: 0;
  font-size: 0.75rem;
  color: var(--ink-muted);
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.friend-chip {
  padding: 0.32rem 0.7rem;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--ink-muted);
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}
.friend-chip.active {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-deep);
}
</style>
