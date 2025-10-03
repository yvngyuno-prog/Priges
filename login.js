const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');

// Firebase config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://yuno2423-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase (avoid duplicate init)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// Generate or get local device ID
let deviceId = localStorage.getItem("deviceId");
if (!deviceId) {
  deviceId = "device-" + Date.now() + "-" + Math.floor(Math.random() * 10000);
  localStorage.setItem("deviceId", deviceId);
}

// Function to redirect to main page
function redirectToMain() {
  window.location.href = "chat/";
}

// Check if device already exists in Firebase
db.ref("users/" + deviceId).once("value")
  .then(snapshot => {
    if (snapshot.exists()) {
      const userData = snapshot.val();
      // Restore session if username + password match
      if (userData.username && userData.password) {
        localStorage.setItem("username", userData.username);
        localStorage.setItem("password", userData.password);
        redirectToMain();
      }
    }
  })
  .catch(error => console.error("Firebase read error:", error));

// Handle login/registration button click
loginBtn.addEventListener('click', () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) {
    alert("Please enter both username and password.");
    return;
  }

  const usersRef = db.ref("users");

  // Check if username already exists
  usersRef.orderByChild("username").equalTo(username).once("value")
    .then(snapshot => {
      if (snapshot.exists()) {
        alert("Username already taken. Please choose another one.");
      } else {
        // Save username + password + deviceId
        db.ref("users/" + deviceId).set({
          username: username,
          password: password,
          deviceId: deviceId,
          timestamp: Date.now()
        }).then(() => {
          // Save locally
          localStorage.setItem("username", username);
          localStorage.setItem("password", password);
          redirectToMain();
        });
      }
    })
    .catch(error => console.error("Firebase write error:", error));
});

// Optional: submit on Enter
[usernameInput, passwordInput].forEach(input => {
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') loginBtn.click();
  });
});
