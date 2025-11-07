<template>
  <div>
    <div class="mb-2">
      <span class="!text-white">{{ position }}</span>
    </div>
    <div :class="[
        'rounded-xl w-[125px] h-[175px] bg-[#151515] shadow-lg border-light border-2 flex justify-center items-center',
        player ? 'player-card' : 'empty-card',
      ]"
    >
      <div v-if="player" class="flex flex-col justify-between items-center h-full p-2">
        <span>
          {{player.name}}
        </span>
        <span class="text-4xl">
          {{player.number ? player.number : '?'}}
        </span>
        <span>
          {{player.hint}}
        </span>
      </div>
      <span v-else class="!text-light">
      Vazio
    </span>
    </div>
  </div>
</template>

<script setup>
const props = defineProps(['position', 'player']);
</script>

<style scoped>
.empty-card {
  background-color:  transparent;
  border-style: dashed;
}
.played-card {
  background-color: #151515;
  border-style: solid;
}
span {
  font-weight: 500;
  color: var(--color-yellow-300);
}
</style>