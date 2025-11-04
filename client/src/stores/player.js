import { defineStore } from 'pinia';
import { ref } from 'vue';

export const usePlayerStore = defineStore('player', () => {
  const currentPlayer = ref(null);
  const myNumber = ref(null);
  const isHost = ref(false);
  
  const setPlayer = (player) => {
    currentPlayer.value = player;
    isHost.value = player.isHost || false;
  };

  const setMyNumber = (number) => {
      myNumber.value = number;
  }
  
  const updatePlayerData = (data) => {
    if (currentPlayer.value) {
      currentPlayer.value = { ...currentPlayer.value, ...data };
    }
  };
  
  const clearPlayer = () => {
    currentPlayer.value = null;
    myNumber.value = null;
    isHost.value = false;
  };
  
  return {
      currentPlayer,
      myNumber,
      setPlayer,
      setMyNumber,
      updatePlayerData,
      clearPlayer,
      isHost
  };
});
