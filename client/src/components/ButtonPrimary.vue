<script setup>

</script>

<template>
  <button v-bind="$attrs" class="p-2 rounded-xl border-1 border-black bg-yellow-300 text-dark transition font-bold
  enabled:hover:bg-yellow-400 enabled:hover:border-white enabled:hover:text-light
  disabled:opacity-50"
  >
    <slot></slot>
  </button>
</template>

<style scoped>

</style>