<template>
  <div class="flex flex-col gap-1">
    <input
        v-bind="$attrs"
        :value="modelValue"
        @input="onInput"
        :class="[
        'rounded-xl bg-dark text-white p-2 border-white',
        disabled ? 'opacity-50 cursor-not-allowed' : '',
      ]"
        :disabled="disabled"
    />

    <!-- Error message -->
    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: [String, Number],
  error: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const onInput = (event) => {
  emit('update:modelValue', event.target.value)
}
</script>
