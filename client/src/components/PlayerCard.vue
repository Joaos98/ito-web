<template>
  <div>
    <div class="mb-2">
      <span class="!text-white">{{ position }}</span>
    </div>
    <div :class="[
        'rounded-xl w-[125px] h-[175px]  shadow-lg border-2 flex justify-center items-center',
        player ? 'player-card' : 'empty-card',
        room?.status === 'playing' ? 'bg-[#151515] text-yellow-300 border-light' : 'bg-light text-black border-black'
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
import {useRoomStore} from "../stores/room.js";
import {computed} from "vue";

const props = defineProps(['position', 'player']);
const roomStore = useRoomStore();

const room = computed(() => roomStore.currentRoom);
</script>

<style scoped>
span {
  font-weight: 500;
}
</style>