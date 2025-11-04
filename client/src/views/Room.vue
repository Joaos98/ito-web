<template>
  <div class="room-container">
    <!-- Show name prompt if player hasn't joined yet -->
    <div v-if="!player" class="join-prompt">
      <h2>Join Room {{ roomCode }}</h2>
      <p v-if="roomInfo">{{ roomInfo.playerCount }} player(s) in this room</p>
      <div>
        <input 
          v-model="playerName" 
          placeholder="Enter your name" 
          @keyup.enter="joinRoomWithName"
          maxlength="20"
        />
        <button @click="joinRoomWithName" :disabled="!playerName.trim()">Join Room</button>
      </div>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    </div>

    <!-- Regular room UI -->
    <div v-else>
      <div class="room-header">
        <h1>Room: {{ room?.code }}</h1>
        <p class="status">Status: {{ room?.status }}</p>
      </div>
      
      <!-- Show invite link for host -->
      <div v-if="player?.isHost && room?.status === 'lobby'" class="invite-section">
        <h3>Share this link:</h3>
        <div class="invite-link">
          <input 
            type="text" 
            :value="inviteLink" 
            readonly 
            @click="selectLink"
            ref="linkInput"
          />
          <button @click="copyLink">{{ copied ? 'Copied!' : 'Copy' }}</button>
        </div>
      </div>

      <div v-if="room?.status === 'lobby'">
        <h3>Players:</h3>
        <ul class="player-list">
          <li v-for="p in players" :key="p.id">
            {{ p.name }} {{ p.isHost ? '👑' : '' }}
          </li>
        </ul>
        <button @click="startThemeVoting" v-if="player.isHost">Start Game</button>
        <p v-else>Waiting for host to start...</p>
      </div>

      <div v-else-if="room?.status === 'voting'">
        <h3>Vote for a Theme:</h3>
        <div class="theme-buttons">
          <button 
            v-for="t in themeStore.themeOptions" 
            :key="t.name" 
            @click="voteTheme(t)"
            :class="{ selected: currentThemeVote?.name === t.name }"
            class="theme-button"
          >
            <strong>{{ t.name }}</strong><br/>
            <small>{{ t.description }}</small>
          </button>
        </div>
        <p>{{ totalVotes }}/{{ players.length }} voted</p>
        <p v-if="currentThemeVote" class="vote-status">✓ You voted for: {{ currentThemeVote.name }}</p>
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
</template>

<script setup>
import { socket } from "../socket";
import { ref, onMounted, computed, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useThemeStore } from "../stores/theme.js";
import { useRoomStore } from "../stores/room.js";

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
    socket.emit("voteTheme", { roomCode, playerId: player.value.id, theme: theme });
    currentThemeVote.value = theme;
  }
};

const startThemeVoting = () => socket.emit("startThemeVoting", { roomCode });
const finishGame = () => socket.emit("finishGame", { roomCode });
</script>

<style scoped>
.room-container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
}

.join-prompt {
  text-align: center;
  padding: 2rem;
}

.join-prompt input {
  margin: 1rem 0;
  width: 100%;
  max-width: 300px;
}

.invite-section {
  background: #f0f0f0;
  padding: 1rem;
  margin: 1rem 0;
  border-radius: 8px;

  h3 {
    color: black;
  }
}

.invite-link {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.invite-link input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.player-list {
  list-style: none;
  padding: 0;

  li {
    color: black;
  }
}

.player-list li {
  padding: 0.5rem;
  margin: 0.25rem 0;
  background: #f5f5f5;
  border-radius: 4px;
}

.theme-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 1rem 0;
}

.theme-button {
  padding: 1rem;
  text-align: left;
}

.theme-button.selected {
  background: #4CAF50;
  color: white;
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

.error {
  color: #f44336;
  margin-top: 1rem;
}

.vote-status {
  color: #4CAF50;
  font-weight: bold;
}
</style>
