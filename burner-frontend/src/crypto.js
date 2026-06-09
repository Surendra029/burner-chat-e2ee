export async function generateKeys() {
    const keyPair = await window.crypto.subtle.generateKey(
        { name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
        true,
        ["encrypt", "decrypt"]
    );
    return keyPair;
}

export async function exportPublicKey(key) {
    const exported = await window.crypto.subtle.exportKey("spki", key);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

export async function importPublicKey(base64Key) {
    const binaryDer = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
    return await window.crypto.subtle.importKey(
        "spki", binaryDer.buffer, { name: "RSA-OAEP", hash: "SHA-256" }, true, ["encrypt"]
    );
}

export async function encryptMessage(text, publicKey) {
    const encoded = new TextEncoder().encode(text);
    const ciphertext = await window.crypto.subtle.encrypt({ name: "RSA-OAEP" }, publicKey, encoded);
    return btoa(String.fromCharCode(...new Uint8Array(ciphertext)));
}

export async function decryptMessage(base64Ciphertext, privateKey) {
    const ciphertext = Uint8Array.from(atob(base64Ciphertext), c => c.charCodeAt(0));
    const decrypted = await window.crypto.subtle.decrypt({ name: "RSA-OAEP" }, privateKey, ciphertext);
    return new TextDecoder().decode(decrypted);
}