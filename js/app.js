import { db, isConfigured } from "./firebase.js";
import {
  collection, addDoc, getDocs, updateDoc, deleteDoc, doc,
  onSnapshot, query, orderBy
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const $ = (id) => document.getElementById(id);
const form = $("productForm");
const rows = $("productRows");
const message = $("formMessage");
const money = (value) => new Intl.NumberFormat("es-CO", {
  style: "currency", currency: "COP", maximumFractionDigits: 0
}).format(value || 0);

let products = [];
let unsubscribe = null;

function setMessage(text, error = false) {
  message.textContent = text;
  message.style.color = error ? "#b53b3b" : "#167449";
}

function render() {
  const search = $("search").value.trim().toLowerCase();
  const filtered = products.filter(p =>
    `${p.name} ${p.category}`.toLowerCase().includes(search)
  );
  $("totalProducts").textContent = products.length;
  $("totalUnits").textContent = products.reduce((sum, p) => sum + Number(p.quantity || 0), 0);
  $("totalValue").textContent = money(products.reduce((sum, p) => sum + Number(p.price || 0) * Number(p.quantity || 0), 0));
  
  if (!filtered.length) {
    rows.innerHTML = `<tr><td colspan="5" class="empty">${products.length ? "No se encontraron productos." : "Todavía no hay productos. Agrega el primero arriba."}</td></tr>`;
    return;
  }
  
  rows.innerHTML = "";
  filtered.forEach(p => {
    const tr = document.createElement("tr");
    const values = [p.name, p.category, money(p.price), p.quantity];
    values.forEach(value => {
      const td = document.createElement("td");
      td.textContent = value;
      tr.appendChild(td);
    });
    const actions = document.createElement("td");
    const wrap = document.createElement("div");
    wrap.className = "actions";
    const edit = document.createElement("button");
    edit.className = "small-button";
    edit.textContent = "Editar";
    edit.addEventListener("click", () => startEdit(p));
    const remove = document.createElement("button");
    remove.className = "small-button delete";
    remove.textContent = "Eliminar";
    remove.addEventListener("click", () => removeProduct(p.id));
    wrap.append(edit, remove);
    actions.appendChild(wrap);
    tr.appendChild(actions);
    rows.appendChild(tr);
  });
}

function startEdit(p) {
  $("productId").value = p.id;
  $("name").value = p.name;
  $("category").value = p.category;
  $("price").value = p.price;
  $("quantity").value = p.quantity;
  $("formTitle").textContent = "Editar producto";
  $("saveButton").textContent = "Guardar cambios";
  $("cancelEdit").classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetForm() {
  form.reset();
  $("productId").value = "";
  $("formTitle").textContent = "Agregar producto";
  $("saveButton").textContent = "Guardar producto";
  $("cancelEdit").classList.add("hidden");
}

async function removeProduct(id) {
  if (!db) return setMessage("Primero configura Firebase en firebase.js.", true);
  if (!confirm("¿Seguro que quieres eliminar este producto?")) return;
  try {
    await deleteDoc(doc(db, "productos", id));
    setMessage("Producto eliminado.");
  } catch (error) {
    console.error(error);
    setMessage("No se pudo eliminar. Revisa la conexión y las reglas de Firestore.", true);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!db) return setMessage("Falta conectar Firebase. Sigue los pasos de firebase.js.", true);
  const product = {
    name: $("name").value.trim(),
    category: $("category").value.trim(),
    price: Number($("price").value),
    quantity: Number($("quantity").value),
    updatedAt: new Date().toISOString()
  };
  if (!product.name || !product.category || product.price < 0 || product.quantity < 0) {
    return setMessage("Revisa los datos del producto.", true);
  }
  try {
    const id = $("productId").value;
    if (id) await updateDoc(doc(db, "productos", id), product);
    else await addDoc(collection(db, "productos"), { ...product, createdAt: new Date().toISOString() });
    resetForm();
    setMessage(id ? "Producto actualizado correctamente." : "Producto guardado correctamente.");
  } catch (error) {
    console.error(error);
    setMessage("No se pudo guardar. Revisa las reglas de Firestore y la configuración.", true);
  }
});

$("cancelEdit").addEventListener("click", resetForm);
$("search").addEventListener("input", render);

if (isConfigured && db) {
  $("connectionBadge").textContent = "Firebase configurado";
  $("connectionBadge").style.background = "#e0f7e9";
  $("connectionBadge").style.color = "#17633e";
  const q = query(collection(db, "productos"), orderBy("name"));
  unsubscribe = onSnapshot(q, snapshot => {
    products = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    render();
  }, error => {
    console.error(error);
    setMessage("No se pudieron leer los productos. Revisa las reglas de Firestore.", true);
  });
} else {
  $("connectionBadge").textContent = "Falta configurar Firebase";
  products = [];
  render();
}

window.addEventListener("beforeunload", () => unsubscribe?.());