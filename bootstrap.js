import { io } from "https://cdn.socket.io/4.3.2/socket.io.esm.min.js";
import { setup } from './main.js';

const socket = io("http://localhost:3000");
socket.on('connect', () => {
    console.log('socket connected', socket.id);
    socket.emit('config', { id: socket.id }, conf => {
        console.log('config', conf)
        setup(conf, socket)
    });
});

