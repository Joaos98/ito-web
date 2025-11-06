<template>
  <div class="h-full w-full flex flex-col justify-center items-center relative">
    <div class="room-header w-full mb-auto flex justify-between">
      <h1 class="text-2xl font-bold text-yellow-300">ito online</h1>
      <h1 v-if="room?.code" class="text-2xl font-bold text-yellow-300">Sala {{ room?.code }}</h1>
    </div>
    <div class="flex w-full flex-1 justify-center items-center">
      <!-- Caso o Jogador tenha entrado na sala via URL/sem username -->
      <div v-if="!player" class="flex flex-col p-3 bg-dark border-1 border-light rounded-lg shadow-lg min-h-50 justify-between">
        <h2 class="text-xl font-bold text-yellow-300">Entrar na Sala {{ roomCode }}</h2>
        <div class="flex flex-col">
          <div class="flex">
            <InputPrimary
                v-model="playerName"
                placeholder="Username"
                @keyup.enter="joinRoomWithName"
                maxlength="20"
                class="mr-1"
            />
            <ButtonPrimary @click="joinRoomWithName" :disabled="!playerName.trim()">Entrar</ButtonPrimary>
          </div>
          <p v-if="errorMessage" class="error font-bold">{{ errorMessage }}</p>
        </div>
        <p v-if="roomInfo">{{ roomInfo.playerCount }} jogador(es) na sala</p>
      </div>
      <!-- Caso o Jogador tenha entrado na sala via Home Page/com username -->
      <div v-else class="flex w-full">
        <div class="main-content flex w-full flex-1 justify-center items-center">
          <div>
            <!-- Lobby: Link de invite e Botão de Começar, caso o Jogador seja o Host  -->
            <div v-if="player?.isHost && room?.status === 'lobby'" class="flex flex-col gap-5 items-center justify-center p-3 bg-dark border-1 border-light rounded-lg shadow-lg">
              <h2>Convide seus jogadores</h2>
              <div class="flex">
                <InputPrimary
                    :style="{ width: (inviteLink.length-2 || 1) + 'ch' }"
                    type="text"
                    v-model="inviteLink"
                    readonly
                    @click="selectLink"
                    ref="linkInput"
                    class="mr-1"
                />
                <ButtonPrimary @click="copyLink" class="w-full">
                  {{ copied ? 'Copiado!' : 'Copiar' }}
                </ButtonPrimary>
              </div>
              <h2>E comece a partida!</h2>
              <ButtonPrimary @click="startThemeVoting">Começar!</ButtonPrimary>
            </div>
            <!-- Lobby: Mensagem caso o Jogador não seja o host -->
            <div v-if="room?.status === 'lobby' && !player?.isHost">
              <p>Esperando o host começar a partida...</p>
            </div>
            <!-- Votação: Votação dos Temas -->
            <div v-else-if="room?.status === 'voting'">
              <h3 class="font-bold text-yellow-300 mb-5">Vote em um Tema!</h3>
              <div class="flex">
                <button
                    v-for="t in themeStore.themeOptions"
                    :key="t.name"
                    @click="voteTheme(t)"
                    :class="{ selected: currentThemeVote?.name === t.name }"
                    class="p-2 m-1 rounded-lg max-w-75 shadow-lg bg-light text-black hover:bg-yellow-300 transition duration-200"
                >
                  <strong>{{ t.name }}</strong><br/>
                  <small>{{ t.description }}</small>
                </button>
              </div>
              <p v-if="currentThemeVote" class="text-[#4CAF50] font-bold">Você votou em {{ currentThemeVote.name }}!</p>
              <p v-else class="text-[#B03D3D] font-bold"> Você ainda não votou!</p>
              <p class="text-yellow-300 mt-5">Votos: {{ totalVotes }}/{{ players.length }}</p>
            </div>

            <div v-else-if="room?.status === 'playing'">
              <div class="game-board">
                <div v-for="position in players.length" :key="position" class="player-card">
                  <p>{{getPlayerInPos(position)}}</p>
                </div>
              </div>
              <div>
                <h3>Theme: {{ themeStore.selectedTheme?.name }}</h3>
                <p>{{ themeStore.selectedTheme?.description }}</p>

                <h3>Players:</h3>
                <ul class="player-list">
                  <li v-for="p in players" :key="p.id">
                    {{ p.name }}
                  </li>
                </ul>

                <div v-if="player.number" class="my-number">
                  <h2>Your Number: {{ player.number }}</h2>
                </div>

                <div class="game-input">
                  <input v-model="hint" placeholder="Your hint" />
                  <input type="number" v-model.number="position" placeholder="Your position guess" min="1" :max="players.length" />
                  <button @click="updatePlayer" :disabled="!isPosAvailable(position)">Submit</button>
                  <button @click="clearPosition" :disabled="player.position == null">Clear Position</button>
                </div>

                <button v-if="player.isHost" @click="finishGame" class="finish-button">Finish Game</button>
              </div>
            </div>
            <div v-else-if="room?.status === 'finished'">
              <h2>YOU {{result ? 'WON!!' : 'LOST!!'}}</h2>
              <h3>Results</h3>
              <div v-for="r in results" :style="{ backgroundColor: r.correct ? 'lightgreen' : 'lightcoral' }">
                Position #{{ r.position }}: {{ r.hint }} - {{ r.number }}
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar Jogadores -->
        <div class="sidebar-right h-[50vh] overflow-y-auto ml-auto bg-dark p-2 rounded-lg shadow-lg border-1">
          <h3 class="font-bold text-yellow-300 mb-2">Jogadores</h3>
          <ul class="player-list grid grid-cols-2 gap-2">
            <li v-for="p in players" :key="p.id" class="bg-light max-w-30 min-h-15 max-h-20 font-bold shadow-lg text-black rounded-xl pt-1 pb-1 pl-2 pr-2 flex items-center justify-center">
              {{ p.name }} {{ p.isHost ? '👑' : '' }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { socket } from "../socket";
import { ref, onMounted, computed, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useThemeStore } from "../stores/theme.js";
import { useRoomStore } from "../stores/room.js";
import InputPrimary from "../components/InputPrimary.vue";
import ButtonPrimary from "../components/ButtonPrimary.vue";

const route = useRoute();
const router = useRouter();

const themeStore = useThemeStore();
const roomStore = useRoomStore();

const roomCode = route.params.code;

const hint = ref("");
const position = ref(null);
const totalVotes = ref(0);
const currentThemeVote = ref(null);
const playerName = ref("");
const errorMessage = ref("");
const copied = ref(false);
const linkInput = ref(null);
const roomInfo = ref(null);
const result = ref(null);
const results = ref([]);

const player = computed(() => roomStore.getPlayer);
const room = computed(() => roomStore.currentRoom);
const players = computed(() => roomStore.currentRoom?.players || []);

const inviteLink = computed(() => {
  return `${window.location.origin}/room/${roomCode}`;
});

const getPlayerInPos = (position) => {
  const player = players.value.find(p => p.position === position);
  if (player) {
    return `${player.name} (${player.hint || 'no hint'})`;
  }
  return 'Empty';
}

const isPosAvailable = (position) => {
  return getPlayerInPos(position) === 'Empty' && (position >= 1 && position <= players.value.length);
}

const clearPosition = () => {
  position.value = null;
  updatePlayer();
}

const selectLink = () => {
  linkInput.value?.select();
};

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(inviteLink.value);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (err) {
    linkInput.value?.select();
    document.execCommand('copy');
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  }
};

const joinRoomWithName = () => {
  if (!playerName.value.trim()) {
    errorMessage.value = "Please enter your username";
    return;
  }
  
  errorMessage.value = "";
  socket.emit("joinRoom", { 
    roomCode, 
    playerName: playerName.value.trim() 
  }, (res) => {
    if (res.error) {
      errorMessage.value = res.error;
    } else {
      roomStore.setMyId(res.player.id);
      roomStore.setCurrentRoom(res.room);
    }
  });
};

onMounted(() => {
  // If player is not set, fetch room info
  if (!player.value) {
    socket.emit("getRoomInfo", { roomCode }, (res) => {
      if (res.error) {
        errorMessage.value = "Room not found";
        setTimeout(() => router.push("/"), 2000);
      } else {
        roomInfo.value = res.room;
      }
    });
  }
  
  socket.on("playerJoined", (list) => roomStore.setPlayers(list));
  socket.on("playerLeft", ({ playerName, players: list }) => {
    roomStore.setPlayers(list);
    //TODO: Could show a notification that player left
  });
  socket.on("newHost", ({ hostId }) => {
    if (player.value && roomStore.myId === hostId) {
      player.value.isHost = true;
    }
  });
  socket.on("playerUpdated", ({ playerId, hint: h, position: p }) => {
    const pl = players.value.find(p => p.id === playerId);
    if (pl) { 
      pl.hint = h;
      pl.position = p;
    }
  });
  socket.on("themeVotingStarted", ({ themes: t }) => {
    themeStore.setThemeOptions(t);
    roomStore.setRoomStatus("voting");
  });
  socket.on("themeVoted", (votes) => {
    totalVotes.value = votes;
  });
  socket.on("themeSelected", ({ theme }) => {
    themeStore.setSelectedTheme(theme);
    roomStore.setRoomStatus("playing");
  });
  socket.on("assignedNumber", ({ number, playerId }) => {
    roomStore.currentRoom.players.find(p => p.id === playerId).number = number;
  });
  socket.on("gameFinished", (players) => {
    let win = true;
    players.sort((a, b) => a.position > b.position);
    for (let i = 1; i < players.length; i++) {
      if (players[i].number < players[i-1].number) {
        win = false;
        players[i].correct = false;
      }
    }
    result.value = win;
    results.value = players;
    room.value.status = 'finished';
  });
});

onUnmounted(() => {
  // Clean up
  socket.off("playerJoined");
  socket.off("playerLeft");
  socket.off("newHost");
  socket.off("playerUpdated");
  socket.off("themeVotingStarted");
  socket.off("themeVoted");
  socket.off("themeSelected");
  socket.off("assignedNumber");
  socket.off("gameFinished");
});

const updatePlayer = () => {
  if (player.value) {
    socket.emit("updatePlayer", { 
      roomCode, 
      playerId: player.value.id,
      hint: hint.value, 
      position: position.value
    });
  }
};

const voteTheme = (theme) => {
  if (player.value) {
    if (!currentThemeVote.value || currentThemeVote.value.name !== theme.name) {
      socket.emit("voteTheme", { roomCode, playerId: player.value.id, theme: theme });
      currentThemeVote.value = theme;
    } else {
      socket.emit("unvoteTheme", { roomCode, playerId: player.value.id, theme: theme });
      currentThemeVote.value = null;
    }
  }
};

const startThemeVoting = () => socket.emit("startThemeVoting", { roomCode });
const finishGame = () => socket.emit("finishGame", { roomCode });
</script>

<style scoped>

.player-list {
  list-style: none;
  padding: 0;
}

.selected {
  background-color: #4CAF50;
}

.my-number {
  background: #e3f2fd;
  padding: 1.5rem;
  margin: 1rem 0;
  border-radius: 8px;
  text-align: center;

  h2 {
    color: black;
  }
}

.game-input {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 1rem 0;
}

.finish-button {
  background: #f44336;
  margin-top: 2rem;
}
</style>
