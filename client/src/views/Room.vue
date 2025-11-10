<template>
  <div class="h-full w-full flex flex-col justify-center items-center relative">
    <div class="room-header w-full mb-auto flex justify-between">
      <h1 class="text-2xl font-bold text-yellow-300">ito online</h1>
      <h1 v-if="room?.code" class="text-2xl font-bold text-yellow-300">Sala {{ room?.code }}</h1>
    </div>
    <div class="flex flex-col w-full flex-1 justify-center items-center">
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
        <div v-else class="flex w-full h-full items-center justify-center">
          <div
              :class="['main-content flex flex-col w-full flex-1 h-full items-center', room?.status === 'playing' ? 'justify-between' : 'justify-center']">
            <div v-if="room?.status === 'playing'">
              <!--Placeholder for Justify Between-->
            </div>
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
                <ButtonPrimary :disabled="players?.length <= 1" @click="startThemeVoting">Começar!</ButtonPrimary>
              </div>
              <!-- Lobby: Mensagem caso o Jogador não seja o host -->
              <div v-if="room?.status === 'lobby' && !player?.isHost">
                <p>Esperando o host começar a partida...</p>
              </div>
              <!-- Votação: Votação dos Temas -->
              <div v-else-if="room?.status === 'voting'" class="p-3">
                <h3 class="font-bold text-yellow-300 mb-5">Vote em um Tema!</h3>
                <div class="flex">
                  <button
                      v-for="t in themeStore.themeOptions"
                      :key="t.name"
                      @click="voteTheme(t)"
                      :class="{ selected: currentThemeVote?.name === t.name }"
                      class="p-2 m-1 rounded-lg max-w-75 shadow-lg bg-light text-black hover:bg-yellow-300 transition duration-200"
                  >
                    <span class="font-bold text-sm">{{ t.name }}</span><br/>
                    <small>{{ t.description }}</small>
                  </button>
                </div>
                <p v-if="currentThemeVote" class="text-[#4CAF50] font-bold">Você votou em: {{ currentThemeVote.name }}!</p>
                <p v-else class="text-[#B03D3D] font-bold"> Você ainda não votou!</p>
                <p class="text-yellow-300 mt-5">Votos: {{ totalVotes }}/{{ players.length }}</p>
              </div>
              <!-- Em Jogo: Board do Jogo -->
              <div v-else-if="room?.status === 'playing' || room?.status === 'finished'">
                <div class="text-yellow-300 mb-10">
                  <h2 class="text-3xl font-bold">{{themeStore.selectedTheme?.name}}</h2>
                  <h3 class="text-sm">{{themeStore.selectedTheme?.description}}</h3>
                </div>
                <div class="game-board flex gap-2 items-end justify-center flex-wrap">
                  <div class="player-card rounded-xl w-[125px] h-[175px] bg-[#d0b249] shadow-lg border-light border-2 items-center justify-center flex">
                    <p class="font-bold text-black text-4xl">0</p>
                  </div>
                  <PlayerCard v-for="position in players.length" :key="position" :position="position" :player="getPlayerInPos(position)"/>
                </div>
              </div>
              <!-- Resultados: Final do Jogo -->
              <div v-if="room?.status === 'finished'" class="mt-5">
                <p class="font-bold text-xl">
                  Vocês <span :class="result ? 'text-[#4CAF50]' : 'text-[#B03D3D]'">{{result ? 'ganharam!!' : 'perderam!!'}}</span>
                </p>
              </div>
            </div>
            <!-- Em Jogo: Centro de Controle -->
            <div v-if="room?.status === 'playing'" class="flex gap-10 justify-center items-center bg-dark rounded-full shadow-lg border-1 border-light p-10">
              <div v-if="player.number" class="text-yellow-300">
                <h2>Seu número é</h2>
                <span class="text-3xl font-bold">{{player.number}}</span>
              </div>

              <div class="flex flex-col gap-2">
                <InputPrimary v-model="hint" placeholder="Sua Dica" />
                <InputPrimary type="number" v-model.number="position" placeholder="Sua Posição" min="1" :max="players.length" />
                <div class="flex w-full gap-2">
                  <ButtonPrimary class="flex-1" @click="updatePlayer" :disabled="!isPosAvailable(position)">Enviar</ButtonPrimary>
                  <ButtonPrimary class="flex-1" @click="clearPosition" :disabled="player.position == null">Remover</ButtonPrimary>
                </div>
              </div>

              <ButtonPrimary v-if="player.isHost" @click="finishGame" :disabled="!allCardsPlayed">GG!</ButtonPrimary>
            </div>
          </div>

          <!-- Sidebar Jogadores -->
          <div class="sidebar-right h-[50vh] overflow-y-auto ml-auto bg-dark p-2 rounded-lg shadow-lg border-1">
            <h3 class="font-bold text-yellow-300 mb-2">Jogadores</h3>
            <ul class="player-list grid grid-cols-2 gap-2">
              <li v-for="p in players" :key="p.id"
                  :class="['bg-yellow-300 max-w-30 min-h-15 max-h-20 font-bold shadow-lg text-black border-2 border-light rounded-2xl pt-1 pb-1 pl-2 pr-2 flex items-center justify-center', !p.position ? 'opacity-50 border-dashed' : '']">
                {{ p.name }} {{ p.isHost ? '👑' : '' }}
              </li>
            </ul>
          </div>
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
import PlayerCard from "../components/PlayerCard.vue";

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

const player = computed(() => roomStore.getPlayer);
const room = computed(() => roomStore.currentRoom);
const players = computed(() => roomStore.currentRoom?.players || []);

const inviteLink = computed(() => {
  return `${window.location.origin}/r/${roomCode}`;
});

const allCardsPlayed = computed(() => {
  for (let p of players.value) {
    if (p.position == null) return false;
  }
  return true;
});

const getPlayerInPos = (position) => {
  const player = players.value.find(p => p.position === position);
  if (player) {
    return player;
  }
  return null;
}

const isPosAvailable = (position) => {
  return getPlayerInPos(position) === null && (position >= 1 && position <= players.value.length);
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
  socket.on("playerLeft", ({ players: list }) => {
    roomStore.setPlayers(list);
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
    room.value.status = 'finished';
    roomStore.setPlayerNumbers(players);
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
</style>
