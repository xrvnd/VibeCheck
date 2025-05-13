// app.js
import firebaseConfig from "./firebaseConfig.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  setDoc,
  doc,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// UI Elements
const loginContainer = document.getElementById("login-container");
const chatContainer = document.getElementById("chat-container");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const messageInput = document.getElementById("messageInput");
const messagesDiv = document.getElementById("messages");
const displayNameInput = document.getElementById("displayName");

document.getElementById("loginBtn").addEventListener("click", () => {
  if (isSignupMode) {
    signup();
  } else {
    login();
  }
});
document.getElementById("signupLink").addEventListener("click", signup);
document.getElementById("logoutBtn").addEventListener("click", logout);
document.getElementById("sendBtn").addEventListener("click", sendMessage);

let isSignupMode = false;

document.getElementById("signupLink").addEventListener("click", (e) => {
  e.preventDefault();
  isSignupMode = !isSignupMode;

  if (isSignupMode) {
    displayNameInput.style.display = "block";
    loginBtn.textContent = "Sign Up";
  } else {
    displayNameInput.style.display = "none";
    loginBtn.textContent = "Login";
  }
});

// Auth Functions
function login() {
  if (!emailInput.value || !passwordInput.value) {
    alert("Email and password are required.");
    return;
  }

  signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value)
    .then(() => {
      emailInput.value = "";
      passwordInput.value = "";
    })
    .catch((error) => alert(error.message));
}

function signup() {
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const displayName = displayNameInput.value.trim();

  if (!email || !password || !displayName) {
    alert("Email, password, and display name are required.");
    return;
  }

  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      // Save display name in Firestore under users/{uid}
      return setDoc(doc(db, "users", user.uid), {
        email: user.email,
        displayName: displayName,
      });
    })
    .then(() => {
      alert("Account created! You can now log in.");
    })
    .catch((error) => {
      console.error("Signup error:", error);
      alert("Signup failed: " + error.message);
    });
}

function logout() {
  signOut(auth);
}

// Real-time Listener
onAuthStateChanged(auth, (user) => {
  if (user) {
    loginContainer.classList.add("hidden");
    chatContainer.classList.remove("hidden");
    loadMessages();
  } else {
    loginContainer.classList.remove("hidden");
    chatContainer.classList.add("hidden");
  }
});

// Send message
function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;

  addDoc(collection(db, "messages"), {
    text: text,
    createdAt: serverTimestamp(),
    user: auth.currentUser.email,
  });

  messageInput.value = "";
}

// Load messages
const userCache = {};

async function loadMessages() {
  const q = query(collection(db, "messages"), orderBy("createdAt"));
  onSnapshot(q, async (snapshot) => {
    messagesDiv.innerHTML = "";

    for (const docSnap of snapshot.docs) {
      const msg = docSnap.data();

      let name = msg.user;

      // Try to get cached display name
      if (!userCache[name]) {
        try {
          const userDocs = await getDocs(collection(db, "users"));
          userDocs.forEach((doc) => {
            const data = doc.data();
            userCache[data.email] = data.displayName;
          });
        } catch (e) {
          console.error("Error fetching users:", e);
        }
      }

      const displayName = userCache[msg.user] || msg.user;

      const div = document.createElement("div");
      div.textContent = `${displayName}: ${msg.text}`;
      messagesDiv.appendChild(div);
    }

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
}
