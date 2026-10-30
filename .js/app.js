import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB6KS4luN1QD3mT26LtrkJ7m1dh3tUbO10",
  authDomain: "vantastock-fa450.firebaseapp.com",
  projectId: "vantastock-fa450",
  storageBucket: "vantastock-fa450.firebasestorage.app",
  messagingSenderId: "862741064676",
  appId: "1:862741064676:web:d6d260f3e955f2bb92f5f1",
  measurementId: "G-2BYJKM9WZV"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const isConfigured = true; 

export { db, isConfigured };