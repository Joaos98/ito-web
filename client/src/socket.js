import { io } from "socket.io-client";

// Automatically detect backend URL:
const URL =
    import.meta.env.PROD
        ? window.location.origin // e.g., https://ito-web.fly.dev
        : "http://localhost:8080"; // local dev server

export const socket = io(URL, {
    transports: ["websocket"],
});
