<template>
  <div class="text-yellow-300 mb-10">
    <h2 class="text-3xl">{{themeStore.selectedTheme?.name}}</h2>
    <h3 class="text-sm">{{themeStore.selectedTheme?.description}}</h3>
  </div>
  <div class="game-board flex gap-2 items-end flex-wrap">
    <div class="player-card rounded-xl w-[125px] h-[175px] bg-[#d0b249] shadow-lg border-light border-2 items-center justify-center flex">
      <p class="font-bold text-black text-4xl">0</p>
    </div>
    <PlayerCard v-for="position in players.length" :key="position" :position="position" :player="getPlayerInPos(position)"/>
  </div>
</template>

<script setup>
import PlayerCard from "./PlayerCard.vue";
import { useThemeStore } from "../stores/theme.js";

const props = defineProps(['players']);
const themeStore = useThemeStore();

const getPlayerInPos = (position) => {
  const player = props.players.value.find(p => p.position === position);
  if (player) {
    return player;
  }
  return null;
}
</script>

<style scoped>

</style>