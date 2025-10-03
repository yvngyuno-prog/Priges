// =========================
// MAIN.JS - PRIGES Chat with device ID verification, username + password check
// =========================

const inputBox = document.getElementById('messageInput');
const sendBtn = document.querySelector('.chat-input button');
const chatMessages = document.getElementById('chatMessages');
const messageSound = document.getElementById('messageSound');

let audioUnlocked = false; // Track if audio is unlocked

// Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://yuno2423-default-rtdb.asia-southeast1.firebasedatabase.app/",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Get credentials from localStorage
let deviceId = localStorage.getItem("deviceId");
let username = localStorage.getItem("username");
let password = localStorage.getItem("password"); // also check password

// If missing any credentials → redirect back to login
if (!deviceId || !username || !password) {
    window.location.href = "../index.html"; 
} else {
    // Verify deviceId in Firebase
    db.ref("users/" + deviceId).once("value")
        .then(snapshot => {
            if (!snapshot.exists()) {
                // Device not registered
                alert("Device not registered. Redirecting to login.");
                localStorage.clear();
                window.location.href = "../index.html";
            } else {
                const userData = snapshot.val();
                if (userData.username !== username || userData.password !== password) {
                    // Credentials don’t match database → force login
                    alert("Invalid credentials. Redirecting to login.");
                    localStorage.clear();
                    window.location.href = "../index.html";
                } else {
                    initChat();
                }
            }
        })
        .catch(err => {
            console.error("Firebase error:", err);
            localStorage.clear();
            window.location.href = "../index.html";
        });
}

// Unlock audio on first interaction
sendBtn.addEventListener("click", () => {
    if (!audioUnlocked) {
        messageSound.play().catch(() => {});
        audioUnlocked = true;
    }
});

// =========================
// Chat logic
// =========================
function initChat() {

    function isAtBottom() {
        return chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight <= 5;
    }

    function createMessageBubble(message) {
        const atBottom = isAtBottom();

        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message", message.deviceId === deviceId ? "me" : "other");

        const usernameSpan = document.createElement("span");
        usernameSpan.classList.add("username");
        usernameSpan.textContent = message.sender;
        usernameSpan.style.fontWeight = "bold";
        messageDiv.appendChild(usernameSpan);

        const textSpan = document.createElement("span");
        textSpan.textContent = message.text;
        messageDiv.appendChild(textSpan);

        const timestampSpan = document.createElement("span");
        timestampSpan.classList.add("timestamp");
        timestampSpan.textContent = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        messageDiv.appendChild(timestampSpan);

        chatMessages.appendChild(messageDiv);

        if (atBottom) {
            chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: "smooth" });
        }

        // Play sound only after interaction
        if (audioUnlocked) {
            messageSound.currentTime = 0;
            messageSound.play();
        }
    }

    function sendMessage() {
        const messageText = inputBox.value.trim();
        if (!messageText) return;

        db.ref("messages").push({
            text: messageText,
            sender: username,
            deviceId: deviceId,
            timestamp: Date.now()
        });

        inputBox.value = "";
    }

    sendBtn.addEventListener("click", sendMessage);
    inputBox.addEventListener("keydown", e => {
        if (e.key === "Enter") sendMessage();
    });

    db.ref("messages").on("child_added", snapshot => {
        const message = snapshot.val();
        if (!message || !message.text) return;
        createMessageBubble(message);
    });
}
