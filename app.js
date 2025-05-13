// app.js
import firebaseConfig from './firebaseConfig.js';
import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// UI Elements
const loginContainer = document.getElementById('login-container');
const chatContainer = document.getElementById('chat-container');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const messageInput = document.getElementById('messageInput');
const messagesDiv = document.getElementById('messages');

document.getElementById('loginBtn').addEventListener('click', login);
document.getElementById('signupLink').addEventListener('click', signup);
document.getElementById('logoutBtn').addEventListener('click', logout);
document.getElementById('sendBtn').addEventListener('click', sendMessage);

// Auth Functions
function login() {
    if (!emailInput.value || !passwordInput.value) {
      alert("Email and password are required.");
      return;
    }
  
    signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value)
      .then(() => {
        emailInput.value = '';
        passwordInput.value = '';
      })
      .catch(error => alert(error.message));
  }

function signup() {
  createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value)
    .then(() => {
      alert("Account created! You can now log in.");
    })
    .catch(error => alert(error.message));
}

function logout() {
  signOut(auth);
}

// Real-time Listener
onAuthStateChanged(auth, user => {
  if (user) {
    loginContainer.classList.add('hidden');
    chatContainer.classList.remove('hidden');
    loadMessages();
  } else {
    loginContainer.classList.remove('hidden');
    chatContainer.classList.add('hidden');
  }
});

// Send message
function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;

  addDoc(collection(db, "messages"), {
    text: text,
    createdAt: serverTimestamp(),
    user: auth.currentUser.email
  });

  messageInput.value = '';
}

// Load messages
function loadMessages() {
  const q = query(collection(db, "messages"), orderBy("createdAt"));
  onSnapshot(q, snapshot => {
    messagesDiv.innerHTML = '';
    snapshot.forEach(doc => {
      const msg = doc.data();
      const div = document.createElement('div');
      div.textContent = `${msg.user}: ${msg.text}`;
      messagesDiv.appendChild(div);
    });
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
}
