const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const { User, Message } = require('./models');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// This matches your local MongoDB Compass connection!
mongoose.connect('mongodb://localhost:27017/burner-chat');

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('register', async ({ username, publicKey }) => {
        await User.findOneAndUpdate(
            { username }, 
            { publicKey, socketId: socket.id }, 
            { upsert: true, new: true }
        );
        console.log(`${username} registered their public key.`);
    });

    socket.on('send_message', async ({ sender, receiver, ciphertext }) => {
        const msg = new Message({ sender, receiver, ciphertext });
        await msg.save();

        const receiverUser = await User.findOne({ username: receiver });
        if (receiverUser && receiverUser.socketId) {
            io.to(receiverUser.socketId).emit('receive_message', { sender, ciphertext });
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

server.listen(3001, () => {
    console.log('Blind Relay Server running on port 3001');
});