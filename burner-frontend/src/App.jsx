import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { generateKeys, exportPublicKey, encryptMessage, decryptMessage, importPublicKey } from './crypto';

const socket = io('http://localhost:3001');

function App() {
    // User State
    const [username, setUsername] = useState('');
    const [isRegistered, setIsRegistered] = useState(false);
    const [myPrivateKey, setMyPrivateKey] = useState(null);
    const [myPublicKey, setMyPublicKey] = useState('');

    // Chat State
    const [receiver, setReceiver] = useState('');
    const [receiverPublicKeyBase64, setReceiverPublicKeyBase64] = useState('');
    const [message, setMessage] = useState('');
    const [chat, setChat] = useState([]);

    // 1. Generate keys ONLY when the user clicks "Join"
    const handleRegister = async () => {
        if (!username) return alert("Please enter a username!");
        
        const keys = await generateKeys();
        setMyPrivateKey(keys.privateKey);
        
        const pubKeyString = await exportPublicKey(keys.publicKey);
        setMyPublicKey(pubKeyString);
        
        socket.emit('register', { username, publicKey: pubKeyString });
        setIsRegistered(true);
    };

    // 2. Listen for incoming messages
    useEffect(() => {
        socket.on('receive_message', async ({ sender, ciphertext }) => {
            if (myPrivateKey) {
                try {
                    const decryptedText = await decryptMessage(ciphertext, myPrivateKey);
                    setChat(prev => [...prev, `${sender}: ${decryptedText}`]);
                } catch (err) {
                    console.error("Failed to decrypt message", err);
                }
            }
        });

        return () => socket.off('receive_message');
    }, [myPrivateKey]);

    // 3. Send a securely encrypted message
    const handleSend = async () => {
        if (!receiverPublicKeyBase64 || !receiver) return alert("Need receiver's name and public key!");
        
        try {
            // Clean up the key just in case it has weird formatting
            const cleanKey = receiverPublicKeyBase64.replace(/["'\s]/g, "");
            const receiverKey = await importPublicKey(cleanKey);
            
            const ciphertext = await encryptMessage(message, receiverKey);
            
            socket.emit('send_message', { sender: username, receiver, ciphertext });
            setChat(prev => [...prev, `Me: ${message}`]);
            setMessage('');
        } catch (error) {
            console.error(error);
            alert("Encryption failed. Check the public key format.");
        }
    };

    // --- UI: LOGIN SCREEN ---
    if (!isRegistered) {
        return (
            <div style={{ padding: '50px', fontFamily: 'sans-serif', maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
                <h2>Burner Chat Setup</h2>
                <p style={{ color: '#666' }}>Keys are generated locally on your device.</p>
                <input 
                    placeholder="Enter your username" 
                    value={username}
                    onChange={e => setUsername(e.target.value)} 
                    style={{ padding: '10px', width: '100%', marginBottom: '10px' }} 
                />
                <button onClick={handleRegister} style={{ padding: '10px', width: '100%', background: '#333', color: 'white', border: 'none', cursor: 'pointer' }}>
                    Generate Keys & Join
                </button>
            </div>
        );
    }

    // --- UI: MAIN CHAT SCREEN ---
    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ color: '#d9534f' }}>Secure Chat</h2>
                <span style={{ background: '#eee', padding: '5px 10px', borderRadius: '5px' }}>Logged in as: <strong>{username}</strong></span>
            </div>
            
            <div style={{ background: '#e9ecef', padding: '10px', borderRadius: '5px', marginBottom: '20px', fontSize: '12px', wordBreak: 'break-all' }}>
                <strong>Your Public Key (Share this with friends):</strong><br/>
                {myPublicKey}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                <input placeholder="Receiver's Username (e.g., Bob)" onChange={e => setReceiver(e.target.value)} style={{ padding: '10px' }} />
                <input placeholder="Paste Receiver's Public Key here..." onChange={e => setReceiverPublicKeyBase64(e.target.value)} style={{ padding: '10px' }} />
            </div>
            
            <div style={{ border: '2px solid #333', height: '300px', overflowY: 'auto', padding: '10px', backgroundColor: '#f9f9f9', marginBottom: '10px' }}>
                {chat.length === 0 ? <p style={{ color: '#888' }}>No messages yet...</p> : null}
                {chat.map((msg, i) => <div key={i} style={{ margin: '5px 0', padding: '8px', background: '#d1e7dd', borderRadius: '5px' }}>{msg}</div>)}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
                <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Type a secure message..." style={{ flex: 1, padding: '10px' }} />
                <button onClick={handleSend} style={{ padding: '10px 20px', background: '#333', color: 'white', border: 'none', cursor: 'pointer' }}>Send</button>
            </div>
        </div>
    );
}

export default App;