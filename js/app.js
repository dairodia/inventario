import { db, auth, isConfigured } from "./firebase.js";
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, query, orderBy
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import {
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider, 
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

const $ = (id) => document.getElementById(id);
const money = (value) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value || 0);

let products = [];
let unsubscribe = null;

// --- LÓGICA DEL INVENTARIO ---
function render() {
  const search = $("search").value.trim().toLowerCase();
  const filtered = products.filter(p => `${p.name} ${p.category}`.toLowerCase().includes(search));
  
  $("totalProducts").textContent = products.length;
  $("totalUnits").textContent = products.reduce((sum, p) => sum + Number(p.quantity || 0), 0);
  $("totalValue").textContent = money(products.reduce((sum, p) => sum + Number(p.price || 0) * Number(p.quantity || 0), 0));

  if (!filtered.length) {
    $("productRows").innerHTML = `<tr><td colspan="5" class="empty">${products.length ? "No se encontraron productos." : "Todavía no hay productos."}</td></tr>`;
    return;
  }
  
  $("productRows").innerHTML = filtered.map(p => `
    <tr>
      <td>${p.name}</td>
      <td>${p.category}</td>
      <td>${money(p.price)}</td>
      <td>${p.quantity}</td>
      <td class="actions">
        <button class="small-button" onclick="startEdit('${p.id}')">Editar</button>
        <button class="small-button delete" onclick="removeProduct('${p.id}')">Eliminar</button>
      </td>
    </tr>
  `).join('');
}

// Funciones globales para los botones de la tabla
window.startEdit = (id) => {
  const p = products.find(x => x.id === id);
  if(!p) return;
  $("productId").value = p.id; $("name").value = p.name; $("category").value = p.category;
  $("price").value = p.price; $("quantity").value = p.quantity;
  $("formTitle").textContent = "Editar producto"; $("saveButton").textContent = "Guardar cambios";
  $("cancelEdit").classList.remove("hidden"); window.scrollTo({ top: 0, behavior: "smooth" });
};

window.removeProduct = async (id) => {
  if (!confirm("¿Seguro que quieres eliminar este producto?")) return;
  try { await deleteDoc(doc(db, "productos", id)); } catch (error) { console.error(error); }
};

$("cancelEdit").addEventListener("click", () => {
  $("productForm").reset(); $("productId").value = ""; $("formTitle").textContent = "Agregar producto";
  $("saveButton").textContent = "Guardar producto"; $("cancelEdit").classList.add("hidden");
});

$("productForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const product = {
    name: $("name").value.trim(), category: $("category").value.trim(),
    price: Number($("price").value), quantity: Number($("quantity").value), updatedAt: new Date().toISOString()
  };
  const id = $("productId").value;
  try {
    if (id) await updateDoc(doc(db, "productos", id), product);
    else await addDoc(collection(db, "productos"), { ...product, createdAt: new Date().toISOString() });
    $("productForm").reset(); $("productId").value = ""; $("formTitle").textContent = "Agregar producto";
    $("saveButton").textContent = "Guardar producto"; $("cancelEdit").classList.add("hidden");
  } catch (error) { console.error(error); }
});

$("search").addEventListener("input", render);

// --- LÓGICA DE AUTENTICACIÓN ---
const loginMessage = $("loginMessage");
function setMessage(text, error = false) {
  loginMessage.textContent = text;
  loginMessage.style.color = error ? "#b53b3b" : "#167449";
}

// Cambiar entre formularios
$("goToRegister").onclick = (e) => { e.preventDefault(); $("loginForm").style.display = "none"; $("resetForm").style.display = "none"; $("registerForm").style.display = "flex"; $("authTitle").textContent = "Crear cuenta"; setMessage(""); };
$("goToReset").onclick = (e) => { e.preventDefault(); $("loginForm").style.display = "none"; $("registerForm").style.display = "none"; $("resetForm").style.display = "flex"; $("authTitle").textContent = "Recuperar contraseña"; setMessage(""); };
$("goToLoginFromRegister").onclick = (e) => { e.preventDefault(); $("registerForm").style.display = "none"; $("loginForm").style.display = "flex"; $("authTitle").textContent = "Iniciar Sesión"; setMessage(""); };
$("goToLoginFromReset").onclick = (e) => { e.preventDefault(); $("resetForm").style.display = "none"; $("loginForm").style.display = "flex"; $("authTitle").textContent = "Iniciar Sesión"; setMessage(""); };

// Login
$("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault(); setMessage("");
  try { await signInWithEmailAndPassword(auth, $("loginEmail").value, $("loginPassword").value); }
  catch (error) { setMessage("Error: " + error.message, true); }
});

// Registro (CORREGIDO con la "s" de registerForm)
$("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault(); setMessage("");
  if ($("registerPassword").value !== $("registerPassword2").value) return setMessage("Las contraseñas no coinciden.", true);
  try { await createUserWithEmailAndPassword(auth, $("registerEmail").value, $("registerPassword").value); }
  catch (error) { setMessage("Error: " + error.message, true); }
});

// Recuperar
$("resetForm").addEventListener("submit", async (e) => {
  e.preventDefault(); setMessage("");
  try { 
    await sendPasswordResetEmail(auth, $("resetEmail").value); 
    setMessage("Enlace enviado. Revisa tu correo (y spam)."); 
  } catch (error) { setMessage("Error: " + error.message, true); }
});

// Google
$("googleBtn").addEventListener("click", async () => {
  const provider = new GoogleAuthProvider();
  try { await signInWithPopup(auth, provider); } catch (error) { setMessage("Error: " + error.message, true); }
});

// Cerrar sesión
$("logoutBtn").addEventListener("click", () => signOut(auth));

// Mostrar/Ocultar
onAuthStateChanged(auth, (user) => {
  if (user) {
    $("loginScreen").style.display = "none";
    $("appContent").style.display = "block";
    if (!unsubscribe) {
      const q = query(collection(db, "productos"), orderBy("name"));
      unsubscribe = onSnapshot(q, snapshot => {
        products = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        render();
      });
    }
  } else {
    $("loginScreen").style.display = "flex";
    $("appContent").style.display = "none";
    if (unsubscribe) { unsubscribe(); unsubscribe = null; }
    products = []; render();
  }
});