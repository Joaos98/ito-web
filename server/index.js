import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import Themes from "./data/Themes.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("ITO WebSocket backend running"));

// All in-memory storage
const rooms = {};        // roomCode -> { code, status, players, hostId, themeOptions, selectedTheme }
const themeVotes = {};   // roomCode -> { themeName: [playerIds] }
const playerVotes = {};  // roomCode -> { playerId: themeName }
const socketToPlayer = {}; // socketId -> { playerId, roomCode, playerName }

const getRandomThemes = (count = 5) => {
    const shuffled = [...Themes].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
};

// Helper to clean up room if empty
const cleanupRoom = (roomCode) => {
    if (rooms[roomCode] && rooms[roomCode].players.length === 0) {
        delete rooms[roomCode];
        delete themeVotes[roomCode];
        delete playerVotes[roomCode];
        console.log(`Room ${roomCode} deleted (no players)`);
    }
};

// Helper function to check if all players voted and select winner
const checkAndSelectWinningTheme = async (roomCode) => {
    const room = rooms[roomCode];
    if (!room) return null;

    const totalPlayers = room.players.length;
    const votedPlayers = playerVotes[roomCode] ? Object.keys(playerVotes[roomCode]).length : 0;

    // Check if all players have voted
    if (votedPlayers === totalPlayers) {
        const votes = themeVotes[roomCode] || {};

        // Count votes for each theme
        const themeCounts = {};
        Object.entries(votes).forEach(([themeName, voterIds]) => {
            themeCounts[themeName] = voterIds.length;
        });

        // Find the theme(s) with most votes
        const maxVotes = Math.max(...Object.values(themeCounts));
        const topThemes = Object.keys(themeCounts).filter(t => themeCounts[t] === maxVotes);

        // Randomly select from tied themes
        const winningThemeName = topThemes[Math.floor(Math.random() * topThemes.length)];
        const winningTheme = Themes.find(t => t.name === winningThemeName);

        // Store in memory
        room.selectedTheme = winningTheme;
        room.status = "playing";

        // Notify all players
        io.to(roomCode).emit("themeSelected", { theme: winningTheme });

        // Generate unique random numbers between 1-100 for each player
        const numbers = [];
        while (numbers.length < totalPlayers) {
            const num = Math.floor(Math.random() * 100) + 1;
            if (!numbers.includes(num)) {
                numbers.push(num);
            }
        }

        // Assign numbers to players
        room.players.forEach((player, i) => {
            player.number = numbers[i];

            // Send each player their own number privately
            const socketId = Object.keys(socketToPlayer).find(
                sid => socketToPlayer[sid].playerId === player.id
            );
            if (socketId && io.sockets.sockets.get(socketId)) {
                io.sockets.sockets.get(socketId).emit("assignedNumber", {
                    number: player.number, playerId: player.id
                });
            }
        });

        return winningTheme;
    }

    return null;
};

io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    // Create Room
    socket.on("createRoom", ({ playerName }, callback) => {
        if (!playerName || !playerName.trim()) {
            return callback({ error: "Player name is required" });
        }

        const code = Math.random().toString(36).substring(2, 7).toUpperCase();
        const playerId = `player_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        const player = {
            id: playerId,
            name: playerName.trim(),
            isHost: true,
            number: null,
            hint: null,
            position: null
        };

        socket.join(code);

        rooms[code] = {
            code,
            status: "lobby",
            players: [player],
            hostId: playerId
        };

        socketToPlayer[socket.id] = {
            playerId: playerId,
            roomCode: code,
            playerName: playerName.trim()
        };

        callback({ room: rooms[code], player });
    });

    // Get Room Info (for direct link access)
    socket.on("getRoomInfo", ({ roomCode }, callback) => {
        const room = rooms[roomCode];
        if (!room) return callback({ error: "Room not found" });

        callback({ room: { code: room.code, status: room.status, playerCount: room.players.length } });
    });

    // Join Room
    socket.on("joinRoom", async ({ roomCode, playerName }, callback) => {
        const room = rooms[roomCode];
        if (!room) return callback({ error: "Room not found" });

        if (!playerName || !playerName.trim()) {
            return callback({ error: "Player name is required" });
        }

        // Check if name is already taken in this room
        const nameTaken = room.players.some(p => p.name.toLowerCase() === playerName.trim().toLowerCase());
        if (nameTaken) {
            return callback({ error: "Name already taken in this room" });
        }

        const playerId = `player_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        const player = {
            id: playerId,
            name: playerName.trim(),
            isHost: false,
            number: null,
            hint: null,
            position: null
        };

        socket.join(roomCode);
        room.players.push(player);

        socketToPlayer[socket.id] = {
            playerId: playerId,
            roomCode: roomCode,
            playerName: playerName.trim()
        };

        io.to(roomCode).emit("playerJoined", room.players);
        callback({ room: room, player });
    });

    // Update player (hint, position)
    socket.on("updatePlayer", ({ roomCode, playerId, hint, position }) => {
        const room = rooms[roomCode];
        if (!room) return;

        const player = room.players.find(p => p.id === playerId);
        if (player) {
            player.hint = hint;
            player.position = position;
            io.to(roomCode).emit("playerUpdated", { playerId, hint, position });
        }
    });

    // Start theme voting (host only)
    socket.on("startThemeVoting", ({ roomCode }) => {
        const room = rooms[roomCode];
        if (!room) return;

        const playerInfo = socketToPlayer[socket.id];
        if (!playerInfo || playerInfo.playerId !== room.hostId) {
            return; // Only host can start voting
        }

        const themes = getRandomThemes(5);
        room.themeOptions = themes;
        room.status = "voting";
        themeVotes[roomCode] = {};
        playerVotes[roomCode] = {};
        io.to(roomCode).emit("themeVotingStarted", { themes: themes });
    });

    // Vote theme
    socket.on("voteTheme", async ({ roomCode, playerId, theme }) => {
        if (!themeVotes[roomCode]) themeVotes[roomCode] = {};
        if (!playerVotes[roomCode]) playerVotes[roomCode] = {};

        const themeName = theme.name || theme;
        const previousVote = playerVotes[roomCode][playerId];

        // Remove previous vote
        if (previousVote && themeVotes[roomCode][previousVote]) {
            themeVotes[roomCode][previousVote] = themeVotes[roomCode][previousVote].filter(id => id !== playerId);
        }

        // Add new vote
        if (!themeVotes[roomCode][themeName]) themeVotes[roomCode][themeName] = [];
        themeVotes[roomCode][themeName].push(playerId);
        playerVotes[roomCode][playerId] = themeName;

        // Notify all players
        io.to(roomCode).emit("themeVoted", Object.keys(playerVotes[roomCode]).length);

        // Check if all players voted
        await checkAndSelectWinningTheme(roomCode);
    });

    // Finish game
    socket.on("finishGame", ({ roomCode }) => {
        const room = rooms[roomCode];
        if (!room) return;

        const results = room.players.map(p => ({
            playerId: p.id,
            playerName: p.name,
            number: p.number,
            position: p.position,
            hint: p.hint,
            correct: true
        }));

        io.to(roomCode).emit("gameFinished", results);
    });

    // Handle disconnect
    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);

        const playerInfo = socketToPlayer[socket.id];
        if (playerInfo) {
            const { playerId, roomCode, playerName } = playerInfo;
            const room = rooms[roomCode];

            if (room) {
                // Remove player from room
                room.players = room.players.filter(p => p.id !== playerId);

                // If host left, assign new host
                if (room.hostId === playerId && room.players.length > 0) {
                    room.hostId = room.players[0].id;
                    room.players[0].isHost = true;
                    io.to(roomCode).emit("newHost", { hostId: room.hostId });
                }

                // Notify others
                io.to(roomCode).emit("playerLeft", { playerId, playerName, players: room.players });

                // Cleanup room if empty
                cleanupRoom(roomCode);
            }

            delete socketToPlayer[socket.id];
        }
    });
});

const PORT = 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
