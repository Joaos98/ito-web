<template>
  <div class="home-container">
    <h1>ITO Game</h1>

    <div class="name-input-section">
      <h3>Enter your username:</h3>
      <input
          v-model="playerName"
          placeholder="Your username"
          maxlength="20"
      />
    </div>

    <div class="action-section">
      <button @click="createRoom" :disabled="!playerName.trim()">Create Room</button>

      <div class="join-section">
        <input v-model="roomCode" placeholder="Room code" maxlength="5" />
        <button @click="joinRoom" :disabled="!playerName.trim() || !roomCode.trim()">Join Room</button>
      </div>
    </div>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
  </div>
</template>

<script setup>
import { socket } from "../socket";
import { ref } from "vue";
import { useRouter } from 'vue-router';
import { useRoomStore } from "../stores/room.js";

const router = useRouter();
const roomStore = useRoomStore();

const playerName = ref("");
const roomCode = ref("");
const errorMessage = ref("");

const createRoom = () => {
  if (!playerName.value.trim()) {
    errorMessage.value = "Please enter your username";
    return;
  }

  errorMessage.value = "";
  socket.emit("createRoom", { playerName: playerName.value.trim() }, (res) => {
    if (res.error) {
      errorMessage.value = res.error;
    } else {
      roomStore.setPlayers([res.player]);
      roomStore.setMyId(res.player.id);
      roomStore.setCurrentRoom(res.room);
      router.push(`/room/${res.room.code}`);
    }
  });
};

const joinRoom = () => {
  if (!playerName.value.trim()) {
    errorMessage.value = "Please enter your username";
    return;
  }

  if (!roomCode.value.trim()) {
    errorMessage.value = "Please enter a room code";
    return;
  }

  errorMessage.value = "";
  socket.emit("joinRoom", {
    roomCode: roomCode.value.trim().toUpperCase(),
    playerName: playerName.value.trim()
  }, (res) => {
    if (res.error) {
      errorMessage.value = res.error;
    } else {
      roomStore.setMyId(res.player.id);
      roomStore.setCurrentRoom(res.room);
      router.push(`/room/${res.room.code}`);
    }
  });
};
</script>

<style scoped>
.home-container {
  max-width: 500px;
  margin: 2rem auto;
  padding: 2rem;
  text-align: center;
}

.name-input-section {
  margin: 2rem 0;
}

.name-input-section input {
  width: 100%;
  max-width: 300px;
}

.action-section {
  margin: 2rem 0;
}

.join-section {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.join-section input {
  max-width: 150px;
  text-transform: uppercase;
}

.error {
  color: #f44336;
  margin-top: 1rem;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
