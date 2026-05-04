import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc, onSnapshot, arrayUnion } 
  from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDiUn1geiAd8FHNQtR6L6VcR-hzc_1Ux44",
  authDomain: "wad2601jgg-b9561.firebaseapp.com",
  projectId: "wad2601jgg-b9561",
  storageBucket: "wad2601jgg-b9561.firebasestorage.app",
  messagingSenderId: "1077286369453",
  appId: "1:1077286369453:web:0bd30f4678a99090dbee24"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let menuData = [];

// Toggle modal
window.toggleModal = function() {
  document.getElementById('menuModal').classList.toggle('hidden');
};

// SAVE PRODUCT
window.saveNewMenu = async function() {
  const name = document.getElementById('newName').value;
  const price = parseInt(document.getElementById('newPrice').value);
  const stock = parseInt(document.getElementById('newStock').value);
  const emoji = document.getElementById('newEmoji').value || "🍛";
  const tags = document.getElementById('newTags').value.split(',').map(t => t.trim());

  if (!name || !price || isNaN(stock)) {
    alert("Fill all fields!");
    return;
  }

  await addDoc(collection(db, "products"), {
    name,
    price,
    stock,
    emoji,
    tags,
    createdAt: Date.now()
  });

  alert("Saved to Firebase!");
  toggleModal();
  loadInventory();
};

// LOAD PRODUCTS
async function loadInventory() {
  const snapshot = await getDocs(collection(db, "products"));
  menuData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  renderInventory();
}

// EDIT STOCK
window.editStock = async function(id) {
  const item = menuData.find(m => m.id === id);
  const input = prompt("Update stock:", item.stock);
  if (input === null) return;

  const ref = doc(db, "products", id);
  await updateDoc(ref, { stock: parseInt(input) });
  loadInventory();
};

// RENDER TABLE
function renderInventory() {
  const tbody = document.getElementById('inventory-body');
  if (!tbody) return;

  let lowStock = 0;
  let outOfStock = 0;

  tbody.innerHTML = menuData.map(item => {
    if (item.stock === 0) outOfStock++;
    else if (item.stock <= 5) lowStock++;

    return `
      <tr class="table-row">
        <td>${item.emoji || "🍽️"} ${item.name}</td>
        <td>${(item.tags || []).join(", ")}</td>
        <td class="text-right">Rp ${item.price}</td>
        <td class="text-center">${item.stock}</td>
        <td class="text-right">
          <button onclick="editStock('${item.id}')" class="text-orange-500">Edit</button>
          
            
        </td>
      </tr>
    `;
  }).join("");

  document.getElementById('total-items').innerText = menuData.length;
  document.getElementById('low-stock-count').innerText = lowStock;
  document.getElementById('out-of-stock-count').innerText = outOfStock;
}

window.onload = loadInventory;
window.updateOrderStatus = async function(orderId, nextStatus) {
    try {
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js");
        const orderRef = doc(window.db, "orders", orderId);
        
        await updateDoc(orderRef, {
            status: nextStatus
        });
        
        alert(`Order updated to: ${nextStatus}`);
        // Refresh your seller list here if you have a loadOrders() function
    } catch (e) {
        console.error("Error updating status:", e);
    }
};
// LOAD ORDERS FOR SELLER REALTIME
window.activeOrders = {}; 
function loadOrders() {
    const orderBody = document.getElementById('orders-body');
    if (!orderBody) return;

    onSnapshot(collection(db, "orders"), (querySnapshot) => {
        const orders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        window.activeOrders = orders.reduce((acc, curr) => { acc[curr.id] = curr; return acc; }, {});
        
        orders.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));

        orderBody.innerHTML = orders.map(order => {
            const isProcessing = order.status === "Processing" || !order.status;
            const isPreparing = order.status === "Preparing";
            const isOnTheWay = order.status === "On the Way";
            
            let actionHtml = '';
            if (isProcessing) {
                actionHtml = `<button onclick="updateOrderStatus('${order.id}', 'Preparing')" class="bg-blue-500 text-white px-2 py-1 rounded text-[9px] font-bold">PREPARE</button>`;
            } else if (isPreparing) {
                actionHtml = `<button onclick="updateOrderStatus('${order.id}', 'On the Way')" class="bg-orange-500 text-white px-2 py-1 rounded text-[9px] font-bold">SHIP IT</button>`;
            } else if (isOnTheWay) {
                actionHtml = `<button onclick="updateOrderStatus('${order.id}', 'Delivered')" class="bg-green-500 text-white px-2 py-1 rounded text-[9px] font-bold">FINISH</button>`;
            } else {
                actionHtml = `<span class="text-gray-500 text-[9px]">Completed</span>`;
            }

            return `
                <tr class="table-row border-b border-white/5">
                    <td class="p-3 text-[10px]">#${order.id.slice(-5)}</td>
                    <td class="p-3 text-[10px]">
                        ${order.items ? order.items.map(i => `${i.quantity}x ${i.name}`).join(", ") : "No items"}
                    </td>
                    <td class="p-3 text-[10px] text-orange-400">${order.location?.address || 'No Address'}</td>
                    <td class="p-3 text-[10px]">Rp ${order.totalPrice?.toLocaleString() || 0}</td>
                    <td class="p-3 text-[10px]">
                        <span class="px-2 py-1 rounded bg-orange-500/20 text-orange-500">${order.status || 'Processing'}</span>
                    </td>
                    <td class="p-3 text-right flex justify-end gap-2 items-center">
                        <button onclick="openChatModal('${order.id}')" class="text-white hover:text-orange-500" title="Chat Buyer">💬</button>
                        ${isOnTheWay ? `<button onclick="openTrackerModal('${order.id}')" class="text-white hover:text-green-500" title="Manage Map Tracker">📍</button>` : ''}
                        ${actionHtml}
                    </td>
                </tr>
            `;
        }).join("");
    });
}

// 2. ADD THE CONFIRM BUTTON LOGIC
window.updateOrderStatus = async function(orderId, status) {
    try {
        await updateDoc(doc(db, "orders", orderId), { status });
        
        // If status is On the Way, initialize origin coords to President University
        if (status === "On the Way") {
            await updateDoc(doc(db, "orders", orderId), {
                driverLat: -6.2849,
                driverLng: 107.1706
            });
        }
    } catch (e) {
        console.error("Error updating status:", e);
    }
};

window.confirmOrder = window.updateOrderStatus; // For backwards compatibility

// CHAT MODAL LOGIC
window.activeChatUnsubscribe = null;
window.currentChatOrderId = null;

window.openChatModal = function(orderId) {
    document.getElementById("chatModal").classList.remove("hidden");
    document.querySelector(".order-id-label").innerText = `Order #${orderId.slice(-5)}`;
    window.currentChatOrderId = orderId;
    
    // Subscribe to messages real-time
    if (window.activeChatUnsubscribe) window.activeChatUnsubscribe();
    window.activeChatUnsubscribe = onSnapshot(doc(db, "orders", orderId), (docSnapshot) => {
        if (!docSnapshot.exists()) return;
        const msgList = docSnapshot.data().chatMessages || [];
        const box = document.getElementById("chatBody");
        box.innerHTML = msgList.map(m => `
            <div class="flex flex-col ${m.sender === 'seller' ? 'items-end' : 'items-start'}">
                <span class="text-[8px] text-gray-500 mb-0.5">${m.sender.toUpperCase()}</span>
                <div class="px-3 py-2 rounded-xl max-w-[80%] text-sm ${m.sender === 'seller' ? 'bg-orange-500 text-black rounded-tr-sm' : 'bg-white/10 text-white rounded-tl-sm'}">
                    ${m.text}
                </div>
            </div>
        `).join("");
        box.scrollTop = box.scrollHeight;
    });
};

window.closeChatModal = function() {
    document.getElementById("chatModal").classList.add("hidden");
    if (window.activeChatUnsubscribe) window.activeChatUnsubscribe();
};

document.getElementById("sendChatBtn")?.addEventListener("click", async () => {
    const input = document.getElementById("chatInput");
    const val = input.value.trim();
    if (!val || !window.currentChatOrderId) return;
    
    input.value = "";
    await updateDoc(doc(db, "orders", window.currentChatOrderId), {
        chatMessages: arrayUnion({ sender: 'seller', text: val, time: Date.now() })
    });
});

// MAP TRACKER LOGIC
let driverMarker = null;
let driverMap = null;
window.currentMapOrderId = null;

window.openTrackerModal = function(orderId) {
    document.getElementById("trackerModal").classList.remove("hidden");
    window.currentMapOrderId = orderId;
    
    const order = window.activeOrders[orderId];
    if (!driverMap) {
        // Initialize map
        driverMap = L.map("sellerMap").setView([-6.2849, 107.1706], 15); // PresUniv
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(driverMap);
        
        driverMarker = L.marker([-6.2849, 107.1706], { draggable: true }).addTo(driverMap);
        
        // Send driver position to Firestore instantly when dragged
        driverMarker.on('dragend', async () => {
            if (!window.currentMapOrderId) return;
            const pos = driverMarker.getLatLng();
            await updateDoc(doc(db, "orders", window.currentMapOrderId), {
                driverLat: pos.lat,
                driverLng: pos.lng
            });
        });
    }
    
    // Set position to current driver or PresUniv
    const lat = order.driverLat || -6.2849;
    const lng = order.driverLng || 107.1706;
    driverMarker.setLatLng([lat, lng]);
    driverMap.setView([lat, lng], 15);

    setTimeout(() => { driverMap.invalidateSize(); }, 200);
};

window.closeTrackerModal = function() {
    document.getElementById("trackerModal").classList.add("hidden");
    window.currentMapOrderId = null;
};;

// 3. TRIGGER ON LOAD
// Find your existing window.onload and make sure it calls loadOrders()
const existingOnload = window.onload;
window.onload = function() {
    if (existingOnload) existingOnload();
    loadOrders();
};