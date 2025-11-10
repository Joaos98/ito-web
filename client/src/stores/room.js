import { defineStore } from 'pinia';
import {computed, ref} from 'vue';

export const useRoomStore = defineStore('room', () => {
    const currentRoom = ref({
        status: 'lobby',
        players: [],
        code: null
    });
    const myId = ref(null);

    const setCurrentRoom = (room) => {
        currentRoom.value = { ...currentRoom.value, ...room };
    }

    const setMyId = (id) => {
        myId.value = id;
    }

    const setRoomStatus = (status) => {
        if (currentRoom.value) {
            currentRoom.value.status = status;
        }
    }

    const setPlayers = (list) => {
        if (currentRoom.value) {
            currentRoom.value.players = list;
        }
    }

    const setPlayerNumbers = (players) => {
        if (currentRoom.value && currentRoom.value.players) {
            for (const player of currentRoom.value.players) {
                player.number = players.find(p => p.playerId === player.id)?.number;
            }
        }
    };

    const resetPlayers = () => {
        if (currentRoom.value && currentRoom.value.players) {
            for (const player of currentRoom.value.players) {
                player.number = null;
                player.hint = null;
                player.position = null;
            }
        }
    }

    const getPlayer = computed(() => {
        return currentRoom.value.players.find(p => p.id === myId.value);
    });

    return {
        currentRoom,
        setCurrentRoom,
        setPlayers,
        setRoomStatus,
        getPlayer,
        myId,
        resetPlayers,
        setMyId,
        setPlayerNumbers
    };
});
