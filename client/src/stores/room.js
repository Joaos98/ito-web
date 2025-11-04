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

    const getPlayer = computed(() => {
        return currentRoom.value.players.find(p => p.id === myId.value);
    });

    const clearRoom = () => {
        currentRoom.value = {
            status: 'lobby',
            players: [],
            code: null
        };
    };

    return {
        currentRoom,
        setCurrentRoom,
        clearRoom,
        setPlayers,
        setRoomStatus,
        getPlayer,
        myId,
        setMyId
    };
});
