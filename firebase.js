// 1. En Firebase Console crea un proyecto y agrega una aplicación web.
// 2. Copia el objeto firebaseConfig que te entrega Firebase y reemplaza los valores.
// 3. Activa Cloud Firestore. Este archivo usa el SDK oficial por CDN.
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "PEGA_AQUI_TU_API_KEY",
  authDomain: "PEGA_AQUI_TU_AUTH_DOMAIN",
  projectId: "PEGA_AQUI_TU_PROJECT_ID",
  storageBucket: "PEGA_AQUI_TU_STORAGE_BUCKET",
  messagingSenderId: "PEGA_AQUI_TU_MESSAGING_SENDER_ID",
  appId: "PEGA_AQUI_TU_APP_ID"
};

const isConfigured = !Object.values(firebaseConfig).some(value => value.startsWith("PEGA_AQUI"));
let db = null;
if (isConfigured) {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
}
export { db, isConfigured };
