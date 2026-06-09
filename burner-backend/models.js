const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    publicKey: { type: String, required: true }, 
    socketId: { type: String } 
});

const messageSchema = new mongoose.Schema({
    sender: { type: String, required: true },
    receiver: { type: String, required: true },
    ciphertext: { type: String, required: true }, 
    createdAt: { type: Date, default: Date.now, expires: 86400 } 
});

const User = mongoose.model('User', userSchema);
const Message = mongoose.model('Message', messageSchema);

module.exports = { User, Message };