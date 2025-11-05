<template>
  <main class="h-full flex flex-col justify-center items-center relative">
    <h1 class="text-5xl font-bold text-yellow-300 absolute top-12">ito online</h1>
    <div class="flex flex-col justify-center items-center h-full">
      <div class="create-room-section w-full">
        <InputPrimary
            v-model="playerName"
            placeholder="Username"
            maxlength="20"
            :error="errorMessage"
        />
        <ButtonPrimary class="w-full mt-1"
                       @click="createRoom" :disabled="!playerName.trim()"
        >
          Criar Sala
        </ButtonPrimary>
      </div>
      <div class="flex items-center justify-center w-full p-1">
        <div class="border-t border-white flex-grow"></div>
        <span class="mx-4 text-white text-sm">ou</span>
        <div class="border-t border-white flex-grow"></div>
      </div>
      <div class="join-section">
        <InputPrimary class="uppercase placeholder:normal-case"
                      v-model="roomCode"
                      placeholder="Código da Sala"
        />
        <ButtonPrimary
            @click="joinRoom" :disabled="!playerName.trim() || !roomCode.trim()"
        >
          Entrar
        </ButtonPrimary>
      </div>
    </div>
  </main>
</template>

<script setup>
import { socket } from "../socket";
import { ref } from "vue";
import { useRouter } from 'vue-router';
import { useRoomStore } from "../stores/room.js";
import ButtonPrimary from "../components/ButtonPrimary.vue";
import InputPrimary from "../components/InputPrimary.vue";

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

.join-section {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.join-section input {
  max-width: 150px;
  text-transform: uppercase;
}

button:disabled {
  cursor: not-allowed;
}
</style>
