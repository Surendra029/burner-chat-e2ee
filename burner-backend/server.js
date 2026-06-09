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

// CRITICAL FIX 1: Cloud Database fallback
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/burner-chat';
mongoose.connect(mongoURI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err.message));

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

// CRITICAL FIX 2: Cloud Port fallback
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Blind Relay Server running on port ${PORT}`);
});