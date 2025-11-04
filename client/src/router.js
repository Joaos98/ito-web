import { createRouter, createWebHistory } from "vue-router";
import Home from "./views/Home.vue";
import Room from "./views/Room.vue";

const routes = [
    { path: "/", component: Home },
    { path: "/room/:code", component: Room, props: {Room: true} }
];

export default createRouter({ history: createWebHistory(), routes });
