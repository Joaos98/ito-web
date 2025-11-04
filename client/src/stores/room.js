import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useRoomStore = defineStore('room', () => {
    const currentRoom = ref({
        status: 'lobby',
        players: [],
        code: null
    });

    const setCurrentRoom = (room) => {
        currentRoom.value = { ...currentRoom.value, ...room };
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
        setRoomStatus
    };
});
